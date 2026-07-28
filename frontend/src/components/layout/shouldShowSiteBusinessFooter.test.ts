import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldShowSiteBusinessFooter } from './shouldShowSiteBusinessFooter';

test('shows on service surfaces', () => {
  assert.equal(shouldShowSiteBusinessFooter('/'), true);
  assert.equal(shouldShowSiteBusinessFooter('/dashboard'), true);
  assert.equal(shouldShowSiteBusinessFooter('/my-invitations'), true);
  assert.equal(shouldShowSiteBusinessFooter('/auth/email'), true);
  assert.equal(shouldShowSiteBusinessFooter('/create/concept'), true);
});

test('hides on public invitation and editor', () => {
  assert.equal(shouldShowSiteBusinessFooter('/i/sample'), false);
  assert.equal(shouldShowSiteBusinessFooter('/editor/abc'), false);
  assert.equal(shouldShowSiteBusinessFooter('/m/editor/abc'), false);
  assert.equal(shouldShowSiteBusinessFooter('/preview/abc'), false);
});
