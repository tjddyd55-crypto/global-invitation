import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { ORGANIZATION_SAMPLE_LOGO } from '@/src/templates/visualTemplate/templateSampleAssets';
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

test('dark surface without official variant still returns the color logo (no invented key)', () => {
  assert.equal(Object.keys(ORGANIZATION_DARK_LOGO_BY_LIGHT_KEY).length, 0);
  assert.equal(hasOfficialDarkLogoVariant(ORGANIZATION_SAMPLE_LOGO), false);
  assert.equal(
    resolveOrganizationLogoForSurface(ORGANIZATION_SAMPLE_LOGO, 'dark'),
    ORGANIZATION_SAMPLE_LOGO
  );
});

test('empty logo stays null on both surfaces', () => {
  assert.equal(resolveOrganizationLogoForSurface('', 'dark'), null);
  assert.equal(resolveOrganizationLogoForSurface(null, 'light'), null);
  assert.equal(hasOfficialDarkLogoVariant(''), false);
});

test('JCI footer and dark-logo CSS do not recolor via filter or blend', () => {
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
  assert.match(logoCss, /filter:\s*none/);
});
