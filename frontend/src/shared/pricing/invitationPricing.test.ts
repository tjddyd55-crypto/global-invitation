import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatUsdFromCents,
  getInvitationDiscountCents,
  INVITATION_PRICING,
} from './invitationPricing';
import { SUPPORT_EMAIL, supportMailtoHref } from '../marketing/supportContact';

test('invitation pricing SSOT matches product policy', () => {
  assert.equal(INVITATION_PRICING.currency, 'USD');
  assert.equal(INVITATION_PRICING.listPriceCents, 3000);
  assert.equal(INVITATION_PRICING.salePriceCents, 1000);
  assert.equal(formatUsdFromCents(3000), '$30');
  assert.equal(formatUsdFromCents(1000), '$10');
  assert.equal(getInvitationDiscountCents(), 2000);
});

test('support email SSOT is gmail and used by mailto', () => {
  assert.equal(SUPPORT_EMAIL, 'tjddyd55@gmail.com');
  assert.match(supportMailtoHref(), /^mailto:tjddyd55@gmail.com/);
  assert.doesNotMatch(supportMailtoHref(), /naver\.com/);
});
