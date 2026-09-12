export const colors = {
  bg: '#F4EFE6',
  surface: '#FFFFFF',
  primary: '#5B4FD6',
  primaryPressed: '#4A3FC4',
  text: '#1E2433',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  error: '#DC2626',
  success: '#16A34A',
  warning: '#F59E0B',
  overlay: 'rgba(30, 36, 51, 0.4)',
  devBadge: '#F59E0B',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const sizes = {
  buttonHeight: 52,
  inputHeight: 48,
  touchTarget: 44,
  templatePreviewWidth: 358,
  templateItemGap: 28,
  screenPadding: 16,
} as const;

export const typography = {
  title: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  heading: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMedium: { fontSize: 16, fontWeight: '500' as const, lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
} as const;
