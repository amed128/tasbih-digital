
import fs from 'fs';

const content = fs.readFileSync('/Users/amed/tasbih-digital-antigravity/tasbih-digital/i18n/translations.ts', 'utf8');

// This is a bit hacky because it's not a JSON file, but let's try to extract keys.
// A better way is to parse the file or use a regex to find keys.

function getKeys(lang) {
    const startRegex = new RegExp(`${lang}: \\{`);
    const startIndex = content.search(startRegex);
    if (startIndex === -1) return null;
    
    // Find the end of this block. This is tricky with nested objects.
    // Let's just extract the block and then find keys.
    let braceCount = 0;
    let endIndex = -1;
    let started = false;
    for (let i = startIndex; i < content.length; i++) {
        if (content[i] === '{') {
            braceCount++;
            started = true;
        } else if (content[i] === '}') {
            braceCount--;
        }
        if (started && braceCount === 0) {
            endIndex = i;
            break;
        }
    }
    
    if (endIndex === -1) return null;
    
    const block = content.substring(startIndex, endIndex + 1);
    const keys = [];
    // Match "key": or key:
    const keyRegex = /"?([a-zA-Z0-9_]+)"?:\s*[\{"]/g;
    let match;
    while ((match = keyRegex.exec(block)) !== null) {
        keys.push(match[1]);
    }
    return keys;
}

const enKeys = getKeys('en');
const ptKeys = getKeys('pt');

if (!enKeys || !ptKeys) {
    console.log('Could not find keys');
    process.exit(1);
}

const missingInPt = enKeys.filter(k => !ptKeys.includes(k));
const extraInPt = ptKeys.filter(k => !enKeys.includes(k));

console.log('Missing in PT:', missingInPt);
console.log('Extra in PT:', extraInPt);
console.log('EN key count:', enKeys.length);
console.log('PT key count:', ptKeys.length);
