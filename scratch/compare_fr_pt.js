
import fs from 'fs';

const content = fs.readFileSync('/Users/amed/tasbih-digital-antigravity/tasbih-digital/i18n/translations.ts', 'utf8');

function getKeysMap(lang) {
    const startRegex = new RegExp(`^  ${lang}: \\{`, 'm');
    const match = content.match(startRegex);
    if (!match) return null;
    const startIndex = match.index;
    
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
    // This regex is better at finding keys. It looks for lines like: "key": "value" or key: "value" or key: {
    const lines = block.split('\n');
    let path = [];
    const keyPathMap = new Set();

    for (let line of lines) {
        const keyMatch = line.match(/^\s*"?([a-zA-Z0-9_]+)"?:\s*([\{"])/);
        if (keyMatch) {
            const key = keyMatch[1];
            const isObject = keyMatch[2] === '{';
            
            // Determine depth based on indentation
            const indent = line.match(/^\s*/)[0].length;
            const depth = indent / 2; // Assuming 2 spaces indent
            
            // This is complex to get right without a parser, but let's try a simpler approach:
            // Just find all leaf keys.
            if (line.includes(': "') || line.includes(': `')) {
                // Find the full path? No, let's just use the key name for now, 
                // but that's not unique.
                // Let's use a simple stateful parser for paths.
            }
        }
    }
    
    // Actually, let's just use a regex to find all "key": "value" pairs and store the full string to compare.
    const pairs = [];
    const regex = /"?([a-zA-Z0-9_]+)"?:\s*"([^"]*)"/g;
    let m;
    while ((m = regex.exec(block)) !== null) {
        pairs.push(m[1]);
    }
    return pairs;
}

const frKeys = getKeysMap('fr');
const ptKeys = getKeysMap('pt');

const missingInPt = frKeys.filter(k => !ptKeys.includes(k));
console.log('Missing in PT (relative to FR):', missingInPt);
