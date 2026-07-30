/**
 * Guard: map provider buttons must not mix Google/Naver links incorrectly.
 * Naver is allowed only via dedicated provider components.
 *
 * Prefer: npm run assert:map-provider
 * Legacy alias: assert:google-only-maps
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FRONTEND = path.join(ROOT, 'frontend');

let failures = 0;

function fail(message) {
  console.error(`[assert:map-provider] FAIL: ${message}`);
  failures += 1;
}

const GOOGLE_URL_RE = /https?:\/\/(www\.)?google\.[^"'`\s]*\/maps|https?:\/\/maps\.google\./i;
const NAVER_URL_RE = /https?:\/\/(map|m)\.naver\.com|https?:\/\/naver\.me\//i;

function walkTsFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkTsFiles(full, out);
      continue;
    }
    if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const section = path.join(FRONTEND, 'src/templates/shared/LocationMapSection.tsx');
const sectionSrc = fs.readFileSync(section, 'utf8');
if (!sectionSrc.includes('getInvitationMapSettings')) {
  fail('LocationMapSection must use getInvitationMapSettings');
}
if (!sectionSrc.includes('NaverMapsExternalLinks') || !sectionSrc.includes('GoogleMapsExternalLinks')) {
  fail('LocationMapSection must support both provider link components');
}

const googleUrls = path.join(FRONTEND, 'src/maps/googleMapsUrls.ts');
const googleSrc = fs.readFileSync(googleUrls, 'utf8');
for (const required of ['buildGoogleMapsViewUrl', 'buildGoogleMapsDirectionsUrl', 'query_place_id']) {
  if (!googleSrc.includes(required)) fail(`googleMapsUrls missing ${required}`);
}
if (NAVER_URL_RE.test(googleSrc)) {
  fail('googleMapsUrls must not contain Naver map URLs');
}

const naverUrls = path.join(FRONTEND, 'src/maps/naverMapsUrls.ts');
if (!fs.existsSync(naverUrls)) {
  fail('naverMapsUrls.ts missing');
} else {
  const naverSrc = fs.readFileSync(naverUrls, 'utf8');
  for (const required of ['buildNaverMapsViewUrl', 'buildNaverMapsDirectionsUrl']) {
    if (!naverSrc.includes(required)) fail(`naverMapsUrls missing ${required}`);
  }
  if (GOOGLE_URL_RE.test(naverSrc)) {
    fail('naverMapsUrls must not contain Google Maps URLs');
  }
}

for (const requiredFile of [
  'src/maps/loadNaverMaps.ts',
  'src/maps/NaverPlaceSearch.tsx',
  'src/maps/NaverLocationPickerMap.tsx',
  'src/maps/NaverLocationPicker.tsx',
  'src/maps/PublicNaverMap.tsx',
  'src/invitation/mapSettings.ts',
]) {
  if (!fs.existsSync(path.join(FRONTEND, requiredFile))) {
    fail(`missing ${requiredFile}`);
  }
}

const googleLinkFiles = [
  path.join(FRONTEND, 'src/maps/GoogleMapsExternalLinks.tsx'),
  path.join(FRONTEND, 'src/templates/shared/GoogleMapsExternalLinks.tsx'),
].filter((file) => fs.existsSync(file));

for (const file of googleLinkFiles) {
  const src = fs.readFileSync(file, 'utf8');
  if (NAVER_URL_RE.test(src)) {
    fail(`${path.relative(ROOT, file)} must not embed Naver URLs`);
  }
}

const naverLinkFiles = [
  path.join(FRONTEND, 'src/maps/NaverMapsExternalLinks.tsx'),
  path.join(FRONTEND, 'src/templates/shared/NaverMapsExternalLinks.tsx'),
].filter((file) => fs.existsSync(file));

for (const file of naverLinkFiles) {
  const src = fs.readFileSync(file, 'utf8');
  if (GOOGLE_URL_RE.test(src)) {
    fail(`${path.relative(ROOT, file)} must not embed Google Maps URLs`);
  }
}

// Public Google map component should not hardcode Naver deep links.
const publicGoogle = path.join(FRONTEND, 'src/maps/PublicGoogleMap.tsx');
if (fs.existsSync(publicGoogle) && NAVER_URL_RE.test(fs.readFileSync(publicGoogle, 'utf8'))) {
  fail('PublicGoogleMap must not contain Naver URLs');
}
const publicNaver = path.join(FRONTEND, 'src/maps/PublicNaverMap.tsx');
if (fs.existsSync(publicNaver) && GOOGLE_URL_RE.test(fs.readFileSync(publicNaver, 'utf8'))) {
  fail('PublicNaverMap must not contain Google Maps URLs');
}

const pickerMap = fs.readFileSync(path.join(FRONTEND, 'src/maps/LocationPickerMap.tsx'), 'utf8');
if (!pickerMap.includes('AdvancedMarkerElement') || !pickerMap.includes('maps.Marker')) {
  fail('LocationPickerMap must support Advanced + classic Marker');
}

const placeSearch = fs.readFileSync(path.join(FRONTEND, 'src/maps/PlaceSearchInput.tsx'), 'utf8');
if (placeSearch.includes("country: 'kr'") || placeSearch.includes('componentRestrictions')) {
  fail('PlaceSearchInput must not force KR country restriction');
}

// Spot-check editor location step uses provider selector, not hardcoded dual deep links.
const step6 = path.join(FRONTEND, 'src/editors/wedding/steps/Step6Location.tsx');
if (fs.existsSync(step6)) {
  const stepSrc = fs.readFileSync(step6, 'utf8');
  if (!stepSrc.includes('mapProvider') && !stepSrc.includes('GOOGLE') && !stepSrc.includes('NAVER')) {
    fail('Step6Location must expose Google/Naver mapProvider selection');
  }
}

void walkTsFiles;

if (failures === 0) {
  console.log('[assert:map-provider] OK');
  process.exit(0);
}
process.exit(1);
