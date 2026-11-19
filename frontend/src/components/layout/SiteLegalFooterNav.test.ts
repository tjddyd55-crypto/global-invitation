import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { LOCALES } from '../../i18n/locales';

const read = (relative: string) => readFileSync(path.join(process.cwd(), relative), 'utf8');

test('legal footer contains exactly four ordered links and complete translated labels', () => {
  const source = read('src/components/layout/SiteLegalFooterNav.tsx');
  const links = Array.from(source.matchAll(/<Link href="([^"]+)"[^>]*>\{t\('([^']+)'\)\}/g));
  assert.deepEqual(links.map((match) => match[1]), ['/terms', '/privacy', '/refund-policy', '/contact']);
  assert.deepEqual(links.map((match) => LOCALES.en[match[2] as keyof typeof LOCALES.en]),
    ['Terms of Service', 'Privacy Policy', 'Refund Policy', 'Contact Us']);
  assert.match(source, /data-testid="footer-legal-nav"/);
  assert.match(source, /data-testid="footer-refund-policy"/);
  for (const dictionary of Object.values(LOCALES)) {
    for (const link of links) assert.ok(dictionary[link[2] as keyof typeof dictionary]);
  }
});

test('home, marketing and legal layouts render the shared menu once', () => {
  const surfaces = ['src/components/MarketingLayout.tsx', 'src/features/main/ui/pc/DesktopMainScreen.tsx',
    'src/features/main/ui/mobile/MainScreen.tsx', 'src/features/contact/ui/ContactPage.tsx',
    'src/features/pricing/ui/PricingPage.tsx'];
  for (const surface of surfaces) {
    assert.equal((read(surface).match(/<SiteLegalFooterNav\s*\/>/g) ?? []).length, 1, surface);
  }
  assert.doesNotMatch(read('src/features/payments/ui/PaymentPage.tsx'), /SiteLegalFooterNav/);
});
