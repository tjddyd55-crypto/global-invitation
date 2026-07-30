/**
 * Unit: music completeness — OFF excluded; ON needs valid source.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { computeEditorCompleteness } from './editorCompleteness';
import { createWeddingEditorState } from './weddingEditor.initial';

function withMusic(
  patch: Partial<{
    musicEnabled: boolean;
    musicKey: string | undefined;
    musicFileUrl: string | undefined;
  }>
) {
  const state = createWeddingEditorState(null, { conceptType: 'WEDDING' });
  return {
    ...state,
    extras: {
      ...state.extras,
      musicEnabled: patch.musicEnabled ?? false,
      musicKey: patch.musicKey,
      musicFileUrl: patch.musicFileUrl,
    },
  };
}

test('music OFF does not affect completeness total', () => {
  const off = withMusic({ musicEnabled: false });
  const onIncomplete = withMusic({ musicEnabled: true });
  const offResult = computeEditorCompleteness(off);
  const onResult = computeEditorCompleteness(onIncomplete);
  assert.equal(offResult.total + 1, onResult.total);
  assert.ok(onResult.completed < onResult.total);
});

test('music ON without source is incomplete', () => {
  const state = withMusic({ musicEnabled: true, musicKey: undefined, musicFileUrl: undefined });
  const result = computeEditorCompleteness(state);
  // music contributes 1 to total but 0 to completed
  const withoutMusic = computeEditorCompleteness(withMusic({ musicEnabled: false }));
  assert.equal(result.total, withoutMusic.total + 1);
  assert.equal(result.completed, withoutMusic.completed);
});

test('music ON with shared catalog key is complete for music', () => {
  const incomplete = computeEditorCompleteness(
    withMusic({ musicEnabled: true, musicKey: undefined })
  );
  const complete = computeEditorCompleteness(
    withMusic({ musicEnabled: true, musicKey: 'piano_soft' })
  );
  assert.equal(complete.completed, incomplete.completed + 1);
});

test('music ON with upload url is complete for music', () => {
  const incomplete = computeEditorCompleteness(
    withMusic({ musicEnabled: true })
  );
  const complete = computeEditorCompleteness(
    withMusic({ musicEnabled: true, musicFileUrl: 'https://cdn.example/music.mp3' })
  );
  assert.equal(complete.completed, incomplete.completed + 1);
});
