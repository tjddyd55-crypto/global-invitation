import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  ORGANIZATION_SAMPLE_LOGO,
  ORGANIZATION_SAMPLE_LOGO_DARK,
} from '@/src/templates/visualTemplate/templateSampleAssets';
import {
  hasOfficialDarkLogoVariant,
  ORGANIZATION_DARK_LOGO_BY_LIGHT_KEY,
  resolveOrganizationLogoForSurface,
} from './organizationLogoSurfaces';

const here = path.dirname(fileURLToPath(import.meta.url));

test('light surface keeps the official color logo key', () => {
  assert.equal(
    resolveOrganizationLogoForSurface(ORGANIZATION_SAMPLE_LOGO, 'light'),
    ORGANIZATION_SAMPLE_LOGO
  );
});

test('dark surface uses official inverted logo when mapped', () => {
  assert.equal(hasOfficialDarkLogoVariant(ORGANIZATION_SAMPLE_LOGO), true);
  assert.equal(
    ORGANIZATION_DARK_LOGO_BY_LIGHT_KEY[ORGANIZATION_SAMPLE_LOGO],
    ORGANIZATION_SAMPLE_LOGO_DARK
  );
  assert.equal(
    resolveOrganizationLogoForSurface(ORGANIZATION_SAMPLE_LOGO, 'dark'),
    ORGANIZATION_SAMPLE_LOGO_DARK
  );
});

test('dark surface without mapping keeps the original key (no invented asset)', () => {
  assert.equal(
    resolveOrganizationLogoForSurface('invitation/shared/images/templates/custom/logo.webp', 'dark'),
    'invitation/shared/images/templates/custom/logo.webp'
  );
});

test('empty logo stays null on both surfaces', () => {
  assert.equal(resolveOrganizationLogoForSurface('', 'dark'), null);
  assert.equal(resolveOrganizationLogoForSurface(null, 'light'), null);
  assert.equal(hasOfficialDarkLogoVariant(''), false);
});

test('JCI footer logo has no white plate and no CSS recolor', () => {
  const footerCss = fs.readFileSync(
    path.join(here, '../organizationJci/OrganizationJciInvitation.module.css'),
    'utf8'
  );
  const logoCss = fs.readFileSync(path.join(here, './OrganizationBrandLogo.module.css'), 'utf8');
  const combined = `${footerCss}\n${logoCss}`;
  assert.doesNotMatch(combined, /filter\s*:\s*[^;]*(invert|brightness\s*\(|hue-rotate|saturate\s*\()/i);
  assert.doesNotMatch(
    combined,
    /mix-blend-mode\s*:\s*(multiply|screen|overlay|darken|lighten|difference|exclusion)/i
  );
  assert.match(logoCss, /\.wrapOnDark/);
  assert.match(logoCss, /\.wrapOnDark\s*\{[^}]*background:\s*transparent/);
  assert.doesNotMatch(logoCss, /\.wrapOnDark\s*\{[^}]*background:\s*#fff/i);
  assert.match(footerCss, /\.footerLogo[\s\S]*?background:\s*transparent/);
});
