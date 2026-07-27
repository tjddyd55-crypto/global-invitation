/**
 * Layout / masked pixel diff for Figma QA.
 *
 * Modes:
 * - layout: solid placeholders, primary PASS/FAIL metric (masked mismatch)
 * - real: content-aware; image interiors can be masked; not primary verdict
 *
 * Thresholds (masked layout mismatch):
 * - <= 0.02 PASS
 * - <= 0.05 REVIEW
 * - > 0.05 FAIL
 */
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const QA_ROOT = path.join(ROOT, 'artifacts/figma-pixel-qa');
const REF_DIR = path.join(QA_ROOT, 'reference');
const ACT_DIR = path.join(QA_ROOT, 'actual');
const OVERLAY_DIR = path.join(QA_ROOT, 'overlay');
const DIFF_DIR = path.join(QA_ROOT, 'diff');
const MASKED_DIR = path.join(QA_ROOT, 'masked-diff');
const REPORTS_DIR = path.join(QA_ROOT, 'reports');

const PASS_MAX = 0.02;
const REVIEW_MAX = 0.05;

function ensureDirs() {
  for (const dir of [REF_DIR, ACT_DIR, OVERLAY_DIR, DIFF_DIR, MASKED_DIR, REPORTS_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function listPngs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png')).sort();
}

function readPng(filePath) {
  return PNG.sync.read(fs.readFileSync(filePath));
}

function cropToCommon(src, width, height) {
  const out = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const si = (src.width * y + x) << 2;
      const di = (width * y + x) << 2;
      out.data[di] = src.data[si];
      out.data[di + 1] = src.data[si + 1];
      out.data[di + 2] = src.data[si + 2];
      out.data[di + 3] = src.data[si + 3];
    }
  }
  return out;
}

