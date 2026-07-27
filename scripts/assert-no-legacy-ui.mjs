/**
 * Guard: user-facing routes must not ship Legacy marketing / FULL-engine UI.
 *
 * Fails if:
 * - app routes import HomePageClient
 * - forbidden Legacy copy appears in canonical route sources
 * - (optional) built chunks for / and /create/concept contain forbidden strings
 *
 * Usage: node scripts/assert-no-legacy-ui.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FRONTEND = path.join(ROOT, 'frontend');

const FORBIDDEN = [
  '디지털 초대장과 메시지를 한 곳에서',
  'Self Basic',
  'Self Plus',
  'FULL 엔진 시작',
  'Invitation Full Engine',
  'FULL · Concept-driven',
  'HomePageClient',
  // Figma Make 마케팅/컨셉 화면은 PcShell/MobileShell 사이드바를 쓰지 않는다.
  // (platformShell.ts 'marketing' — src/shared/platform/platformShell.ts)
  'PcShell',
  'MobileShell',
  'PcHomeContent',
  'Global Invitation 데스크톱',
  '테스트룸',
  '모바일 버전 보기',
];

const ROUTE_GLOBS = [
  'app/page.tsx',
  'app/templates/page.tsx',
  'app/create/page.tsx',
  'app/create/concept/page.tsx',
  'app/layout.tsx',
  'src/components/ClientLayout.tsx',
];

function read(rel) {
  const full = path.join(FRONTEND, rel);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf8');
}

function fail(msg) {
  console.error(`[assert:no-legacy-ui] FAIL: ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`[assert:no-legacy-ui] OK: ${msg}`);
}

let failures = 0;

for (const rel of ROUTE_GLOBS) {
  const src = read(rel);
  if (src == null) {
    if (rel === 'app/create/concept/page.tsx') {
      fail(`missing required route ${rel}`);
      failures += 1;
    }
    continue;
  }
  for (const needle of FORBIDDEN) {
    if (src.includes(needle)) {
      fail(`${rel} contains forbidden "${needle}"`);
      failures += 1;
    }
  }
  if (rel === 'app/page.tsx') {
    if (!src.includes('MainScreen') && !src.includes('DesktopMainScreen')) {
      fail('app/page.tsx must wire Figma MainScreen / DesktopMainScreen');
      failures += 1;
    }
    if (src.includes('from') && src.includes('HomePageClient')) {
      fail('app/page.tsx must not import HomePageClient');
      failures += 1;
    }
  }
  if (rel === 'app/create/concept/page.tsx') {
    if (!src.includes('ConceptSelectionScreen')) {
      fail('app/create/concept/page.tsx must wire ConceptSelectionScreen');
      failures += 1;
    }
  }
  if (rel === 'app/templates/page.tsx') {
    if (!src.includes('redirect') || !src.includes('/create/concept')) {
      fail('app/templates/page.tsx must redirect to /create/concept');
      failures += 1;
    }
  }
}

// HomePageClient must remain orphan (no route imports)
const appDir = path.join(FRONTEND, 'app');
function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/\.(tsx|ts|jsx|js)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}
const routeFiles = walk(appDir);
for (const file of routeFiles) {
  const src = fs.readFileSync(file, 'utf8');
  if (/HomePageClient/.test(src) && !/assert-no-legacy/.test(src)) {
    fail(`route file imports/references HomePageClient: ${path.relative(FRONTEND, file)}`);
    failures += 1;
  }
}

const nextServerPage = path.join(FRONTEND, '.next/server/app/page.js');
if (fs.existsSync(nextServerPage)) {
  const built = fs.readFileSync(nextServerPage, 'utf8');
  for (const needle of ['Self Basic', 'FULL 엔진 시작', 'Invitation Full Engine', '디지털 초대장과 메시지를 한 곳에서']) {
    if (built.includes(needle)) {
      fail(`.next/server/app/page.js contains "${needle}" — rebuild required`);
      failures += 1;
    }
  }
  if (built.includes('HomePageClient')) {
    fail('.next/server/app/page.js still bundles HomePageClient');
    failures += 1;
  } else {
    ok('built page.js has no HomePageClient');
  }
} else {
  ok('skip built chunk check (.next missing — run after next build)');
}

if (failures === 0) {
  ok('canonical routes are Figma presentation (no Legacy marketing/FULL engine)');
  process.exit(0);
}
process.exit(1);
