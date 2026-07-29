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

const naverUrls = path.join(FRONTEND, 'src/maps/naverMapsUrls.ts');
if (!fs.existsSync(naverUrls)) {
  fail('naverMapsUrls.ts missing');
} else {
  const naverSrc = fs.readFileSync(naverUrls, 'utf8');
  for (const required of ['buildNaverMapsViewUrl', 'buildNaverMapsDirectionsUrl']) {
    if (!naverSrc.includes(required)) fail(`naverMapsUrls missing ${required}`);
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

const pickerMap = fs.readFileSync(path.join(FRONTEND, 'src/maps/LocationPickerMap.tsx'), 'utf8');
if (!pickerMap.includes('AdvancedMarkerElement') || !pickerMap.includes('maps.Marker')) {
  fail('LocationPickerMap must support Advanced + classic Marker');
}

const placeSearch = fs.readFileSync(path.join(FRONTEND, 'src/maps/PlaceSearchInput.tsx'), 'utf8');
if (placeSearch.includes("country: 'kr'") || placeSearch.includes('componentRestrictions')) {
  fail('PlaceSearchInput must not force KR country restriction');
}

if (failures === 0) {
  console.log('[assert:map-provider] OK');
  process.exit(0);
}
process.exit(1);
