export type StepLayout = {
  x: number;
  width: number;
};

/**
 * Scroll offset so the selected step item center aligns with viewport center.
 * Clamps to [0, maxScroll] when first/last items cannot be perfectly centered.
 */
export function calculateCenteredScrollOffset(
  layouts: StepLayout[],
  selectedIndex: number,
  viewportWidth: number,
): number {
  if (layouts.length === 0 || viewportWidth <= 0) return 0;

  const index = Math.min(Math.max(selectedIndex, 0), layouts.length - 1);
  const item = layouts[index];
  const itemCenter = item.x + item.width / 2;
  const viewportCenter = viewportWidth / 2;
  const rawOffset = itemCenter - viewportCenter;

  const contentWidth = layouts[layouts.length - 1].x + layouts[layouts.length - 1].width;
  const maxScroll = Math.max(0, contentWidth - viewportWidth);
  return Math.min(Math.max(rawOffset, 0), maxScroll);
}
