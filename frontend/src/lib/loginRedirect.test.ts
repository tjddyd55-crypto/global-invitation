import assert from 'node:assert/strict';
import test from 'node:test';
import { getAuthReturnParam, resolveLoginRedirectForStorage, sanitizeReturnPath } from './loginRedirect';

test('next and redirect are supported with next taking precedence', () => {
  assert.equal(getAuthReturnParam(new URLSearchParams('next=/pc/my-invitations&redirect=/m')), '/pc/my-invitations');
  assert.equal(getAuthReturnParam(new URLSearchParams('redirect=/m/my-invitations')), '/m/my-invitations');
});

test('only safe internal return paths are accepted', () => {
  const unsafe = [
    'https://evil.example', '//evil.example', '/\\evil.example', '/%5cevil.example',
    '/%2fevil.example', '/\nevil.example', '/%0aevil.example', '/%', '/login#again',
    '/pc/signup?next=/pc', '/m/../login', '/%6cogin', '/a/..//evil.example',
  ];
  for (const path of unsafe) assert.equal(sanitizeReturnPath(path), '/', path);
  assert.equal(sanitizeReturnPath('/pc/my-invitations?tab=drafts#list'), '/pc/my-invitations?tab=drafts#list');
  assert.equal(sanitizeReturnPath('/pc/my-invitations?q=hello world'), '/pc/my-invitations?q=hello%20world');
});

test('query values are decoded once and same-origin referrers are sanitized', () => {
  const params = new URLSearchParams('next=%2Fpc%2Fmy-invitations%3Fq%3Da%2526b');
  assert.equal(resolveLoginRedirectForStorage(getAuthReturnParam(params), '', ''), '/pc/my-invitations?q=a%26b');
  assert.equal(resolveLoginRedirectForStorage(null, 'https://web.example/m/my-invitations', 'https://web.example'), '/m/my-invitations');
  assert.equal(resolveLoginRedirectForStorage(null, 'https://evil.example/path', 'https://web.example'), '/');
});
