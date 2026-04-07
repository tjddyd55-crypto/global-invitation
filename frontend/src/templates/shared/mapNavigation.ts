/**
 * 장소/좌표 기반 지도·내비 웹 링크 (외부 서비스).
 */
export type MapNavigationInput = {
  address: string;
  /** WGS84 */
  mapLat?: number;
  mapLng?: number;
  /** 지도 마커 라벨 (기본: 주소 앞 20자) */
  label?: string;
};

function hasValidCoords(lat?: number, lng?: number): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  );
}

export function buildMapNavigationUrls(input: MapNavigationInput): {
  kakao: string;
  naver: string;
  tmap: string;
} {
  const address = (input.address || '').trim() || '목적지';
  const label = (input.label || address).slice(0, 40);

  if (hasValidCoords(input.mapLat, input.mapLng)) {
    const { mapLat: lat, mapLng: lng } = input;
    return {
      kakao: `https://map.kakao.com/link/map/${encodeURIComponent(label)},${lat},${lng}`,
      naver: `https://map.naver.com/v5/search/${encodeURIComponent(`${lat},${lng}`)}`,
      tmap: `https://tmap.co.kr/tmap2/mobile/route.jsp?goalX=${lng}&goalY=${lat}&goalName=${encodeURIComponent(label)}`,
    };
  }

  const q = encodeURIComponent(address);
  return {
    kakao: `https://map.kakao.com/link/search/${q}`,
    naver: `https://map.naver.com/v5/search/${q}`,
    tmap: `https://tmap.co.kr/tmap2/mobile/search.jsp?nameOrigin=${q}`,
  };
}
