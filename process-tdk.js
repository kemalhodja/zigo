const fs = require('fs');

console.log('Reading 109MB GTS JSON (JSONL format)...');
const rawData = fs.readFileSync('data/gts.json', 'utf8');
const lines = rawData.split('\n');

const dict = [];
for (const line of lines) {
    if (!line.trim()) continue;
    try {
        dict.push(JSON.parse(line));
    } catch(e) {}
}

console.log(`Parsed ${dict.length} items. Filtering valid words...`);

const result = {
    "4": [], "5": [], "6": [], "7": [], "8": [], "9": []
};

for (const item of dict) {
    const word = item.madde;
    if (!word) continue;
    
    // Only pure alphabetical Turkish words without spaces, hyphens, or numbers
    if (!/^[abcçdefgğhıijklmnoöprsştuüvyzABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ]+$/.test(word)) {
        continue;
    }
    
    const len = word.length;
    if (len >= 4 && len <= 9) {
        if (item.anlamlarListe && item.anlamlarListe.length > 0) {
            let meaning = item.anlamlarListe[0].anlam;
            if (meaning && !meaning.includes("bakınız")) {
                result[len.toString()].push({
                    word: word.toLocaleUpperCase('tr-TR'),
                    meaning: meaning
                });
            }
        }
    }
}

for (let len = 4; len <= 9; len++) {
    console.log(`Length ${len}: ${result[len.toString()].length} words.`);
}

fs.writeFileSync('data/tdk-full-dictionary.json', JSON.stringify(result));
console.log('Successfully wrote data/tdk-full-dictionary.json');
