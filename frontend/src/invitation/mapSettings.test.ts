import assert from 'node:assert/strict';
import test from 'node:test';
import { getInvitationMapSettings } from './mapSettings';

test('defaults to GOOGLE', () => {
  const settings = getInvitationMapSettings({ address: '서울' });
  assert.equal(settings.provider, 'GOOGLE');
  assert.equal(settings.formattedAddress, '서울');
});

test('reads NAVER provider', () => {
  const settings = getInvitationMapSettings({
    mapProvider: 'NAVER',
    address: '부산',
    mapLat: 35.1,
    mapLng: 129.0,
    naverPlaceId: 'place-1',
  });
  assert.equal(settings.provider, 'NAVER');
  assert.equal(settings.naverPlaceId, 'place-1');
  assert.equal(settings.latitude, 35.1);
});
