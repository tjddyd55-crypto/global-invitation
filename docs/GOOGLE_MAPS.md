# Google Maps 연동 (development)

## 환경변수 (Frontend)

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=   # 선택
```

Railway development Frontend 서비스에 동일 키를 설정한다. **하드코딩 금지.**

## Google Cloud Console

활성화:
- Maps JavaScript API
- Places API
- Maps Embed API
- (선택) Geocoding API

API key 제한:
- Application: HTTP referrers
- 허용 예:
  - `http://localhost:3000/*`
  - `https://frontend-development-1b8a.up.railway.app/*`

## 동작

| 화면 | 방식 |
|------|------|
| Editor 위치 안내 | Places Autocomplete + Map + Marker + 확정 |
| Public `/i/{slug}` | Maps Embed API + Google 지도에서 보기/길찾기 |

키가 없으면 Editor는 주소 텍스트 fallback, Public은 정적 mapImage 또는 안내 fallback.

## 저장 (dataJson, DB 컬럼 추가 없음)

```
address (formattedAddress)
googlePlaceId?
detailAddress?
mapLat? / mapLng?   # UI 미노출
venueName?
```
