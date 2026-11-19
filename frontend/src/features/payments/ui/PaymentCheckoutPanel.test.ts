import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('checkout button and click handler use the tested consent guard', () => {
  const panel = readFileSync(path.join(process.cwd(), 'src/features/payments/ui/PaymentCheckoutPanel.tsx'), 'utf8');
  assert.match(panel, /useState\(false\)/);
  assert.match(panel, /canSubmitCheckout\(\{ dueCents, providerChargeReady, digitalConsent, busy \}\)/);
  assert.match(panel, /disabled=\{!canSubmit\}/);
  assert.match(panel, /if \(canSubmit\) onCheckout\(\)/);
  assert.match(panel, /required=\{dueCents > 0\}/);
});

test('digital content consent is accessible and links to the public policy', () => {
  const consent = readFileSync(path.join(process.cwd(), 'src/features/payments/ui/PaymentDigitalConsent.tsx'), 'utf8');
  assert.match(consent, /href="\/refund-policy"/);
  assert.match(consent, /data-testid="payment-refund-policy-link"/);
  assert.match(consent, /data-testid="payment-digital-consent"/);
  assert.match(consent, /aria-describedby="payment-refund-notice"/);
  assert.match(consent, /onChange\(event.target.checked\)/);
});
