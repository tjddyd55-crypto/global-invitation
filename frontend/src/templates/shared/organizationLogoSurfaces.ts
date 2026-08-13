/**
 * Organization logo surface resolver.
 *
 * Dark backgrounds must use an official inverted / white logo variant when one exists.
 * Never invent, recolor, invert, or filter a logo in CSS.
 * Never wrap the logo in a white holding plate.
 */
import {
  ORGANIZATION_SAMPLE_LOGO,
  ORGANIZATION_SAMPLE_LOGO_DARK,
} from '@/src/templates/visualTemplate/templateSampleAssets';

export type OrganizationLogoSurface = 'light' | 'dark';

/**
 * Official inverted/white logo keys, keyed by the default (light-surface) logo key.
 */
export const ORGANIZATION_DARK_LOGO_BY_LIGHT_KEY: Readonly<Record<string, string>> = {
  [ORGANIZATION_SAMPLE_LOGO]: ORGANIZATION_SAMPLE_LOGO_DARK,
};

export function resolveOrganizationLogoForSurface(
  logo: string | null | undefined,
  surface: OrganizationLogoSurface
): string | null {
  const key = (logo || '').trim();
  if (!key) return null;
  if (surface !== 'dark') return key;
  return ORGANIZATION_DARK_LOGO_BY_LIGHT_KEY[key] ?? key;
}

export function hasOfficialDarkLogoVariant(logo: string | null | undefined): boolean {
  const key = (logo || '').trim();
  return Boolean(key && ORGANIZATION_DARK_LOGO_BY_LIGHT_KEY[key]);
}
