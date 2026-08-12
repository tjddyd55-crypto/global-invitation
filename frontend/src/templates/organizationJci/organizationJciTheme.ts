/**
 * ORGANIZATION_02_JCI brand tokens — JCI Brand Guidelines (v1.2 / 2025-11).
 * CSS modules consume these via --jci-* variables; do not scatter hex in JSX.
 */
export const ORGANIZATION_JCI_THEME = {
  blue: '#0097D7',
  black: '#130F2D',
  white: '#FFFFFF',
  navy: '#1F4789',
  teal: '#57BCBC',
  yellow: '#EFC40F',
} as const;

export type OrganizationJciTheme = typeof ORGANIZATION_JCI_THEME;
