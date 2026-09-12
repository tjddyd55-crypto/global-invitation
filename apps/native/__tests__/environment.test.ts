import { buildApiUrl, buildWebUrl, getEnvironment } from '@/src/config/environment';

describe('environment config', () => {
  it('resolves development URLs by default in tests', () => {
    const env = getEnvironment();
    expect(env.variant).toBe('development');
    expect(env.apiBaseUrl).toContain('backend-development');
    expect(env.webBaseUrl).toContain('frontend-development');
    expect(env.scheme).toBe('globalinvitation-dev');
  });

  it('builds API and web URLs', () => {
    expect(buildApiUrl('/api/auth/me')).toMatch(/\/api\/auth\/me$/);
    expect(buildWebUrl('/embed/owner-preview')).toMatch(/\/embed\/owner-preview$/);
  });
});