function writeSideBySide(a, b, outPath) {
  const width = a.width + b.width + 16;
  const height = Math.max(a.height, b.height);
  const out = new PNG({ width, height });
  // cream pad — avoid magenta inflating visual noise in side-by-side
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = 255;
    out.data[i + 1] = 248;
    out.data[i + 2] = 243;
    out.data[i + 3] = 255;
  }
  for (let y = 0; y < a.height; y += 1) {
    for (let x = 0; x < a.width; x += 1) {
      const si = (a.width * y + x) << 2;
      const di = (width * y + x) << 2;
      out.data.set(a.data.subarray(si, si + 4), di);
    }
  }
  const ox = a.width + 16;
  for (let y = 0; y < b.height; y += 1) {
    for (let x = 0; x < b.width; x += 1) {
      const si = (b.width * y + x) << 2;
      const di = (width * y + (ox + x)) << 2;
      out.data.set(b.data.subarray(si, si + 4), di);
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

/**
 * Mask rectangles: { x, y, w, h } in image pixel space.
 * Interior pixels are equalized so pixelmatch ignores content.
 * Border (1px) is kept for geometry comparison.
 */
function applyInteriorMasks(imgA, imgB, masks) {
  const a = new PNG({ width: imgA.width, height: imgA.height });
  const b = new PNG({ width: imgB.width, height: imgB.height });
  a.data.set(imgA.data);
  b.data.set(imgB.data);

  for (const mask of masks || []) {
    const x0 = Math.max(0, Math.floor(mask.x));
    const y0 = Math.max(0, Math.floor(mask.y));
    const x1 = Math.min(imgA.width, Math.ceil(mask.x + mask.w));
    const y1 = Math.min(imgA.height, Math.ceil(mask.y + mask.h));
    for (let y = y0 + 1; y < y1 - 1; y += 1) {
      for (let x = x0 + 1; x < x1 - 1; x += 1) {
        const i = (imgA.width * y + x) << 2;
        // Neutral gray interior — keep alpha
        a.data[i] = 180;
        a.data[i + 1] = 180;
        a.data[i + 2] = 180;
        b.data[i] = 180;
        b.data[i + 1] = 180;
        b.data[i + 2] = 180;
      }
    }
  }
  return { a, b };
}

function verdict(ratio) {
  if (ratio == null) return 'MISSING';
  if (ratio <= PASS_MAX) return 'PASS';
  if (ratio <= REVIEW_MAX) return 'REVIEW';
  return 'FAIL';
}

function loadMaskMeta(name) {
  const metaPath = path.join(ACT_DIR, name.replace(/\.png$/i, '.masks.json'));
  if (!fs.existsSync(metaPath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    return Array.isArray(parsed) ? parsed : parsed.masks || [];
  } catch {
    return [];
  }
}

function comparePair(name) {
  const refPath = path.join(REF_DIR, name);
  const actPath = path.join(ACT_DIR, name);
  if (!fs.existsSync(refPath) || !fs.existsSync(actPath)) {
    return {
      name,
      status: 'MISSING',
      rawMismatch: null,
      maskedMismatch: null,
      geometryNote: 'missing pair',
    };
  }

  let ref = readPng(refPath);
  let act = readPng(actPath);
  const refSize = { width: ref.width, height: ref.height };
  const actSize = { width: act.width, height: act.height };
  const sizeDelta = {
    width: actSize.width - refSize.width,
    height: actSize.height - refSize.height,
  };
  const width = Math.min(ref.width, act.width);
  const height = Math.min(ref.height, act.height);
  const sizeMismatch = sizeDelta.width !== 0 || sizeDelta.height !== 0;
  // Crop top-left to common size — never stretch; size delta reported separately.
  ref = cropToCommon(ref, width, height);
  act = cropToCommon(act, width, height);

  const rawDiff = new PNG({ width, height });
  const rawMismatchPixels = pixelmatch(ref.data, act.data, rawDiff.data, width, height, {
    threshold: 0.1,
    includeAA: true,
  });
  const total = width * height;
  const rawMismatch = rawMismatchPixels / total;

  const masks = loadMaskMeta(name);
  const { a: maskedRef, b: maskedAct } = applyInteriorMasks(ref, act, masks);
  const maskedDiff = new PNG({ width, height });
  const maskedMismatchPixels = pixelmatch(
    maskedRef.data,
    maskedAct.data,
    maskedDiff.data,
    width,
    height,
    { threshold: 0.1, includeAA: true }
  );
  const maskedMismatch = maskedMismatchPixels / total;
  const status = verdict(maskedMismatch);
  const base = name.replace(/\.png$/i, '');

  writeSideBySide(ref, act, path.join(OVERLAY_DIR, `${base}-side-by-side.png`));
  writeOverlay(ref, act, path.join(OVERLAY_DIR, `${base}-overlay.png`));
  fs.writeFileSync(path.join(DIFF_DIR, `${base}-diff.png`), PNG.sync.write(rawDiff));
  fs.writeFileSync(path.join(MASKED_DIR, `${base}-masked-diff.png`), PNG.sync.write(maskedDiff));

  return {
    name,
    status,
    width,
    height,
    sizeMismatch,
    sizeDelta,
    geometryMismatch: sizeMismatch
      ? Number(
          (
            (Math.abs(sizeDelta.width) * Math.max(refSize.height, actSize.height) +
              Math.abs(sizeDelta.height) * Math.max(refSize.width, actSize.width)) /
            Math.max(refSize.width * refSize.height, 1)
          ).toFixed(6)
        )
      : 0,
    maskCount: masks.length,
    rawMismatchPixels,
    rawMismatch: Number(rawMismatch.toFixed(6)),
    maskedMismatchPixels,
    maskedMismatch: Number(maskedMismatch.toFixed(6)),
    geometryNote: sizeMismatch
      ? `cropped to ${width}x${height}; delta w=${sizeDelta.width} h=${sizeDelta.height}`
      : 'same canvas',
    causeHint:
      status === 'PASS'
        ? 'layout aligned'
        : masks.length
          ? 'masked layout residual (chrome/typography/spacing)'
          : 'layout or content residual',
  };
}

ensureDirs();
const names = Array.from(new Set([...listPngs(REF_DIR), ...listPngs(ACT_DIR)])).sort();
const results = names.map(comparePair);
const report = {
  generatedAt: new Date().toISOString(),
  thresholds: { passMax: PASS_MAX, reviewMax: REVIEW_MAX, pixelmatch: 0.1, includeAA: true },
  primaryMetric: 'maskedMismatch',
  referenceCount: listPngs(REF_DIR).length,
  actualCount: listPngs(ACT_DIR).length,
  comparedCount: results.filter((r) => r.status !== 'MISSING').length,
  passCount: results.filter((r) => r.status === 'PASS').length,
  reviewCount: results.filter((r) => r.status === 'REVIEW').length,
  failCount: results.filter((r) => r.status === 'FAIL').length,
  results,
};

const reportPath = path.join(REPORTS_DIR, 'diff-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
console.log(
  JSON.stringify(
    {
      report: reportPath,
      summary: results.map((r) => ({
        name: r.name,
        status: r.status,
        raw: r.rawMismatch,
        masked: r.maskedMismatch,
      })),
    },
    null,
    2
  )
);
