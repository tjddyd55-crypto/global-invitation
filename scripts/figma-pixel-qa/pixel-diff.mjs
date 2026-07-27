/**
 * Figma reference vs Railway actual pixel overlay/diff.
 * Usage: node scripts/figma-pixel-qa/pixel-diff.mjs
 */
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const REF_DIR = path.join(ROOT, 'artifacts/figma-reference');
const ACT_DIR = path.join(ROOT, 'artifacts/railway-actual');
const OUT_DIR = path.join(ROOT, 'artifacts/figma-diff');
const REPORT = path.join(OUT_DIR, 'diff-report.json');

function listPngs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png')).sort();
}

function readPng(filePath) {
  return PNG.sync.read(fs.readFileSync(filePath));
}

function resizeToMatch(src, width, height) {
  if (src.width === width && src.height === height) return src;
  const out = new PNG({ width, height });
  // Nearest-neighbor crop/pad — never stretch to hide diffs.
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const di = (width * y + x) << 2;
      if (x < src.width && y < src.height) {
        const si = (src.width * y + x) << 2;
        out.data[di] = src.data[si];
        out.data[di + 1] = src.data[si + 1];
        out.data[di + 2] = src.data[si + 2];
        out.data[di + 3] = src.data[si + 3];
      } else {
        out.data[di] = 255;
        out.data[di + 1] = 0;
        out.data[di + 2] = 255;
        out.data[di + 3] = 255;
      }
    }
  }
  return out;
}

function writeSideBySide(a, b, outPath) {
  const width = a.width + b.width + 16;
  const height = Math.max(a.height, b.height);
  const out = new PNG({ width, height });
  out.data.fill(240);
  for (let y = 0; y < a.height; y += 1) {
    for (let x = 0; x < a.width; x += 1) {
      const si = (a.width * y + x) << 2;
      const di = (width * y + x) << 2;
      out.data[di] = a.data[si];
      out.data[di + 1] = a.data[si + 1];
      out.data[di + 2] = a.data[si + 2];
      out.data[di + 3] = a.data[si + 3];
    }
  }
  const ox = a.width + 16;
  for (let y = 0; y < b.height; y += 1) {
    for (let x = 0; x < b.width; x += 1) {
      const si = (b.width * y + x) << 2;
      const di = (width * y + (ox + x)) << 2;
      out.data[di] = b.data[si];
      out.data[di + 1] = b.data[si + 1];
      out.data[di + 2] = b.data[si + 2];
      out.data[di + 3] = b.data[si + 3];
    }
  }
  fs.writeFileSync(outPath, PNG.sync.write(out));
}

function writeOverlay(a, b, outPath) {
  const out = new PNG({ width: a.width, height: a.height });
  for (let i = 0; i < a.data.length; i += 4) {
    out.data[i] = Math.round(a.data[i] * 0.5 + b.data[i] * 0.5);
    out.data[i + 1] = Math.round(a.data[i + 1] * 0.5 + b.data[i + 1] * 0.5);
    out.data[i + 2] = Math.round(a.data[i + 2] * 0.5 + b.data[i + 2] * 0.5);
    out.data[i + 3] = 255;
  }
  fs.writeFileSync(outPath, PNG.sync.write(out));
}

function comparePair(name) {
  const refPath = path.join(REF_DIR, name);
  const actPath = path.join(ACT_DIR, name);
  if (!fs.existsSync(refPath) || !fs.existsSync(actPath)) {
    return { name, status: 'MISSING', mismatchPixels: null, mismatchRatio: null };
  }

  let ref = readPng(refPath);
  let act = readPng(actPath);
  const width = Math.max(ref.width, act.width);
  const height = Math.max(ref.height, act.height);
  ref = resizeToMatch(ref, width, height);
  act = resizeToMatch(act, width, height);

  const diff = new PNG({ width, height });
  const mismatchPixels = pixelmatch(ref.data, act.data, diff.data, width, height, {
    threshold: 0.1,
    includeAA: true,
  });
  const total = width * height;
  const mismatchRatio = mismatchPixels / total;
  const base = name.replace(/\.png$/i, '');

  fs.mkdirSync(OUT_DIR, { recursive: true });
  writeSideBySide(ref, act, path.join(OUT_DIR, `${base}-side-by-side.png`));
  writeOverlay(ref, act, path.join(OUT_DIR, `${base}-overlay.png`));
  fs.writeFileSync(path.join(OUT_DIR, `${base}-diff.png`), PNG.sync.write(diff));

  return {
    name,
    status: mismatchRatio <= 0.02 ? 'PASS' : mismatchRatio <= 0.08 ? 'REVIEW' : 'FAIL',
    width,
    height,
    mismatchPixels,
    mismatchRatio: Number(mismatchRatio.toFixed(6)),
    files: {
      sideBySide: `artifacts/figma-diff/${base}-side-by-side.png`,
      overlay: `artifacts/figma-diff/${base}-overlay.png`,
      diff: `artifacts/figma-diff/${base}-diff.png`,
    },
  };
}

const refFiles = listPngs(REF_DIR);
const actFiles = listPngs(ACT_DIR);
const names = Array.from(new Set([...refFiles, ...actFiles])).sort();
const results = names.map(comparePair);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(
  REPORT,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      referenceCount: refFiles.length,
      actualCount: actFiles.length,
      comparedCount: results.filter((r) => r.status !== 'MISSING').length,
      results,
    },
    null,
    2
  ),
  'utf8'
);

console.log(JSON.stringify({ report: REPORT, summary: results.map((r) => ({ name: r.name, status: r.status, mismatchRatio: r.mismatchRatio })) }, null, 2));
