/**
 * Deploy identity for Railway Backend verification.
 * Prefers Railway GitHub metadata — never exposes secrets.
 */
export function getBackendBuildIdentity() {
  const sha =
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.RAILWAY_GIT_COMMIT_SHA_SHORT ||
    process.env.GIT_COMMIT_SHA ||
    'unknown';
  const branch =
    process.env.RAILWAY_GIT_BRANCH ||
    process.env.GIT_BRANCH ||
    'unknown';
  const builtAt =
    process.env.RAILWAY_DEPLOYMENT_CREATED_AT ||
    process.env.BUILD_BUILT_AT ||
    new Date().toISOString();

  return {
    sha,
    branch,
    builtAt,
    service: 'backend' as const,
    label: 'figma-canonical-routes',
  };
}
