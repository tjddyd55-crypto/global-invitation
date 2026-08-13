import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const TEMPLATES_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKIP_DIRS = new Set(['messageSimple', 'messageThankYou', 'messageBranded']);

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || entry.name === 'node_modules') continue;
      walk(full, acc);
      continue;
    }
    if (/\.(tsx|ts|jsx|js)$/.test(entry.name) && !entry.name.includes('.test.')) {
      acc.push(full);
    }
  }
  return acc;
}

test('invitation renderers do not import service useI18n', () => {
  const leaks: string[] = [];
  for (const file of walk(TEMPLATES_DIR)) {
    const text = fs.readFileSync(file, 'utf8');
    if (!text.includes("from '@/src/contexts/I18nContext'") && !/\buseI18n\s*\(/.test(text)) {
      continue;
    }
    leaks.push(path.relative(TEMPLATES_DIR, file).replaceAll('\\', '/'));
  }
  assert.deepEqual(leaks, []);
});
