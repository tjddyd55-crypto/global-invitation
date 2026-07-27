/**
 * Inject deploy identity then run next build.
 * Prefers Railway GitHub metadata so /api/build-identity matches the deployed commit.
 */
import { execSync, spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(frontendRoot, '..');

function gitSha() {
  try {
    return execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function gitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Railway GitHub builds expose RAILWAY_GIT_COMMIT_SHA / RAILWAY_GIT_BRANCH.
 * Prefer those over a stale NEXT_PUBLIC_GIT_SHA service variable.
 */
const resolvedSha =
  process.env.RAILWAY_GIT_COMMIT_SHA ||
  process.env.RAILWAY_GIT_COMMIT_SHA_SHORT ||
  process.env.NEXT_PUBLIC_GIT_SHA ||
  gitSha();

const resolvedBranch =
  process.env.RAILWAY_GIT_BRANCH ||
  process.env.NEXT_PUBLIC_GIT_BRANCH ||
  gitBranch();

const env = {
  ...process.env,
  NEXT_PUBLIC_GIT_SHA: resolvedSha,
  NEXT_PUBLIC_GIT_BRANCH: resolvedBranch,
  NEXT_PUBLIC_BUILT_AT: process.env.NEXT_PUBLIC_BUILT_AT || new Date().toISOString(),
};

console.log(`[build-with-identity] NEXT_PUBLIC_GIT_SHA=${env.NEXT_PUBLIC_GIT_SHA}`);
console.log(`[build-with-identity] NEXT_PUBLIC_GIT_BRANCH=${env.NEXT_PUBLIC_GIT_BRANCH}`);
console.log(`[build-with-identity] NEXT_PUBLIC_BUILT_AT=${env.NEXT_PUBLIC_BUILT_AT}`);

const result = spawnSync(
  process.execPath,
  ['--max-old-space-size=6144', path.join(frontendRoot, 'node_modules/next/dist/bin/next'), 'build'],
  { cwd: frontendRoot, env, stdio: 'inherit' }
);

process.exit(result.status ?? 1);
