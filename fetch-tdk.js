const fs = require('fs');
const https = require('https');

const rawWords = JSON.parse(fs.readFileSync('public/dictionaries/tr-words.json', 'utf8'));
const outPath = 'public/dictionaries/tdk-words.json';

const BATCH_SIZE = 50;

async function fetchMeaning(word) {
    return new Promise((resolve) => {
        const url = `https://sozluk.gov.tr/gts?ara=${encodeURIComponent(word)}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (Array.isArray(json) && json[0] && json[0].anlamlarListe && json[0].anlamlarListe[0]) {
                        resolve(json[0].anlamlarListe[0].anlam);
                    } else {
                        resolve(null);
                    }
                } catch(e) { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

async function run() {
    const result = { "4": [], "5": [], "6": [] };
    
    for (const len of [4, 5, 6]) {
        let words = rawWords[len.toString()] || [];
        // filter out junk words
        words = words.filter(w => /^[A-ZÇĞİÖŞÜ]+$/.test(w));
        // shuffle
        words = words.sort(() => 0.5 - Math.random()).slice(0, 500); // 500 words per length
        
        console.log(`Fetching meanings for ${words.length} ${len}-letter words...`);
        for (let i = 0; i < words.length; i += BATCH_SIZE) {
            const batch = words.slice(i, i + BATCH_SIZE);
            const promises = batch.map(async (word) => {
                const meaning = await fetchMeaning(word);
                if (meaning && !meaning.includes("bakınız") && meaning.length > 5) {
                    result[len].push({ word, meaning });
                }
            });
            await Promise.all(promises);
            console.log(`Processed ${Math.min(i + BATCH_SIZE, words.length)}/${words.length} for length ${len}`);
        }
    }
    
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log(`Wrote ${result["4"].length} (4), ${result["5"].length} (5), ${result["6"].length} (6) words to ${outPath}`);
}

run();
