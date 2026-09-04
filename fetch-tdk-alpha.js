/**
 * TDK GTS'den HARF BAZLI arama yaparak tüm kelimeleri çeker.
 * Endpoint: https://sozluk.gov.tr/yazim?ara=A (A harfi ile başlayan kelimeler)
 * Her harf için listeyi alır, sonra her kelimenin anlamını çeker.
 */

const fs = require('fs');
const https = require('https');

const OUT_FILE = 'data/tdk-full-dictionary.json';
const PROGRESS_FILE = 'data/tdk-alpha-progress.json';
const CONCURRENCY = 10;
const DELAY_MS = 80;

// Türk alfabesi
const TR_ALPHABET = [
  'a','b','c','ç','d','e','f','g','ğ','h',
  'ı','i','j','k','l','m','n','o','ö','p',
  'r','s','ş','t','u','ü','v','y','z'
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function get(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

// Harfle başlayan tüm kelimeleri listele
async function fetchWordList(letter) {
  const url = `https://sozluk.gov.tr/yazim?ara=${encodeURIComponent(letter)}`;
  const data = await get(url);
  if (!Array.isArray(data)) return [];
  return data.map(item => item.madde).filter(Boolean);
}

// Tek kelimenin anlamını çek
async function fetchMeaning(word) {
  const url = `https://sozluk.gov.tr/gts?ara=${encodeURIComponent(word)}`;
  const data = await get(url);
  if (!Array.isArray(data) || !data[0]?.anlamlarListe?.[0]) return null;
  const anlam = data[0].anlamlarListe[0].anlam;
  if (!anlam || anlam.includes('bakınız') || anlam.length < 4) return null;
  return anlam;
}

async function processBatch(words) {
  return Promise.all(words.map(async (word) => {
    await sleep(Math.random() * DELAY_MS);
    const meaning = await fetchMeaning(word);
    return { word: word.toLocaleUpperCase('tr-TR'), meaning };
  }));
}

async function main() {
  // Mevcut sözlüğü yükle
  const dict = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const existing = new Set();
  for (const list of Object.values(dict)) {
    for (const e of list) existing.add(e.word);
  }
  console.log(`Mevcut: ${existing.size} kelime`);

  // İlerleme
  let doneLetters = new Set();
  if (fs.existsSync(PROGRESS_FILE)) {
    const prog = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    doneLetters = new Set(prog.doneLetters || []);
    console.log(`Tamamlanan harfler: ${[...doneLetters].join(', ')}`);
  }

  let totalAdded = 0;

  for (const letter of TR_ALPHABET) {
    if (doneLetters.has(letter)) {
      console.log(`[${letter.toUpperCase()}] Zaten tamamlandı, atlanıyor...`);
      continue;
    }

    console.log(`\n[${letter.toUpperCase()}] Kelime listesi alınıyor...`);
    let wordList = await fetchWordList(letter);
    
    // Sadece 4-9 harf, saf Türkçe harf içerenler, mevcut olmayanlar
    wordList = wordList
      .filter(w => {
        const up = w.toLocaleUpperCase('tr-TR');
        return (
          up.length >= 4 && up.length <= 9 &&
          /^[ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ]+$/.test(up) &&
          !existing.has(up)
        );
      });

    console.log(`[${letter.toUpperCase()}] Çekilecek yeni kelime: ${wordList.length}`);

    let addedThisLetter = 0;

    for (let i = 0; i < wordList.length; i += CONCURRENCY) {
      const batch = wordList.slice(i, i + CONCURRENCY);
      const results = await processBatch(batch);

      for (const { word, meaning } of results) {
        if (!meaning) continue;
        const len = word.length.toString();
        if (!dict[len]) dict[len] = [];
        dict[len].push({ word, meaning });
        existing.add(word);
        addedThisLetter++;
        totalAdded++;
      }

      process.stdout.write(`\r  ${i + CONCURRENCY}/${wordList.length} işlendi, ${addedThisLetter} eklendi...`);
    }

    console.log(`\n[${letter.toUpperCase()}] ✅ Tamamlandı. ${addedThisLetter} yeni kelime eklendi.`);

    // Kaydet
    doneLetters.add(letter);
    fs.writeFileSync(OUT_FILE, JSON.stringify(dict));
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ doneLetters: [...doneLetters] }));

    await sleep(500); // Harfler arası bekleme
  }

  console.log('\n\n✅ TÜMÜ TAMAMLANDI!');
  console.log(`Toplam eklenen: ${totalAdded} yeni kelime`);
  
  const totals = Object.entries(dict)
    .sort((a,b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([k,v]) => `  ${k} harf: ${v.length} kelime`)
    .join('\n');
  console.log('Final:\n' + totals);
}

main().catch(console.error);
