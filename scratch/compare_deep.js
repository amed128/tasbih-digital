
import fs from 'fs';

const content = fs.readFileSync('/Users/amed/tasbih-digital-antigravity/tasbih-digital/i18n/translations.ts', 'utf8');

function getLangBlock(lang) {
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
    return content.substring(startIndex, endIndex + 1);
}

function getAllKeys(block) {
    const keys = [];
    const lines = block.split('\n');
    let stack = [];
    
    for (let line of lines) {
        const trimmed = line.trim();
        if (trimmed.endsWith('{')) {
            const match = trimmed.match(/^"?([a-zA-Z0-9_]+)"?:\s*\{/);
            if (match) stack.push(match[1]);
        } else if (trimmed === '},' || trimmed === '}') {
            stack.pop();
        } else {
            const match = trimmed.match(/^"?([a-zA-Z0-9_]+)"?:\s*["`]/);
            if (match) {
                keys.push([...stack, match[1]].join('.'));
            }
        }
    }
    return keys;
}

const frBlock = getLangBlock('fr');
const ptBlock = getLangBlock('pt');

const frKeys = getAllKeys(frBlock);
const ptKeys = getAllKeys(ptBlock);

const missingInPt = frKeys.filter(k => !ptKeys.includes(k));
const extraInPt = ptKeys.filter(k => !frKeys.includes(k));

console.log('Missing in PT:', missingInPt);
console.log('Extra in PT:', extraInPt);
