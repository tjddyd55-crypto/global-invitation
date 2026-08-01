/**
 * 갤러리 펼치기/접기 chevron 의 기하 SSOT.
 * 접힘(아래)·펼침(위) 두 상태가 이 값 하나만 공유하고, 방향은 CSS rotate 로만 바꾼다.
 * 값을 바꿀 때 두 상태가 함께 바뀌도록 컴포넌트가 아닌 이곳에 둔다.
 */
export const GALLERY_CHEVRON_ICON = {
  /** 아이콘 박스(px) */
  size: 20,
  viewBox: '0 0 24 24',
  strokeWidth: 2.2,
  /** viewBox 기준 가로 15 · 세로 7.5 — 완만한 2:1 chevron */
  path: 'M4.5 9 12 16.5 19.5 9',
  /** 비율 검증용 (viewBox 좌표계) */
  spanX: 15,
  spanY: 7.5,
} as const;

/** viewBox 좌표를 실제 렌더 px 로 환산한다. */
export function toRenderedPx(viewBoxLength: number): number {
  const viewBoxSize = 24;
  return (viewBoxLength / viewBoxSize) * GALLERY_CHEVRON_ICON.size;
}
