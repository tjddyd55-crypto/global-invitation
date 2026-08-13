import assert from 'node:assert/strict';
import test from 'node:test';
import { getInvitationRsvpSettings } from './rsvpSettings';

test('RSVP copy prefers Invitation.language over dataJson.locale', () => {
  const en = getInvitationRsvpSettings(
    {
      conceptType: 'WEDDING',
      rsvpEnabled: true,
      language: 'en-US',
      locale: 'ko-KR',
    },
    'WEDDING'
  );
  assert.equal(en.buttonLabel, 'RSVP Now');

  const ko = getInvitationRsvpSettings(
    {
      conceptType: 'WEDDING',
      rsvpEnabled: true,
      language: 'ko-KR',
      locale: 'en-US',
    },
    'WEDDING'
  );
  assert.equal(ko.buttonLabel, '참석 여부 알리기');
});
