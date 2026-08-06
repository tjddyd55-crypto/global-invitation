/**
 * Build a local runtime env file for development media verification.
 * Never prints secret values.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function loadVars(service) {
  let raw = execSync(`railway variables -s ${service} -e development --json`, {
    encoding: 'utf8',
  });
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  return JSON.parse(raw);
}

const pg = loadVars('Postgres');
const be = loadVars('Backend');

if (!pg.DATABASE_PUBLIC_URL) {
  throw new Error('DATABASE_PUBLIC_URL missing on Postgres service');
}

const env = {
  DATABASE_URL: String(pg.DATABASE_PUBLIC_URL).trim(),
  R2_ACCOUNT_ID: String(be.R2_ACCOUNT_ID || '').trim(),
  R2_ACCESS_KEY_ID: String(be.R2_ACCESS_KEY_ID || '').trim(),
  R2_SECRET_ACCESS_KEY: String(be.R2_SECRET_ACCESS_KEY || '').trim(),
  R2_BUCKET_NAME: String(be.R2_BUCKET_NAME || '').trim(),
  R2_ENDPOINT: String(be.R2_ENDPOINT || '').trim(),
  R2_PUBLIC_BASE_URL: String(be.R2_PUBLIC_BASE_URL || '').trim(),
  R2_REGION: String(be.R2_REGION || 'auto').trim(),
  INVITATION_ASSET_ENVIRONMENT: String(be.INVITATION_ASSET_ENVIRONMENT || 'development').trim(),
  INVITATION_R2_ROOT_PREFIX: String(be.INVITATION_R2_ROOT_PREFIX || 'invitation').trim(),
  INVITATION_TEMP_MEDIA_CLEANUP_ENABLED: String(be.INVITATION_TEMP_MEDIA_CLEANUP_ENABLED || 'false').trim(),
};

if (be.INVITATION_TEMP_MEDIA_RETENTION_HOURS) {
  env.INVITATION_TEMP_MEDIA_RETENTION_HOURS = String(be.INVITATION_TEMP_MEDIA_RETENTION_HOURS).trim();
}
if (be.INVITATION_TEMP_MEDIA_CLEANUP_BATCH_SIZE) {
  env.INVITATION_TEMP_MEDIA_CLEANUP_BATCH_SIZE = String(be.INVITATION_TEMP_MEDIA_CLEANUP_BATCH_SIZE).trim();
}
if (be.INVITATION_TEMP_MEDIA_SAFETY_THRESHOLD) {
  env.INVITATION_TEMP_MEDIA_SAFETY_THRESHOLD = String(be.INVITATION_TEMP_MEDIA_SAFETY_THRESHOLD).trim();
}

const outDir = path.resolve(__dirname, '../../artifacts/temp-media-verification');
fs.mkdirSync(outDir, { recursive: true });
const envPath = path.join(outDir, '.env.runtime');
const body = Object.entries(env)
  .filter(([, value]) => value)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');
fs.writeFileSync(envPath, `${body}\n`, { encoding: 'utf8', mode: 0o600 });

console.log(
  JSON.stringify(
    {
      envPath,
      db: 'PUBLIC_PROXY_SET',
      r2Bucket: env.R2_BUCKET_NAME,
      assetEnv: env.INVITATION_ASSET_ENVIRONMENT,
      cleanupEnabled: env.INVITATION_TEMP_MEDIA_CLEANUP_ENABLED,
      lineCount: body.split('\n').length,
    },
    null,
    2
  )
);
