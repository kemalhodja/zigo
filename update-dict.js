const fs = require('fs');
const path = require('path');

const tdkWords = JSON.parse(fs.readFileSync('public/dictionaries/tdk-words.json', 'utf8'));

let currentFile = fs.readFileSync('src/components/games/word-dictionary.ts', 'utf8');

// The file exports WORD_DICTIONARY. I will use regex or string manipulation to update the TR section.
// Actually, it's easier to just parse the JS object, but it's typescript so we can't easily require it.
// Let's generate a completely new TS file.

const en4 = [
  { word: "MIND", meaning: "The element of a person that enables them to be aware of the world." },
  { word: "IDEA", meaning: "A thought or suggestion as to a possible course of action." },
  { word: "BOOK", meaning: "A written or printed work consisting of pages glued or sewn together." },
  { word: "STAR", meaning: "A fixed luminous point in the night sky." },
  { word: "DATA", meaning: "Facts and statistics collected together for reference or analysis." },
  { word: "HOPE", meaning: "A feeling of expectation and desire for a certain thing to happen." },
  { word: "WIND", meaning: "Moving air." },
  { word: "FIRE", meaning: "Combustion that produces light and heat." },
  { word: "TREE", meaning: "A woody perennial plant with a trunk." },
  { word: "ROAD", meaning: "A way leading from one place to another." },
  { word: "CITY", meaning: "A large town." },
  { word: "KING", meaning: "The male ruler of a country." },
  { word: "GAME", meaning: "An activity played according to rules." },
  { word: "TIME", meaning: "The indefinite continued progress of existence." },
  { word: "LIFE", meaning: "The condition that distinguishes living things." },
  { word: "HAND", meaning: "The end part of a person's arm." },
  { word: "MOON", meaning: "The natural satellite of the Earth." },
  { word: "RAIN", meaning: "Water falling from clouds." }
];

const en5 = [
  { word: "BRAIN", meaning: "An organ of soft nervous tissue contained in the skull." },
  { word: "LOGIC", meaning: "Reasoning conducted according to strict principles of validity." },
  { word: "LEARN", meaning: "Gain knowledge of or skill in something." },
  { word: "SPACE", meaning: "A continuous area or expanse which is free." },
  { word: "EARTH", meaning: "The planet on which we live." },
  { word: "PEACE", meaning: "Freedom from disturbance; tranquility." },
  { word: "SMART", meaning: "Having or showing quick-witted intelligence." },
  { word: "SKILL", meaning: "The ability to do something well." },
  { word: "TRUTH", meaning: "The quality or state of being true." },
  { word: "OCEAN", meaning: "A very large expanse of sea." },
  { word: "RIVER", meaning: "A large flowing stream of water." },
  { word: "LIGHT", meaning: "Radiant energy that makes vision possible." },
  { word: "NIGHT", meaning: "The time between sunset and sunrise." },
  { word: "CLOUD", meaning: "A visible mass of water droplets in the sky." },
  { word: "SMILE", meaning: "A pleased, kind expression on the face." },
  { word: "BRAVE", meaning: "Ready to face danger or pain." },
  { word: "TIGER", meaning: "A large striped wild cat." },
  { word: "MOUSE", meaning: "A small rodent with a pointed snout." },
  { word: "HORSE", meaning: "A large animal used for riding." }
];

const en6 = [
  { word: "REASON", meaning: "A cause, explanation, or justification for an action." },
  { word: "WISDOM", meaning: "The quality of having experience and good judgment." },
  { word: "NATURE", meaning: "The phenomena of the physical world collectively." },
  { word: "PLANET", meaning: "A celestial body moving around a star." },
  { word: "FUTURE", meaning: "The time following the moment of speaking." },
  { word: "THEORY", meaning: "A system of ideas intended to explain something." },
  { word: "SYSTEM", meaning: "A set of connected things forming a complex whole." },
  { word: "GARDEN", meaning: "A plot of ground for growing flowers or vegetables." },
  { word: "FOREST", meaning: "A large area covered chiefly with trees." },
  { word: "ANIMAL", meaning: "A living organism that feeds on organic matter." },
  { word: "ROCKET", meaning: "A vehicle that travels into space." },
  { word: "MEMORY", meaning: "The ability to remember past experiences." },
  { word: "FRIEND", meaning: "A person you know well and like." },
  { word: "SUMMER", meaning: "The warmest season of the year." },
  { word: "WINTER", meaning: "The coldest season of the year." },
  { word: "CASTLE", meaning: "A large fortified building." },
  { word: "BRIDGE", meaning: "A structure carrying a road across a river." },
  { word: "MARKET", meaning: "A place where goods are bought and sold." }
];

// Combine existing TR with new TDK
// Extracted from original file manually for simplicity, but I can also use regex
// Just doing a regex replace on the file contents is safer so we don't lose anything else.

let newTr4 = tdkWords["4"];
let newTr5 = tdkWords["5"];
let newTr6 = tdkWords["6"];

function replaceArray(str, lenStr, replacementArr) {
    const startStr = `${lenStr}: [`;
    const startIndex = str.indexOf(startStr);
    if (startIndex === -1) return str;
    
    // Find the end of this array
    let bracketCount = 0;
    let endIndex = startIndex + startStr.length - 1; // points to '['
    for (let i = endIndex; i < str.length; i++) {
        if (str[i] === '[') bracketCount++;
        else if (str[i] === ']') bracketCount--;
        
        if (bracketCount === 0) {
            endIndex = i;
            break;
        }
    }
    
    // Original contents
    const originalArrStr = str.substring(startIndex + startStr.length, endIndex).trim();
    
    // Construct new array contents
    let newItems = replacementArr.map(w => `      { word: "${w.word}", meaning: ${JSON.stringify(w.meaning)} }`);
    
    let combined = originalArrStr;
    if (combined && !combined.endsWith(',')) combined += ',';
    
    const finalContent = `${startStr}\n${combined}\n${newItems.join(',\n')}\n    ]`;
    
    return str.substring(0, startIndex) + finalContent + str.substring(endIndex + 1);
}

// Ensure we only replace within the TR block
let trBlockStart = currentFile.indexOf('TR: {');
let enBlockStart = currentFile.indexOf('EN: {');

let trSection = currentFile.substring(trBlockStart, enBlockStart);
trSection = replaceArray(trSection, '4', newTr4);
trSection = replaceArray(trSection, '5', newTr5);
trSection = replaceArray(trSection, '6', newTr6);

currentFile = currentFile.substring(0, trBlockStart) + trSection + currentFile.substring(enBlockStart);

fs.writeFileSync('src/components/games/word-dictionary.ts', currentFile);
console.log('Successfully updated word-dictionary.ts with TDK words');
