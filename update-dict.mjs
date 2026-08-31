import fs from 'fs';
import https from 'https';

const urls = [
  'https://raw.githubusercontent.com/utkusen/turkce-wordlist/master/wordlist.txt',
  'https://raw.githubusercontent.com/CanNuhlar/Turkce-Kelime-Listesi/master/turkcekelimeler.txt'
];

async function fetchWords(u) {
  return new Promise((resolve, reject) => {
    https.get(u, (res) => {
      let data = '';
      if (res.statusCode !== 200) {
        return reject(new Error('Status ' + res.statusCode));
      }
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  let data = null;
  for (const url of urls) {
    try {
      console.log('Trying', url);
      data = await fetchWords(url);
      break;
    } catch(e) {
      console.error('Failed', url, e.message);
    }
  }

  if (!data) {
    console.error('All failed');
    return;
  }

  const words = data.split('\n').map(w => w.trim()).filter(w => w && !w.includes(' '));
  
  const trJsonPath = 'public/dictionaries/tr-words.json';
  const existing = JSON.parse(fs.readFileSync(trJsonPath, 'utf8'));
  
  const set4 = new Set(existing["4"] || []);
  const set5 = new Set(existing["5"] || []);
  const set6 = new Set(existing["6"] || []);
  
  for (const w of words) {
    const upper = w.toLocaleUpperCase('tr-TR');
    if (upper.length === 4) set4.add(upper);
    else if (upper.length === 5) set5.add(upper);
    else if (upper.length === 6) set6.add(upper);
  }
  
  existing["4"] = Array.from(set4);
  existing["5"] = Array.from(set5);
  existing["6"] = Array.from(set6);
  
  fs.writeFileSync(trJsonPath, JSON.stringify(existing));
  console.log(`Added words. 4: ${existing["4"].length}, 5: ${existing["5"].length}, 6: ${existing["6"].length}`);
}
run();
