import { test } from 'node:test';
import assert from 'node:assert/strict';
import { envDomesticKrwEnabled, envUsdKrwRate } from './systemConfig';

test('domestic KRW env fallback parses only valid values', () => {
  process.env.TOSS_DOMESTIC_KRW_ENABLED = 'true';
  process.env.TOSS_DOMESTIC_USD_KRW_RATE = '1400';
  assert.equal(envDomesticKrwEnabled(), true);
  assert.equal(envUsdKrwRate(), 1400);
  process.env.TOSS_DOMESTIC_KRW_ENABLED = 'yes';
  process.env.TOSS_DOMESTIC_USD_KRW_RATE = '14.5';
  assert.equal(envDomesticKrwEnabled(), false);
  assert.equal(envUsdKrwRate(), null);
  delete process.env.TOSS_DOMESTIC_KRW_ENABLED;
  delete process.env.TOSS_DOMESTIC_USD_KRW_RATE;
  assert.equal(envDomesticKrwEnabled(), false);
  assert.equal(envUsdKrwRate(), null);
});
