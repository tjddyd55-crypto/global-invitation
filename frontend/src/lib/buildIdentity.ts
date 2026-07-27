/** Build identity for deploy verification (visible in HTML /_next and API). */
export const BUILD_IDENTITY = {
  sha: process.env.NEXT_PUBLIC_GIT_SHA || 'local',
  builtAt: process.env.NEXT_PUBLIC_BUILT_AT || 'unknown',
  label: 'figma-canonical-routes',
};
