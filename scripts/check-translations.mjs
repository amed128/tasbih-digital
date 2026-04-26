import { translations } from '../i18n/translations.ts';

function getKeys(obj, prefix = '') {
  return Object.keys(obj).flatMap(k => {
    const val = obj[k];
    const full = prefix ? `${prefix}.${k}` : k;
    return typeof val === 'object' && val !== null ? getKeys(val, full) : [full];
  });
}

const enKeys = new Set(getKeys(translations.en));
const langs = Object.keys(translations).filter(l => l !== 'en');

let failed = false;

for (const lang of langs) {
  const langKeys = new Set(getKeys(translations[lang]));
  const missing = [...enKeys].filter(k => !langKeys.has(k));
  const extra = [...langKeys].filter(k => !enKeys.has(k));

  if (missing.length || extra.length) {
    console.error(`\n[translations] ❌ ${lang}: ${missing.length} missing, ${extra.length} extra`);
    missing.forEach(k => console.error(`  MISSING: ${k}`));
    extra.forEach(k => console.error(`  EXTRA:   ${k}`));
    failed = true;
  } else {
    console.log(`[translations] ✓ ${lang}: ${langKeys.size} keys OK`);
  }
}

if (failed) process.exit(1);
