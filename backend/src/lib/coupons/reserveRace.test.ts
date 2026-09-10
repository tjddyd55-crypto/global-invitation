import assert from 'node:assert/strict';
import test from 'node:test';
import { assertCouponLimits } from './eligibility';
import { CouponError, COUPON_ERROR_CODES } from './errors';

type ReserveResult = { ok: true } | { ok: false; code: string };

async function runParallelReserves(input: {
  totalUsageLimit: number | null;
  perUserUsageLimit: number | null;
  workers: Array<{ userId: string }>;
}): Promise<ReserveResult[]> {
  let totalActive = 0;
  const userActive = new Map<string, number>();
  let lock: Promise<void> = Promise.resolve();

  return Promise.all(
    input.workers.map(async (worker) => {
      let release: () => void = () => undefined;
      const previous = lock;
      lock = new Promise<void>((resolve) => {
        release = resolve;
      });
      await previous;
      try {
        const counts = {
          totalActive,
          userActive: userActive.get(worker.userId) || 0,
        };
        try {
          assertCouponLimits(
            {
              totalUsageLimit: input.totalUsageLimit,
              perUserUsageLimit: input.perUserUsageLimit,
            },
            counts
          );
        } catch (error) {
          const code = error instanceof CouponError ? error.code : 'COUPON_RESERVE_FAILED';
          return { ok: false, code };
        }
        totalActive += 1;
        userActive.set(worker.userId, counts.userActive + 1);
        return { ok: true };
      } finally {
        release();
      }
    })
  );
}

test('totalUsageLimit=1 allows exactly one of two parallel reserves', async () => {
  const results = await runParallelReserves({
    totalUsageLimit: 1,
    perUserUsageLimit: null,
    workers: [{ userId: 'a' }, { userId: 'b' }],
  });
  assert.equal(results.filter((row) => row.ok).length, 1);
  assert.equal(
    results.filter((row) => !row.ok && row.code === COUPON_ERROR_CODES.COUPON_LIMIT_REACHED).length,
    1
  );
});

test('perUserUsageLimit=1 allows exactly one of two parallel reserves for the same user', async () => {
  const results = await runParallelReserves({
    totalUsageLimit: null,
    perUserUsageLimit: 1,
    workers: [{ userId: 'same' }, { userId: 'same' }],
  });
  assert.equal(results.filter((row) => row.ok).length, 1);
  assert.equal(
    results.filter((row) => !row.ok && row.code === COUPON_ERROR_CODES.COUPON_USER_LIMIT_REACHED).length,
    1
  );
});
