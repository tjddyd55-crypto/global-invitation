import assert from 'node:assert/strict';
import test from 'node:test';
import { InvitationMusicCategory } from '@prisma/client';
import {
  buildPublicCategoryFilter,
  ensureTrackCanBeDeleted,
  InvitationMusicLibraryError,
  mapMusicCategoryToConcept,
} from './invitationMusicLibraryService';

test('공용 및 웨딩 카테고리를 R2 경로 세그먼트로 변환한다', () => {
  assert.equal(mapMusicCategoryToConcept(InvitationMusicCategory.COMMON), 'common');
  assert.equal(mapMusicCategoryToConcept(InvitationMusicCategory.WEDDING), 'wedding');
});

test('웨딩 공개 목록은 공용 및 웨딩 카테고리만 포함한다', () => {
  assert.deepEqual(buildPublicCategoryFilter(InvitationMusicCategory.WEDDING), [
    InvitationMusicCategory.COMMON,
    InvitationMusicCategory.WEDDING,
  ]);
});

test('사용 중인 음악은 삭제를 차단한다', () => {
  assert.throws(
    () => ensureTrackCanBeDeleted(1),
    (error: unknown) =>
      error instanceof InvitationMusicLibraryError &&
      error.code === 'USAGE_BLOCKED' &&
      error.status === 409
  );
  assert.doesNotThrow(() => ensureTrackCanBeDeleted(0));
});
