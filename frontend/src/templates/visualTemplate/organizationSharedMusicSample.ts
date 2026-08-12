/**
 * ORGANIZATION Template Preview 전용 샘플 BGM (JCI Creed Song).
 *
 * Runtime Editor/Public 카탈로그 SSOT 는 Backend InvitationMusicTrack.
 * 여기 값은 Preview fixture 전용 — create draft 에 복사하지 않는다.
 *
 * objectKey 는 development 공용 R2 에 publish-jci-organization-music 으로 등록된 키.
 * 재등록 시 스크립트가 logicalId 로 idempotent 하므로 기존 키를 유지한다.
 */
export const ORGANIZATION_SAMPLE_MUSIC = {
  logicalId: 'JCI_CREED_SONG',
  title: 'JCI Creed Song',
  objectKey:
    'invitation/shared/music/general/7915ed06-84da-4a1d-aee9-3bae103fccf7.mp3',
  trackId: '7e718468-fe68-4903-8cda-3a7ab613483b',
} as const;

/** Catalog 등록된 2곡 logical id (문서·테스트용). */
export const ORGANIZATION_JCI_MUSIC_LOGICAL_IDS = [
  'JCI_CREED_SONG',
  'JCI_CREED_SONG_2',
] as const;
