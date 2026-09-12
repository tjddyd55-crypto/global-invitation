import { formatUsd } from '@/src/api/payment';

describe('formatUsd', () => {
  it('formats cents as USD', () => {
    expect(formatUsd(1000)).toBe('$10.00');
    expect(formatUsd(500)).toBe('$5.00');
  });
});
