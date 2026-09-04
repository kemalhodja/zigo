/**
 * TDK GTS API'den toplu kelime anlamı çekme scripti
 * - tr-words.json içindeki tüm kelimeleri alır
 * - tdk-full-dictionary.json'da olmayan kelimelerin anlamını TDK'dan çeker
 * - Anlam bulunanları tdk-full-dictionary.json'a ekler
 * - İlerlemeyi her 100 kelimede bir kaydeder (kesilebilir/devam edilebilir)
 */

const fs = require('fs');
const https = require('https');

const CONCURRENCY = 8;        // Aynı anda max istek sayısı
const DELAY_MS = 120;         // İstekler arası bekleme (ms)
const SAVE_EVERY = 200;       // Kaç kelimede bir kaydedilsin
const PROGRESS_FILE = 'data/tdk-fetch-progress.json';
const OUT_FILE = 'data/tdk-full-dictionary.json';
const WORDS_FILE = 'public/dictionaries/tr-words.json';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fetchMeaning(word) {
  return new Promise((resolve) => {
    const url = `https://sozluk.gov.tr/gts?ara=${encodeURIComponent(word)}`;
    const req = https.get(url, { timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (Array.isArray(json) && json[0] && json[0].anlamlarListe && json[0].anlamlarListe[0]) {
            const anlam = json[0].anlamlarListe[0].anlam;
            if (anlam && !anlam.includes('bakınız') && anlam.length > 4) {
              resolve(anlam);
              return;
            }
          }
        } catch(e) {}
        resolve(null);
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

async function processBatch(words) {
  const results = await Promise.all(words.map(async (word) => {
    await sleep(Math.random() * DELAY_MS);
    const meaning = await fetchMeaning(word);
    return { word, meaning };
  }));
  return results;
}

async function main() {
  // Mevcut TDK sözlüğünü yükle
  const dict = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  
  // Mevcut sözlükteki kelimeleri Set'e al (hızlı lookup)
  const existing = new Set();
  for (const list of Object.values(dict)) {
    for (const entry of list) existing.add(entry.word);
  }
  console.log(`Mevcut sözlükte ${existing.size} kelime var.`);

  // tr-words.json'dan tüm kelimeleri al
  const trWords = JSON.parse(fs.readFileSync(WORDS_FILE, 'utf8'));
  
  // İlerleme dosyasını kontrol et (devam senaryosu)
  let processed = new Set();
  if (fs.existsSync(PROGRESS_FILE)) {
    const prog = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    processed = new Set(prog.processed || []);
    console.log(`Önceki oturumdan ${processed.size} kelime işlenmiş, kaldığı yerden devam ediliyor...`);
  }

  // İşlenecek kelimeleri topla (mevcut + önceden işlenmiş hariç)
  const toFetch = [];
  for (const [len, words] of Object.entries(trWords)) {
    const lenNum = parseInt(len);
    if (lenNum < 4 || lenNum > 9) continue;
    for (const word of words) {
      const upper = typeof word === 'string' ? word.toLocaleUpperCase('tr-TR') : word.word;
      if (!existing.has(upper) && !processed.has(upper)) {
        toFetch.push({ word: upper, len: lenNum });
      }
    }
  }
  
  console.log(`\nToplam çekilecek kelime: ${toFetch.length}`);
  console.log(`Tahmini süre: ~${Math.ceil(toFetch.length / CONCURRENCY * DELAY_MS / 1000 / 60)} dakika\n`);

  let added = 0;
  let failed = 0;
  let saveCounter = 0;

  for (let i = 0; i < toFetch.length; i += CONCURRENCY) {
    const batch = toFetch.slice(i, i + CONCURRENCY);
    const results = await processBatch(batch.map(b => b.word));
    
    for (const { word, meaning } of results) {
      const len = word.length;
      const key = len.toString();
      processed.add(word);
      
      if (meaning) {
        if (!dict[key]) dict[key] = [];
        dict[key].push({ word, meaning });
        existing.add(word);
        added++;
      } else {
        failed++;
      }
    }

    saveCounter += batch.length;
    
    // İlerlemeyi kaydet
    if (saveCounter >= SAVE_EVERY) {
      fs.writeFileSync(OUT_FILE, JSON.stringify(dict));
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ processed: Array.from(processed) }));
      saveCounter = 0;
      
      const pct = ((i + CONCURRENCY) / toFetch.length * 100).toFixed(1);
      const totals = Object.entries(dict).map(([k,v]) => `${k}:${v.length}`).join(', ');
      console.log(`[${pct}%] İşlenen: ${i + CONCURRENCY}/${toFetch.length} | Eklenen: ${added} | Başarısız: ${failed}`);
      console.log(`  Sözlük: ${totals}`);
    }
  }

  // Final kayıt
  fs.writeFileSync(OUT_FILE, JSON.stringify(dict));
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ processed: Array.from(processed) }));
  
  console.log('\n✅ Tamamlandı!');
  console.log(`Toplam eklenen yeni kelime: ${added}`);
  console.log(`Anlam bulunamayan: ${failed}`);
  const totals = Object.entries(dict).map(([k,v]) => `  Uzunluk ${k}: ${v.length} kelime`).join('\n');
  console.log('Final sözlük:\n' + totals);
}

main().catch(console.error);
