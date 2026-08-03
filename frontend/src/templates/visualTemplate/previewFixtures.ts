/**
 * Sample fixtures for Template Preview — no DB writes.
 * Image paths point at local SVG placeholders until R2 assets land (Phase 2E).
 */
import type { WeddingInvitationData } from '@/src/invitation/schemas';
import type { VisualTemplateId } from './ids';
import { VISUAL_TEMPLATE_CONCEPT } from './ids';

const SAMPLE_GALLERY = Array.from({ length: 12 }, (_, i) => {
  const n = String(i + 1).padStart(2, '0');
  return `/templates/visual/_shared/sample-${(i % 4) + 1}.svg`;
});

function weddingFixture(visualTemplateId: VisualTemplateId): WeddingInvitationData {
  return {
    templateType: 'FULL',
    conceptType: 'WEDDING',
    visualTemplateId,
    title: '지수 · 민준',
    subtitle: '서로의 오늘이 만나 하나의 계절이 됩니다',
    content: '기쁜 날, 소중한 분들과 새로운 걸음을 시작하려 합니다.',
    eventDate: '2026-10-17T14:00:00',
    locationText: '라움 아트센터',
    venueDetail: '2F 메리홀 · 서울 강남구 언주로 564',
    venueName: '라움 아트센터',
    schedule: ['2026년 10월 17일 오후 2시'],
    rsvpEnabled: true,
    guestbookEnabled: true,
    commentsEnabled: true,
    heroImage: SAMPLE_GALLERY[0],
    galleryImages: SAMPLE_GALLERY,
    galleryDisplayMode: 'GRID_EXPAND',
    heroTitle: '지수 · 민준',
    heroSubtitle: '2026. 10. 17. SAT · 오후 2시',
    introQuote: '서로의 오늘이 만나 하나의 계절이 됩니다',
    introText: ['기쁜 날, 소중한 분들과 새로운 걸음을 시작하려 합니다.'],
    weddingDate: new Date('2026-10-17T14:00:00'),
    weddingDateTime: '2026-10-17T14:00:00',
    address: '서울 강남구 언주로 564',
    formattedAddress: '서울 강남구 언주로 564',
    mapLat: 37.5085,
    mapLng: 127.0364,
    mapProvider: 'GOOGLE',
    groomName: '김민준',
    brideName: '박지수',
    groomImage: SAMPLE_GALLERY[1],
    brideImage: SAMPLE_GALLERY[2],
    groomPhone: '010-1234-5678',
    bridePhone: '010-9876-5432',
    parentsInfo: '',
    groom: {
      name: '김민준',
      image: SAMPLE_GALLERY[1],
      phone: '010-1234-5678',
      parentsText: '김○○ · 이○○ 의 아들',
    },
    bride: {
      name: '박지수',
      image: SAMPLE_GALLERY[2],
      phone: '010-9876-5432',
      parentsText: '박○○ · 최○○ 의 딸',
    },
    accounts: [
      { role: '신랑', bank: '국민은행', number: '294801-04-123456', holder: '김민준' },
      { role: '신부', bank: '신한은행', number: '110-234-567890', holder: '박지수' },
      { role: '혼주', bank: '우리은행', number: '1002-123-456789', holder: '김○○' },
    ],
    accountEnabled: true,
    music: { enabled: true, sourceType: 'SHARED', musicKey: undefined, loop: true },
    transportInfo: ['2호선 선릉역 3번 출구 도보 5분'],
    parkingInfo: ['건물 지하 주차장 이용'],
  };
}

function generalFixture(visualTemplateId: VisualTemplateId): WeddingInvitationData {
  return {
    templateType: 'FULL',
    conceptType: 'GENERAL',
    visualTemplateId,
    title: '창작의 리듬',
    subtitle: '만들고, 이야기하고, 함께 머무는 오후',
    content: '오랜 시간 쌓아 온 작업과 생각을 한자리에서 나눕니다.',
    eventDate: '2026-10-17T13:00:00',
    locationText: 'STUDIO MUUMU',
    venueDetail: '성수동 1가 685-215',
    venueName: 'STUDIO MUUMU',
    schedule: ['2026년 10월 17일 13:00 — 19:00'],
    rsvpEnabled: true,
    guestbookEnabled: true,
    commentsEnabled: true,
    heroImage: SAMPLE_GALLERY[0],
    galleryImages: SAMPLE_GALLERY,
    galleryDisplayMode: 'SLIDE',
    heroTitle: '창작의 리듬',
    heroSubtitle: '2026. 10. 17. SAT · 13:00 — 19:00',
    introQuote: '만들고, 이야기하고, 함께 머무는 오후',
    introText: ['오랜 시간 쌓아 온 작업과 생각을 한자리에서 나눕니다.'],
    weddingDate: new Date('2026-10-17T13:00:00'),
    weddingDateTime: '2026-10-17T13:00:00',
    address: '서울 성동구 성수동1가 685-215',
    formattedAddress: '서울 성동구 성수동1가 685-215',
    mapLat: 37.5445,
    mapLng: 127.0557,
    mapProvider: 'GOOGLE',
    groomName: '',
    brideName: '',
    accounts: [
      { role: '참가비', bank: '카카오뱅크', number: '3333-01-1234567', holder: 'STUDIO MUUMU' },
      { role: '후원', bank: '국민은행', number: '123456-78-901234', holder: 'STUDIO MUUMU' },
    ],
    accountEnabled: true,
    accountsTitle: '참가비 · 계좌',
    music: { enabled: true, sourceType: 'SHARED', loop: true },
    transportInfo: ['분당선 성수역 2번 출구'],
    parkingInfo: ['인근 공영주차장 이용'],
  };
}

export function getVisualTemplatePreviewFixture(id: VisualTemplateId): WeddingInvitationData {
  const concept = VISUAL_TEMPLATE_CONCEPT[id];
  return concept === 'WEDDING' ? weddingFixture(id) : generalFixture(id);
}
