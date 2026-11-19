import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createRequire } from 'node:module';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { interpolate, translate } from '../../i18n/t';
import * as pricingModule from './invitationPricing';
import { INVITATION_PRICING, formatUsdAmountLabel } from './invitationPricing';
import * as supportContact from '../marketing/supportContact';

const pricing = {
  list: formatUsdAmountLabel(INVITATION_PRICING.listPriceCents),
  sale: formatUsdAmountLabel(INVITATION_PRICING.salePriceCents),
};

for (const locale of ['en', 'ko', 'mn'] as const) {
  test(`${locale} public price copy uses the live list and sale amounts`, () => {
    assert.equal(pricing.list, '$30 USD');
    assert.equal(pricing.sale, '$10 USD');
    for (const key of ['paymentInfo.pricing.body', 'refund.current.body']) {
      const template = translate(locale, key);
      assert.match(template, /\{list\}/);
      assert.match(template, /\{sale\}/);
      const copy = interpolate(template, pricing);
      assert.ok(copy.includes(pricing.list));
      assert.ok(copy.includes(pricing.sale));
      assert.doesNotMatch(copy, /\$39|\{|\?{3}|\uFFFD/);
    }
    const lead = translate(locale, 'checkout.lead');
    assert.match(lead, /\{sale\}/);
    assert.ok(interpolate(lead, pricing).includes(pricing.sale));
    assert.ok(interpolate(lead, { sale: '$12 USD' }).includes('$12 USD'));
  });
}

test('payment-info wires SSOT amounts and localized copy into the public page', () => {
  const page = readFileSync('app/payment-info/page.tsx', 'utf8');
  assert.match(page, /formatUsdAmountLabel\(INVITATION_PRICING.listPriceCents\)/);
  assert.match(page, /formatUsdAmountLabel\(INVITATION_PRICING.salePriceCents\)/);
  assert.match(page, /interpolate\(t\(`paymentInfo\.\$\{section\}\.body`\), pricing\)/);
  assert.match(page, /<MarketingSiteHeader/);
  assert.match(page, /data-testid="payment-info-page"/);
  assert.match(page, /href="\/refund-policy"/);
  assert.doesNotMatch(page, /\$39|Planned Pricing/);
});

test('checkout lead interpolates its existing sale amount', () => {
  const panel = readFileSync('src/features/payments/ui/PaymentCheckoutPanel.tsx', 'utf8');
  assert.match(panel, /sale = formatUsdAmountLabel\(saleCents\)/);
  assert.match(panel, /interpolate\(t\('checkout.lead'\), \{ sale \}\)/);
});

for (const locale of ['en', 'ko', 'mn'] as const) {
  test(`${locale} payment-info renders current prices without stale or broken text`, () => {
    const source = readFileSync('app/payment-info/page.tsx', 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
    } }).outputText;
    const nativeRequire = createRequire(import.meta.url);
    const dependencies: Record<string, unknown> = {
      'next/link': { default: 'a' },
      '@/src/features/marketing/ui/MarketingSiteHeader': { default: () => null },
      '@/src/contexts/I18nContext': { useI18n: () => ({ t: (key: string) => translate(locale, key) }) },
      '@/src/i18n': { interpolate },
      '@/src/shared/pricing/invitationPricing': pricingModule,
      '@/src/shared/marketing/supportContact': supportContact,
      './page.module.css': { default: {} },
    };
    const exports: { default?: () => ReturnType<typeof createElement> } = {};
    new Function('require', 'exports', compiled)(
      (id: string) => dependencies[id] ?? nativeRequire(id), exports,
    );
    assert.ok(exports.default);
    const html = renderToStaticMarkup(createElement(exports.default));
    assert.match(html, /data-testid="payment-info-pricing"/);
    assert.match(html, /\$30 USD/);
    assert.match(html, /\$10 USD/);
    assert.doesNotMatch(html, /\$39|Planned Pricing|\{sale\}|\{list\}|\?{3}|\uFFFD/);
  });
}
