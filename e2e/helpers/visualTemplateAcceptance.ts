/**
 * Visual template final-acceptance helpers (development E2E).
 */
import { expect, type APIRequestContext, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

export const API = process.env.E2E_API_BASE_URL || 'https://backend-development-c9a4.up.railway.app';
export const FE = process.env.PLAYWRIGHT_BASE_URL || 'https://frontend-development-1b8a.up.railway.app';

export const NEW_SIX = [
  'WEDDING_04_EDITORIAL',
  'WEDDING_05_GARDEN',
  'WEDDING_06_NIGHT',
  'GENERAL_04_CLEAN',
  'GENERAL_05_FESTIVE',
  'GENERAL_06_CULTURE',
] as const;

export type VisualTemplateCaseId = (typeof NEW_SIX)[number];

const CDN = 'https://cdn.platform-assets.com';
const PREFIX = 'invitation/shared/images/templates';

function asset(rel: string): string {
  return `${CDN}/${PREFIX}/${rel}`;
}

function weddingGallery(id: VisualTemplateCaseId): string[] {
  return [
    asset(`${id}/hero.webp`),
    ...Array.from({ length: 8 }, (_, i) => asset(`shared-wedding/photo-${String(i + 1).padStart(2, '0')}.webp`)),
    asset('WEDDING_01_CLASSIC/hero.webp'),
    asset('WEDDING_05_GARDEN/hero.webp'),
  ];
}

function generalGallery(id: VisualTemplateCaseId): string[] {
  return [
    asset(`${id}/hero.webp`),
    ...Array.from({ length: 8 }, (_, i) => asset(`shared-general/photo-${String(i + 1).padStart(2, '0')}.webp`)),
    asset('GENERAL_01_CLASSIC/hero.webp'),
    asset('GENERAL_05_FESTIVE/hero.webp'),
  ];
}

export function buildRichWeddingData(id: VisualTemplateCaseId, title: string) {
  return {
    templateType: 'FULL' as const,
    conceptType: 'WEDDING' as const,
    visualTemplateId: id,
    title,
    subtitle: '수락 검증용 부제',
    content: '수락 검증용 인사말입니다.\n두 번째 줄입니다.',
    eventDate: '2026-12-12T14:30:00',
    locationText: '수락홀 그랜드볼룸',
    venueName: '수락홀 그랜드볼룸',
    venueDetail: '3층 아델라홀',
    address: '서울특별시 강남구 테헤란로 123',
    formattedAddress: '서울특별시 강남구 테헤란로 123',
    detailAddress: '3층 아델라홀',
    schedule: ['예식 후 연회'],
    rsvpEnabled: true,
    guestbookEnabled: false,
    commentsEnabled: false,
    heroImage: asset(`${id}/hero.webp`),
    galleryImages: weddingGallery(id),
    galleryDisplayMode: 'GRID_EXPAND' as const,
    heroTitle: title,
    heroSubtitle: '2026년 12월 12일',
    coupleNames: title,
    introQuote: '검증용 인용구',
    introText: ['수락 검증용 인사말입니다.', '두 번째 줄입니다.'],
    weddingDateTime: '2026년 12월 12일 토요일 오후 2시 30분',
    mapLat: 37.5012,
    mapLng: 127.0396,
    mapProvider: 'GOOGLE' as const,
    groomName: '김수락',
    brideName: '이수락',
    groomImage: asset('shared-wedding/groom.webp'),
    brideImage: asset('shared-wedding/bride.webp'),
    groom: { name: '김수락', image: asset('shared-wedding/groom.webp'), parentsText: '김부 · 이모 의 장남' },
    bride: { name: '이수락', image: asset('shared-wedding/bride.webp'), parentsText: '이부 · 박모 의 장녀' },
    accounts: [
      { role: '신랑', bank: '국민은행', number: '110-222-333444', holder: '김수락' },
      { role: '신부', bank: '신한은행', number: '110-555-666777', holder: '이수락' },
      { role: '신랑 혼주', bank: '우리은행', number: '1002-999-888777', holder: '김부' },
    ],
    accountEnabled: true,
    accountsTitle: '마음 전하실 곳',
    music: { enabled: true, musicKey: 'piano_soft', sourceType: 'SHARED', loop: false, title: 'Piano Soft' },
    transportInfo: ['2호선 선릉역 도보 5분'],
    parkingInfo: ['지하 2시간 무료'],
  };
}

export function buildRichGeneralData(id: VisualTemplateCaseId, title: string) {
  return {
    templateType: 'FULL' as const,
    conceptType: 'GENERAL' as const,
    visualTemplateId: id,
    title,
    subtitle: '일반 행사 부제',
    content: '일반 행사 안내입니다.',
    eventDate: '2026-11-08T18:00:00',
    locationText: '수락 컨퍼런스홀',
    venueName: '수락 컨퍼런스홀',
    venueDetail: 'B1 오디토리움',
    address: '서울특별시 마포구 양화로 45',
    formattedAddress: '서울특별시 마포구 양화로 45',
    detailAddress: 'B1 오디토리움',
    schedule: ['등록 17:30'],
    rsvpEnabled: true,
    guestbookEnabled: false,
    commentsEnabled: false,
    heroImage: asset(`${id}/hero.webp`),
    galleryImages: generalGallery(id),
    galleryDisplayMode: 'SLIDE' as const,
    heroTitle: title,
    heroSubtitle: '2026년 11월 8일',
    introQuote: '함께하는 기록',
    introText: ['일반 행사 안내입니다.'],
    weddingDateTime: '2026년 11월 8일 토요일 오후 6시',
    mapLat: 37.5563,
    mapLng: 126.922,
    mapProvider: 'NAVER' as const,
    accounts: [
      { role: '참가비', bank: '카카오뱅크', number: '3333-01-1234567', holder: '수락행사' },
      { role: '후원금', bank: '토스뱅크', number: '1000-2222-3333', holder: '수락행사' },
    ],
    accountEnabled: true,
    accountsTitle: '참가비 · 후원',
    music: { enabled: true, musicKey: 'piano_soft', sourceType: 'SHARED', loop: false, title: 'Piano Soft' },
    transportInfo: ['홍대입구역 2번 출구'],
    parkingInfo: ['건물 주차 유료'],
  };
}

export async function loginInBrowser(page: Page, email: string) {
  const res = await page.request.post(`${API}/api/test-login`, { data: { email } });
  expect(res.ok(), await res.text()).toBeTruthy();
  const cookies = await page.context().cookies(API);
  const auth = cookies.find((c) => c.name === 'auth_session_token');
  expect(auth).toBeTruthy();
  await page.context().clearCookies();
  await page.context().addCookies([
    {
      name: auth!.name,
      value: auth!.value,
      domain: auth!.domain,
      path: auth!.path || '/',
      expires: auth!.expires,
      httpOnly: true,
      secure: true,
      sameSite: 'None',
    },
  ]);
}

export async function createPublishInvitation(
  request: APIRequestContext,
  params: {
    conceptType: 'WEDDING' | 'GENERAL' | 'FUNERAL';
    visualTemplateId?: string;
    templateKey?: string;
    data?: Record<string, unknown>;
    title?: string;
  }
) {
  const create = await request.post(`${API}/api/invitations`, {
    data: {
      templateKey: params.templateKey || (params.conceptType === 'FUNERAL' ? 'funeral_classic' : 'invitation_full'),
      conceptType: params.conceptType,
      visualTemplateId: params.visualTemplateId,
    },
  });
  expect(create.ok(), await create.text()).toBeTruthy();
  const created = (await create.json()) as { id: string; slug?: string; shareSlug?: string };

  if (params.data) {
    const patch = await request.patch(`${API}/api/invitations/${created.id}`, {
      data: {
        title: params.title,
        data: params.data,
      },
    });
    expect(patch.ok(), await patch.text()).toBeTruthy();
  }

  const publish = await request.post(`${API}/api/invitations/${created.id}/publish`);
  expect(publish.ok(), await publish.text()).toBeTruthy();
  const published = (await publish.json()) as { shareSlug?: string; slug?: string };
  const shareSlug = published.shareSlug || created.shareSlug || created.slug;
  expect(shareSlug).toBeTruthy();
  return { id: created.id, shareSlug: shareSlug as string, slug: created.slug };
}

export async function assertNoBrokenImages(page: Page) {
  const broken = await page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => img.naturalWidth === 0 && img.src && !img.src.startsWith('data:'))
      .map((img) => img.src)
  );
  expect(broken, broken.join('\n')).toEqual([]);
}

export async function assertNoIsoOrFixtureLeak(page: Page) {
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
  expect(text).not.toContain('지수 · 민준');
  expect(text).not.toContain('창작의 리듬');
  expect(text).not.toMatch(/\bsample\.svg\b/i);
}

export function deepDiffKeys(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  allowed: string[] = ['visualTemplateId']
): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changed: string[] = [];
  for (const key of keys) {
    if (allowed.includes(key)) continue;
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changed.push(key);
    }
  }
  return changed.sort();
}

export function writeJsonArtifact(relPath: string, value: unknown) {
  const full = path.resolve(relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
