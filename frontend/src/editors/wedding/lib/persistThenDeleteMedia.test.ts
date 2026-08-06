/**
 * Unit: persist-then-delete ordering and rollback.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { persistThenDeleteMedia } from './persistThenDeleteMedia';

test('persist success then delete', async () => {
  const events: string[] = [];
  const status = await persistThenDeleteMedia({
    applyDraftRemoval: () => events.push('apply'),
    rollbackDraft: () => events.push('rollback'),
    persistDraft: async () => {
      events.push('persist');
    },
    deleteRemote: async () => {
      events.push('delete');
    },
  });
  assert.equal(status, 'ok');
  assert.deepEqual(events, ['apply', 'persist', 'delete']);
});

test('persist failure rolls back and skips delete', async () => {
  const events: string[] = [];
  const status = await persistThenDeleteMedia({
    applyDraftRemoval: () => events.push('apply'),
    rollbackDraft: () => events.push('rollback'),
    persistDraft: async () => {
      events.push('persist');
      throw new Error('SAVE_FAILED');
    },
    deleteRemote: async () => {
      events.push('delete');
    },
  });
  assert.equal(status, 'persist_failed');
  assert.deepEqual(events, ['apply', 'persist', 'rollback']);
});

test('delete failure keeps cleared draft', async () => {
  const events: string[] = [];
  const status = await persistThenDeleteMedia({
    applyDraftRemoval: () => events.push('apply'),
    rollbackDraft: () => events.push('rollback'),
    persistDraft: async () => {
      events.push('persist');
    },
    deleteRemote: async () => {
      events.push('delete');
      throw new Error('DELETE_FAILED');
    },
  });
  assert.equal(status, 'delete_failed');
  assert.deepEqual(events, ['apply', 'persist', 'delete']);
});

test('omit deleteRemote skips remote cleanup', async () => {
  const events: string[] = [];
  const status = await persistThenDeleteMedia({
    applyDraftRemoval: () => events.push('apply'),
    rollbackDraft: () => events.push('rollback'),
    persistDraft: async () => {
      events.push('persist');
    },
  });
  assert.equal(status, 'skipped_remote');
  assert.deepEqual(events, ['apply', 'persist']);
});
