import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ORGANIZATION_JCI_THEME } from './organizationJciTheme';

const dir = dirname(fileURLToPath(import.meta.url));
const jciCss = readFileSync(join(dir, 'OrganizationJciInvitation.module.css'), 'utf8');
const chromeCss = readFileSync(join(dir, 'organizationJciChrome.css'), 'utf8');
const officialRsvp = readFileSync(
  join(dir, '../shared/InvitationRsvpSection.module.css'),
  'utf8'
);

test('JCI theme tokens match Brand Guidelines 2026', () => {
  assert.equal(ORGANIZATION_JCI_THEME.blue, '#0097D7');
  assert.equal(ORGANIZATION_JCI_THEME.black, '#130F2D');
  assert.equal(ORGANIZATION_JCI_THEME.footerBackground, '#130F2D');
  assert.equal(ORGANIZATION_JCI_THEME.white, '#FFFFFF');
  assert.equal(ORGANIZATION_JCI_THEME.navy, '#1F4789');
  assert.equal(ORGANIZATION_JCI_THEME.teal, '#57BCBC');
  assert.equal(ORGANIZATION_JCI_THEME.yellow, '#EFC40F');
});

test('JCI invitation CSS has no generic purple/indigo tokens', () => {
  for (const source of [jciCss, chromeCss]) {
    assert.doesNotMatch(source, /#4[fF]46[eE]5/);
    assert.doesNotMatch(source, /#5[bB]4[fF][dD]6/);
    assert.doesNotMatch(source, /\bpurple\b/i);
    assert.doesNotMatch(source, /\bindigo\b/i);
    assert.doesNotMatch(source, /\bviolet\b/i);
  }
});

test('JCI page maps shared chrome tokens to JCI brand variables', () => {
  assert.match(jciCss, /--invite-cta-bg:\s*var\(--jci-blue\)/);
  assert.match(jciCss, /--invite-copy-border:\s*var\(--jci-blue\)/);
  assert.match(jciCss, /--invite-map-color:\s*var\(--jci-black\)/);
  assert.match(jciCss, /background:\s*var\(--jci-footer-bg\)/);
});

test('JCI footer background uses dedicated token, not ink black alias in footer rule', () => {
  const footerBlock = jciCss.slice(jciCss.indexOf('.footer {'), jciCss.indexOf('.footerRipple'));
  assert.match(footerBlock, /background:\s*var\(--jci-footer-bg\)/);
  assert.doesNotMatch(footerBlock, /background:\s*var\(--jci-black\)/);
  assert.doesNotMatch(footerBlock, /#d6e8f2/i);
});

test('Official RSVP fallback remains SaaS purple', () => {
  assert.match(officialRsvp, /var\(--invite-cta-bg,\s*#4f46e5\)/);
});
