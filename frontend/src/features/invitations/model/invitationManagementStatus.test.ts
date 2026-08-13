import assert from 'node:assert/strict';
import test from 'node:test';
import type { InvitationSummary } from '@/src/shared/api';
import {
  countInvitationsByManagementStatus,
  groupInvitationsByManagementStatus,
  invitationDisplayTitle,
  resolveInvitationManagementStatus,
} from './invitationManagementStatus';

function summary(
  overrides: Partial<InvitationSummary> & Pick<InvitationSummary, 'id' | 'status'>
): InvitationSummary {
  return {
    slug: overrides.slug || overrides.id,
    title: overrides.title ?? '행사',
    templateKey: 'invitation_full',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-13T00:00:00.000Z',
    publishedAt: overrides.publishedAt ?? null,
    shareSlug: overrides.shareSlug ?? null,
    ...overrides,
  };
}

test('draft and unused SHARED resolve to EDITING', () => {
  assert.equal(resolveInvitationManagementStatus({ status: 'DRAFT' }), 'EDITING');
  assert.equal(resolveInvitationManagementStatus({ status: 'draft' }), 'EDITING');
  assert.equal(resolveInvitationManagementStatus({ status: 'SHARED' }), 'EDITING');
  assert.equal(resolveInvitationManagementStatus({ status: null }), 'EDITING');
});

test('published resolves to SHARING regardless of payment fields', () => {
  assert.equal(resolveInvitationManagementStatus({ status: 'PUBLISHED' }), 'SHARING');
  assert.equal(resolveInvitationManagementStatus({ status: 'published' }), 'SHARING');
});

test('paid but unpublished stays EDITING', () => {
  assert.equal(
    resolveInvitationManagementStatus({ status: 'DRAFT' }),
    'EDITING'
  );
});

test('event date in the past does not create EXPIRED', () => {
  assert.equal(resolveInvitationManagementStatus({ status: 'PUBLISHED' }), 'SHARING');
  assert.equal(resolveInvitationManagementStatus({ status: 'DRAFT' }), 'EDITING');
});

test('group and count cover all tabs including zero expired', () => {
  const items = [
    summary({ id: 'd1', status: 'DRAFT', updatedAt: '2026-08-13T12:00:00.000Z' }),
    summary({ id: 'd2', status: 'DRAFT', updatedAt: '2026-08-12T12:00:00.000Z' }),
    summary({
      id: 'p1',
      status: 'PUBLISHED',
      shareSlug: 'abc12345',
      publishedAt: '2026-08-10T00:00:00.000Z',
    }),
  ];
  const groups = groupInvitationsByManagementStatus(items);
  const counts = countInvitationsByManagementStatus(items);
  assert.equal(groups.EDITING.length, 2);
  assert.equal(groups.SHARING.length, 1);
  assert.equal(groups.EXPIRED.length, 0);
  assert.deepEqual(counts, { EDITING: 2, SHARING: 1, EXPIRED: 0 });
  assert.equal(groups.EDITING[0]?.id, 'd1');
});

test('untitled invitation keeps a safe display title', () => {
  assert.equal(invitationDisplayTitle(null), '제목 없음');
  assert.equal(invitationDisplayTitle('  '), '제목 없음');
  assert.equal(invitationDisplayTitle('창립기념식'), '창립기념식');
});
