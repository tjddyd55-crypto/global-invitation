/**
 * Guard: user-facing maps UI must be Google-only (no KR nav apps).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FRONTEND = path.join(ROOT, 'frontend');

const FORBIDDEN = [
  { file: 'src/templates/shared/LocationMapSection.tsx', needles: ['navUrls', 'navItems', 'map.kakao.com', 'map.naver.com', 'tmap.co.kr'] },
  { file: 'src/templates/weddingClassic/WeddingClassicInvitation.tsx', needles: ['navTmap', 'navKakao', 'navNaver', 'navLabels'] },
  { file: 'src/templates/funeralClassic/FuneralClassicInvitation.tsx', needles: ['navTmap', 'navKakao', 'navNaver', 'navLabels'] },
  { file: 'src/maps/PlaceSearchInput.tsx', needles: ["country: 'kr'", 'country: "kr"', 'componentRestrictions'] },
];

let failures = 0;
for (const entry of FORBIDDEN) {
  const full = path.join(FRONTEND, entry.file);
  if (!fs.existsSync(full)) {
    console.error(`[assert:google-only-maps] missing ${entry.file}`);
    failures += 1;
    continue;
  }
  const src = fs.readFileSync(full, 'utf8');
  for (const needle of entry.needles) {
    if (src.includes(needle)) {
      console.error(`[assert:google-only-maps] FAIL: ${entry.file} contains "${needle}"`);
      failures += 1;
    }
  }
}

const urls = path.join(FRONTEND, 'src/maps/googleMapsUrls.ts');
const urlsSrc = fs.readFileSync(urls, 'utf8');
for (const required of ['buildGoogleMapsViewUrl', 'buildGoogleMapsDirectionsUrl', 'query_place_id', 'destination_place_id']) {
  if (!urlsSrc.includes(required)) {
    console.error(`[assert:google-only-maps] FAIL: googleMapsUrls missing ${required}`);
    failures += 1;
  }
}

const pickerMap = fs.readFileSync(path.join(FRONTEND, 'src/maps/LocationPickerMap.tsx'), 'utf8');
if (!pickerMap.includes('AdvancedMarkerElement') || !pickerMap.includes('maps.Marker')) {
  console.error('[assert:google-only-maps] FAIL: LocationPickerMap must support Advanced + classic Marker');
  failures += 1;
}

if (failures === 0) {
  console.log('[assert:google-only-maps] OK: Google-only directions + marker fallback present');
  process.exit(0);
}
process.exit(1);
