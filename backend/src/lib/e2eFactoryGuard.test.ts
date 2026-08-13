import assert from 'node:assert/strict';
import test from 'node:test';
import { isE2eFactoryDisabled } from './e2eFactoryGuard';

test('E2E published invitation factory is disabled only in production', () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    assert.equal(isE2eFactoryDisabled(), true);
  } finally {
    process.env.NODE_ENV = previous;
  }

  process.env.NODE_ENV = 'development';
  try {
    assert.equal(isE2eFactoryDisabled(), false);
  } finally {
    process.env.NODE_ENV = previous;
  }
});
