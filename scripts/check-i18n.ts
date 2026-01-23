import { I18N_KEYS } from '../frontend/src/i18n/keys';
import { LOCALES } from '../frontend/src/i18n/locales';

function collectKeys(value: unknown, keys: Set<string>): void {
  if (typeof value === 'string') {
    keys.add(value);
    return;
  }

  if (value && typeof value === 'object') {
    for (const child of Object.values(value as Record<string, unknown>)) {
      collectKeys(child, keys);
    }
  }
}

const keySet = new Set<string>();
collectKeys(I18N_KEYS, keySet);
const sortedKeys = [...keySet].sort();

let hasError = false;

for (const [language, dictionary] of Object.entries(LOCALES)) {
  const localeKeys = new Set(Object.keys(dictionary));
  const missing = sortedKeys.filter((key) => !localeKeys.has(key));
  const extra = [...localeKeys].filter((key) => !keySet.has(key)).sort();

  if (missing.length > 0) {
    hasError = true;
    console.error(`[i18n] ${language} missing keys (${missing.length}): ${missing.join(', ')}`);
  }

  if (extra.length > 0) {
    hasError = true;
    console.error(`[i18n] ${language} extra keys (${extra.length}): ${extra.join(', ')}`);
  }
}

if (hasError) {
  process.exitCode = 1;
}
