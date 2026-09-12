import Constants from 'expo-constants';

export type AppVariant = 'development' | 'production';

export type EnvironmentConfig = {
  variant: AppVariant;
  apiBaseUrl: string;
  webBaseUrl: string;
  isDev: boolean;
  appName: string;
  scheme: string;
};

const ENVIRONMENTS: Record<AppVariant, Omit<EnvironmentConfig, 'variant' | 'isDev'>> = {
  development: {
    apiBaseUrl: 'https://backend-development-c9a4.up.railway.app',
    webBaseUrl: 'https://frontend-development-1b8a.up.railway.app',
    appName: 'Global Invitation DEV',
    scheme: 'globalinvitation-dev',
  },
  production: {
    apiBaseUrl: 'https://backend-production-f6f3.up.railway.app',
    webBaseUrl: 'https://frontend-production-54bf.up.railway.app',
    appName: 'Global Invitation',
    scheme: 'globalinvitation',
  },
};

function resolveVariant(): AppVariant {
  const fromExtra = Constants.expoConfig?.extra?.appVariant;
  if (fromExtra === 'production') return 'production';
  if (process.env.APP_VARIANT === 'production') return 'production';
  return 'development';
}

export function getEnvironment(): EnvironmentConfig {
  const variant = resolveVariant();
  const base = ENVIRONMENTS[variant];
  return {
    variant,
    ...base,
    isDev: variant === 'development',
  };
}

export const environment = getEnvironment();

export function buildApiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${environment.apiBaseUrl}${normalized}`;
}

export function buildWebUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${environment.webBaseUrl}${normalized}`;
}

export function buildPublicInvitationUrl(shareSlug: string): string {
  return buildWebUrl(`/i/${shareSlug}`);
}

export function buildOwnerPreviewUrl(token: string): string {
  return buildWebUrl(`/embed/owner-preview?token=${encodeURIComponent(token)}`);
}
