/**
 * @deprecated Google-only 정책 — 국내 지도 URL builder는 제거됨.
 * 외부 링크는 `@/src/maps/googleMapsUrls` 를 사용한다.
 */

export type MapNavigationInput = {
  address?: string;
  mapLat?: number;
  mapLng?: number;
  label?: string;
};

/** @deprecated Always empty — 네이버/카카오/티맵 미사용 */
export function buildMapNavigationUrls(_input: MapNavigationInput): {
  kakao: string;
  naver: string;
  tmap: string;
} {
  return { kakao: '', naver: '', tmap: '' };
}
