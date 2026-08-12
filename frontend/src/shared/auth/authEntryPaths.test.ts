import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CONCEPT_CREATE_PATH,
  ORGANIZATION_TEMPLATES_PATH,
  getConceptCardEntryPath,
  getCreateInvitationEntryPath,
} from './authEntryPaths';

test('organization home card goes to organization template catalog', () => {
  assert.equal(
    getConceptCardEntryPath('ORGANIZATION', 'authenticated'),
    ORGANIZATION_TEMPLATES_PATH
  );
  assert.match(
    getConceptCardEntryPath('ORGANIZATION', 'unauthenticated'),
    /auth\/email\?next=/
  );
  assert.match(
    getConceptCardEntryPath('ORGANIZATION', 'unauthenticated'),
    /concept%3DORGANIZATION/
  );
});

test('other home cards keep generic create entry', () => {
  assert.equal(getConceptCardEntryPath('WEDDING', 'authenticated'), CONCEPT_CREATE_PATH);
  assert.equal(getConceptCardEntryPath('FUNERAL', 'authenticated'), CONCEPT_CREATE_PATH);
  assert.equal(getConceptCardEntryPath('GENERAL', 'authenticated'), CONCEPT_CREATE_PATH);
  assert.equal(getCreateInvitationEntryPath('authenticated'), CONCEPT_CREATE_PATH);
});
