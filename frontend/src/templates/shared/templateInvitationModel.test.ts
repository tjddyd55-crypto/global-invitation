import assert from 'node:assert/strict';
import test from 'node:test';
import { buildTemplateInvitationModel } from './templateInvitationModel';
import type { WeddingInvitationData } from '@/src/invitation/schemas';

function baseData(overrides: Partial<WeddingInvitationData> = {}): WeddingInvitationData {
  return {
    templateType: 'FULL',
    conceptType: 'WEDDING',
    title: 'Daniel & Emma',
    eventDate: '2026-10-17T14:00:00',
    locationText: 'The Langham',
    venueName: 'The Langham',
    content: 'You are invited.',
    groomName: 'Daniel',
    brideName: 'Emma',
    schedule: [],
    ...overrides,
  } as WeddingInvitationData;
}

test('wedding renderer model uses Invitation.language over dataJson.locale', () => {
  const ko = buildTemplateInvitationModel(baseData({ language: 'ko-KR', locale: 'en-US' }));
  assert.equal(ko.locale, 'ko-KR');
  assert.equal(ko.groom?.role, '신랑');

  const en = buildTemplateInvitationModel(baseData({ language: 'en-US', locale: 'ko-KR' }));
  assert.equal(en.locale, 'en-US');
  assert.equal(en.groom?.role, 'Groom');
  assert.equal(en.bride?.role, 'Bride');
});

test('general title fallback follows invitation locale', () => {
  const ko = buildTemplateInvitationModel(
    baseData({ conceptType: 'GENERAL', title: '', heroTitle: '', coupleNames: '', language: 'ko-KR' })
  );
  assert.equal(ko.title, '행사에 초대합니다');

  const en = buildTemplateInvitationModel(
    baseData({ conceptType: 'GENERAL', title: '', heroTitle: '', coupleNames: '', language: 'en-US' })
  );
  assert.equal(en.title, "You're Invited");
});
