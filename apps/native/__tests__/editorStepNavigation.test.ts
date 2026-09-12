import { calculateCenteredScrollOffset } from '@/src/lib/editorStepNavigation';

describe('calculateCenteredScrollOffset', () => {
  const layouts = [
    { x: 0, width: 80 },
    { x: 88, width: 100 },
    { x: 196, width: 120 },
    { x: 324, width: 90 },
  ];

  it('centers middle item', () => {
    const offset = calculateCenteredScrollOffset(layouts, 1, 200);
    expect(offset).toBe(38);
  });

  it('clamps first item toward center without negative offset', () => {
    const offset = calculateCenteredScrollOffset(layouts, 0, 200);
    expect(offset).toBeGreaterThanOrEqual(0);
  });

  it('clamps last item within max scroll', () => {
    const offset = calculateCenteredScrollOffset(layouts, 3, 200);
    const maxScroll = 414 - 200;
    expect(offset).toBeLessThanOrEqual(maxScroll);
    expect(offset).toBeGreaterThanOrEqual(0);
  });
});
