import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { canExposeEmailPreviewCode } from './mailer';

const KEYS = ['NODE_ENV', 'EMAIL_PROVIDER', 'EMAIL_ENABLED', 'ALLOW_EMAIL_PREVIEW_CODE'] as const;

function snapshotEnv() {
  return Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));
}

function restoreEnv(snapshot: Record<string, string | undefined>) {
  for (const key of KEYS) {
    const value = snapshot[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

describe('canExposeEmailPreviewCode', () => {
  const original = snapshotEnv();
  afterEach(() => restoreEnv(original));

  it('allows development + mock + flag=true', () => {
    process.env.NODE_ENV = 'development';
    process.env.EMAIL_PROVIDER = 'mock';
    process.env.EMAIL_ENABLED = 'false';
    process.env.ALLOW_EMAIL_PREVIEW_CODE = 'true';
    assert.equal(canExposeEmailPreviewCode(), true);
  });

  it('denies development + mock + flag=false', () => {
    process.env.NODE_ENV = 'development';
    process.env.EMAIL_PROVIDER = 'mock';
    process.env.EMAIL_ENABLED = 'false';
    process.env.ALLOW_EMAIL_PREVIEW_CODE = 'false';
    assert.equal(canExposeEmailPreviewCode(), false);
  });

  it('denies production even when flag=true', () => {
    process.env.NODE_ENV = 'production';
    process.env.EMAIL_PROVIDER = 'mock';
    process.env.EMAIL_ENABLED = 'false';
    process.env.ALLOW_EMAIL_PREVIEW_CODE = 'true';
    assert.equal(canExposeEmailPreviewCode(), false);
  });

  it('denies smtp provider', () => {
    process.env.NODE_ENV = 'development';
    process.env.EMAIL_PROVIDER = 'smtp';
    process.env.EMAIL_ENABLED = 'false';
    process.env.ALLOW_EMAIL_PREVIEW_CODE = 'true';
    assert.equal(canExposeEmailPreviewCode(), false);
  });

  it('denies EMAIL_ENABLED=true', () => {
    process.env.NODE_ENV = 'development';
    process.env.EMAIL_PROVIDER = 'mock';
    process.env.EMAIL_ENABLED = 'true';
    process.env.ALLOW_EMAIL_PREVIEW_CODE = 'true';
    assert.equal(canExposeEmailPreviewCode(), false);
  });
});
