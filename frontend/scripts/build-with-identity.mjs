/**
 * Inject deploy identity then run next build.
 * Ensures /api/build-identity matches the uploaded source SHA.
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

const env = {
  ...process.env,
  NEXT_PUBLIC_GIT_SHA: process.env.NEXT_PUBLIC_GIT_SHA || gitSha(),
  NEXT_PUBLIC_BUILT_AT: process.env.NEXT_PUBLIC_BUILT_AT || new Date().toISOString(),
};

console.log(`[build-with-identity] NEXT_PUBLIC_GIT_SHA=${env.NEXT_PUBLIC_GIT_SHA}`);
console.log(`[build-with-identity] NEXT_PUBLIC_BUILT_AT=${env.NEXT_PUBLIC_BUILT_AT}`);

const result = spawnSync(
  process.execPath,
  ['--max-old-space-size=6144', path.join(frontendRoot, 'node_modules/next/dist/bin/next'), 'build'],
  { cwd: frontendRoot, env, stdio: 'inherit' }
);

process.exit(result.status ?? 1);
