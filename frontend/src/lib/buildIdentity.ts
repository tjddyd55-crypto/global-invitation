/** Build identity for deploy verification (visible via /api/build-identity). */
export const BUILD_IDENTITY = {
  sha: process.env.NEXT_PUBLIC_GIT_SHA || 'local',
  branch: process.env.NEXT_PUBLIC_GIT_BRANCH || 'local',
  builtAt: process.env.NEXT_PUBLIC_BUILT_AT || 'unknown',
  label: 'figma-canonical-routes',
};
