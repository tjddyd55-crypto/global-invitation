/**
 * Guard: Figma Make Main 화면(`src/features/main/ui/**`)이 레거시 PcHomeContent /
 * MobileHomeContent 를 다시 끌어오지 못하게 막는다.
 *
 * 배경: DesktopMainScreen.tsx / MainScreen.tsx 는 한때 `src/ui/pc/PcHomeContent`,
 * `src/ui/mobile/MobileHomeContent` 를 그대로 재export 하는 alias 였다. 지금은
 * Figma 구조를 직접 구현하므로, 이 스크립트는 그 회귀를 감지한다.
 *
 * Usage: node scripts/assert-no-dev-home-ui.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FRONTEND = path.join(ROOT, 'frontend');

const FORBIDDEN = ['PcHomeContent', 'MobileHomeContent'];

const TARGET_FILES = [
  'src/features/main/ui/pc/DesktopMainScreen.tsx',
  'src/features/main/ui/mobile/MainScreen.tsx',
];

function fail(msg) {
  console.error(`[assert:no-dev-home-ui] FAIL: ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`[assert:no-dev-home-ui] OK: ${msg}`);
}

let failures = 0;

for (const rel of TARGET_FILES) {
  const full = path.join(FRONTEND, rel);
  if (!fs.existsSync(full)) {
    fail(`missing required file ${rel}`);
    failures += 1;
    continue;
  }
  const src = fs.readFileSync(full, 'utf8');
  for (const needle of FORBIDDEN) {
    if (src.includes(needle)) {
      fail(`${rel} must not reference "${needle}" — implement the Figma structure directly`);
      failures += 1;
    }
  }
}

if (failures === 0) {
  ok('Main screens implement Figma structure directly (no PcHomeContent/MobileHomeContent alias)');
  process.exit(0);
}
process.exit(1);
