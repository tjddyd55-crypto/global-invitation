import assert from 'node:assert/strict';
import { getInvitationGalleryItems } from '../src/invitation/galleryItems';
import {
  getInvitationAccountItems,
  isAccountItemComplete,
  shouldShowAccountsSection,
  resolveAccountEnabled,
} from '../src/invitation/accountItems';
import { resolveVisibleSections } from '../src/editors/wedding/state/editorSteps';
import { computeEditorCompleteness } from '../src/editors/wedding/state/editorCompleteness';
import { createWeddingEditorState } from '../src/editors/wedding/state/weddingEditor.initial';
import { buildWeddingClassicPreviewData } from '../src/editors/wedding/state/weddingEditor.mapper';
import { getConceptPresentationConfig } from '../src/invitation/conceptPresentationConfig';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test('gallery selector normalizes galleryImages', () => {
  const items = getInvitationGalleryItems({
    galleryImages: [
      'https://cdn.example.com/invitation/development/users/u/invitations/i/gallery/a.jpg',
      '',
      'https://cdn.example.com/invitation/development/users/u/invitations/i/gallery/b.jpg',
    ],
  });
  assert.equal(items.length, 2);
  assert.equal(
    items[0]?.url,
    'https://cdn.example.com/invitation/development/users/u/invitations/i/gallery/a.jpg'
  );
});

test('gallery selector drops demo placeholders', () => {
  const items = getInvitationGalleryItems({
    galleryImages: [
      '/images/wedding/classic/gallery_01.jpg',
      'https://cdn.example.com/invitation/development/users/u/invitations/i/gallery/a.jpg',
    ],
  });
  assert.equal(items.length, 1);
  assert.ok(items[0]?.url.includes('/users/'));
});

test('new editor state starts with empty gallery', () => {
  const state = createWeddingEditorState(null, { conceptType: 'WEDDING' });
  assert.equal(state.gallery.images.length, 0);
  const preview = buildWeddingClassicPreviewData(state);
  assert.equal(preview.galleryImages.length, 0);
  const completeness = computeEditorCompleteness(state);
  // gallery section exists but is incomplete without user images
  assert.ok(completeness.total > 0);
});

test('account normalization keeps hyphen/string numbers', () => {
  const items = getInvitationAccountItems([
    { role: '참가비', bank: '국민은행', number: '123-456-789012', holder: '위원회' },
  ]);
  assert.equal(items[0]?.accountNumber, '123-456-789012');
  assert.equal(items[0]?.financialInstitution, '국민은행');
  assert.equal(isAccountItemComplete(items[0]!), true);
});

test('GENERAL accountEnabled optional defaults', () => {
  assert.equal(getConceptPresentationConfig('GENERAL').account, true);
  assert.equal(getConceptPresentationConfig('GENERAL').accountOptional, true);
  assert.equal(resolveAccountEnabled({ accounts: [] }, 'GENERAL'), false);
  assert.equal(
    shouldShowAccountsSection(
      {
        accountEnabled: true,
        accounts: [{ role: '참가비', bank: 'KB', number: '1', holder: 'A' }],
      },
      'GENERAL'
    ),
    true
  );
  assert.equal(
    shouldShowAccountsSection(
      {
        accountEnabled: true,
        accounts: [],
      },
      'GENERAL'
    ),
    false
  );
  assert.equal(
    shouldShowAccountsSection(
      {
        accountEnabled: false,
        accounts: [{ role: '참가비', bank: 'KB', number: '1', holder: 'A' }],
      },
      'GENERAL'
    ),
    false
  );
});

test('GENERAL editor steps are 9 with accounts at index 6', () => {
  const steps = resolveVisibleSections('GENERAL');
  assert.equal(steps.length, 9);
  assert.equal(steps[6]?.key, 'accounts');
  assert.equal(steps[7]?.key, 'rsvp');
  assert.equal(steps[8]?.key, 'share');
});

test('GENERAL mapper keeps accounts and accountEnabled', () => {
  const state = createWeddingEditorState(null, { conceptType: 'GENERAL' });
  state.extras.accountEnabled = true;
  state.extras.accountsTitle = '참가비 안내';
  state.accounts = [
    {
      id: 'a1',
      role: '참가비',
      bank: 'Chase',
      number: 'GB29NWBK60161331926819',
      holder: 'Org',
      iban: 'GB29 NWBK 6016 1331 9268 19',
      swiftBic: 'CHASUS33',
    },
  ];
  const preview = buildWeddingClassicPreviewData(state);
  assert.equal(preview.conceptType, 'GENERAL');
  assert.equal(preview.accountEnabled, true);
  assert.equal(preview.accounts.length, 1);
  assert.equal(preview.accounts[0]?.number, 'GB29NWBK60161331926819');
  assert.equal(preview.groomName, '');
  assert.equal(preview.accountsTitle, '참가비 안내');
});

test('completeness ignores optional account when OFF', () => {
  const state = createWeddingEditorState(null, { conceptType: 'GENERAL' });
  state.extras.accountEnabled = false;
  const off = computeEditorCompleteness(state);
  state.extras.accountEnabled = true;
  state.accounts = [];
  const onEmpty = computeEditorCompleteness(state);
  assert.ok(off.total <= onEmpty.total);
});

console.log('all account/gallery unit checks passed');
