const fs = require('fs');

const tdk = JSON.parse(fs.readFileSync('data/tdk-full-dictionary.json', 'utf8'));
const existing = JSON.parse(fs.readFileSync('public/dictionaries/tr-words.json', 'utf8'));

const result = {};

// TDK sözlüğündeki tüm kelimeleri al
for (const [len, list] of Object.entries(tdk)) {
  result[len] = list.map(item => item.word);
}

// Eski sözlükteki kelimeleri de (varsa) ekle, böylece daralma olmaz
for (const [len, list] of Object.entries(existing)) {
  if (!result[len]) result[len] = [];
  result[len].push(...list);
}

// Tekrar edenleri temizle
for (const len of Object.keys(result)) {
  const uniqueSet = new Set(result[len]);
  result[len] = Array.from(uniqueSet);
  console.log(`Uzunluk ${len}: ${result[len].length} kelime`);
}

fs.writeFileSync('public/dictionaries/tr-words.json', JSON.stringify(result));
console.log('tr-words.json başarıyla güncellendi!');
