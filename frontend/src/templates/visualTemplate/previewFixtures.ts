/**
 * Template Preview 샘플 데이터 (DB write 없음).
 *
 * 고객이 "완성본"을 판단할 수 있도록 실제 초대장처럼 채운다.
 * - 개발용 sample/test/placeholder 문구 금지
 * - 날짜는 renderer 에서 scheduleDisplay SSOT 로 포맷하므로 여기서는 ISO 원본만 보관
 * - 이미지는 R2 shared 카탈로그 key (templateSampleAssets)
 */
import { getInvitationScheduleDisplay } from '@/src/invitation/scheduleDisplay';
import type { WeddingInvitationData } from '@/src/invitation/schemas';
import type { VisualTemplateId } from './ids';
import { VISUAL_TEMPLATE_CONCEPT } from './ids';
import {
  buildSampleGallery,
  ORGANIZATION_SAMPLE_LOGO,
  templateHeroAsset,
  WEDDING_BRIDE_PROFILE,
  WEDDING_GROOM_PROFILE,
} from './templateSampleAssets';
import { ORGANIZATION_SAMPLE_MUSIC } from './organizationSharedMusicSample';
import { getPreviewFixtureGalleryMode } from '@/src/templates/visualGallery/resolveVisualGalleryPresentation';
import { DEFAULT_BRAND_ACCENT_COLOR } from '@/src/invitation/conceptTypes';

/** Classic renderer 는 `weddingDateTime` 문자열을 그대로 출력하므로 사람이 읽는 값으로 채운다. */
function readableDateTime(isoDate: string): string {
  return getInvitationScheduleDisplay({ eventDate: isoDate })?.full ?? '';
}

const WEDDING_SIBLINGS: Record<string, VisualTemplateId[]> = {
  WEDDING_01_CLASSIC: ['WEDDING_05_GARDEN', 'WEDDING_04_EDITORIAL'],
  WEDDING_04_EDITORIAL: ['WEDDING_05_GARDEN', 'WEDDING_06_NIGHT'],
  WEDDING_05_GARDEN: ['WEDDING_04_EDITORIAL', 'WEDDING_06_NIGHT'],
  WEDDING_06_NIGHT: ['WEDDING_04_EDITORIAL', 'WEDDING_05_GARDEN'],
};

const GENERAL_SIBLINGS: Record<string, VisualTemplateId[]> = {
  GENERAL_01_CLASSIC: ['GENERAL_04_CLEAN', 'GENERAL_06_CULTURE'],
  GENERAL_04_CLEAN: ['GENERAL_06_CULTURE', 'GENERAL_01_CLASSIC'],
  GENERAL_05_FESTIVE: ['GENERAL_01_CLASSIC', 'GENERAL_04_CLEAN'],
  GENERAL_06_CULTURE: ['GENERAL_04_CLEAN', 'GENERAL_01_CLASSIC'],
};

/** ORGANIZATION — sibling hero 없음 (GENERAL photo pack 재사용) */
const ORGANIZATION_SIBLINGS: Record<string, VisualTemplateId[]> = {
  ORGANIZATION_01_OFFICIAL: [],
  ORGANIZATION_02_JCI: [],
};

/** 웨딩은 템플릿마다 같은 예식을 다른 분위기로 보여준다 — 비교가 쉬워진다. */
const WEDDING_EVENT = {
  groomName: '김민준',
  brideName: '박지수',
  eventDate: '2026-10-17T14:00:00',
  venueName: '라움 아트센터',
  venueDetail: '2F 메리홀',
  address: '서울 강남구 언주로 564',
  mapLat: 37.5085,
  mapLng: 127.0364,
};

type GeneralEvent = {
  title: string;
  subtitle: string;
  greeting: string[];
  eventDate: string;
  scheduleLine: string;
  venueName: string;
  venueDetail: string;
  address: string;
  mapLat: number;
  mapLng: number;
  accountsTitle: string;
  accounts: Array<{ role: string; bank: string; number: string; holder: string }>;
  transportInfo: string[];
  parkingInfo: string[];
};

const GENERAL_EVENTS: Record<string, GeneralEvent> = {
  GENERAL_01_CLASSIC: {
    title: '무무 창립 10주년 기념의 밤',
    subtitle: '10년의 기록을 함께 걸어온 분들과 나눕니다',
    greeting: [
      '작은 작업실에서 시작한 열 번째 해를 맞았습니다.',
      '그동안 함께해 주신 분들을 모시고',
      '조용한 저녁 자리를 마련했습니다.',
    ],
    eventDate: '2026-11-14T18:30:00',
    scheduleLine: '18:30 리셉션 · 19:30 기념 순서 · 21:00 마무리',
    venueName: '한남 살롱드무무',
    venueDetail: 'B1 라운지',
    address: '서울 용산구 이태원로 245',
    mapLat: 37.5384,
    mapLng: 127.0018,
    accountsTitle: '참가비 안내',
    accounts: [
      { role: '참가비', bank: '카카오뱅크', number: '3333-01-1234567', holder: '스튜디오 무무' },
    ],
    transportInfo: ['6호선 한강진역 3번 출구 도보 6분'],
    parkingInfo: ['건물 지하 주차장 2시간 무료'],
  },
  GENERAL_04_CLEAN: {
    title: '2026 브랜드 디자인 컨퍼런스',
    subtitle: '작게 시작해 오래 남는 브랜드를 만드는 법',
    greeting: [
      '한 해 동안 쌓인 실무 사례를 여섯 명의 연사가 나눕니다.',
      '발표 이후에는 자유로운 질의응답과 네트워킹이 이어집니다.',
      '자리가 넉넉하지 않아 사전 신청을 부탁드립니다.',
    ],
    eventDate: '2026-09-12T13:00:00',
    scheduleLine: '13:00 등록 · 13:30 세션 시작 · 18:00 네트워킹',
    venueName: '성수 웍스룸',
    venueDetail: '3F 콘퍼런스홀',
    address: '서울 성동구 아차산로 100',
    mapLat: 37.5445,
    mapLng: 127.0557,
    accountsTitle: '참가비 · 입금 계좌',
    accounts: [
      { role: '일반 참가비', bank: '국민은행', number: '123456-78-901234', holder: '웍스룸' },
      { role: '학생 참가비', bank: '국민은행', number: '123456-78-901235', holder: '웍스룸' },
    ],
    transportInfo: ['2호선 성수역 3번 출구 도보 7분', '셔틀버스 12:30 뚝섬역 출발'],
    parkingInfo: ['건물 주차 공간이 협소하니 대중교통을 권장합니다'],
  },
  GENERAL_05_FESTIVE: {
    title: '무무 마켓 나이트',
    subtitle: '한 해를 마무리하는 작은 축제에 초대합니다',
    greeting: [
      '올해 함께 작업한 열두 팀의 물건과 음악을 한자리에 모았습니다.',
      '먹고 마시고 고르는 저녁, 가볍게 들러 주세요.',
      '입장은 자유이며 마켓은 저녁 아홉 시까지 이어집니다.',
    ],
    eventDate: '2026-12-05T17:00:00',
    scheduleLine: '17:00 개장 · 19:00 라이브 공연 · 21:00 폐장',
    venueName: '연남 창고 27',
    venueDetail: '야외 마당 & 실내 홀',
    address: '서울 마포구 성미산로 27',
    mapLat: 37.5626,
    mapLng: 126.9256,
    accountsTitle: '참가비 · 후원',
    accounts: [
      { role: '사전 예매', bank: '카카오뱅크', number: '3333-02-7654321', holder: '무무 마켓' },
      { role: '후원 계좌', bank: '신한은행', number: '110-234-567890', holder: '무무 마켓' },
    ],
    transportInfo: ['경의중앙선 가좌역 1번 출구 도보 10분'],
    parkingInfo: ['인근 공영주차장을 이용해 주세요'],
  },
  GENERAL_06_CULTURE: {
    title: '겹쳐진 시간',
    subtitle: '김서연 개인전 · 2026 가을',
    greeting: [
      '지난 3년간의 회화 작업 24점을 처음으로 함께 보입니다.',
      '색이 쌓이며 남긴 시간의 흔적을 따라 걸어 보시길 바랍니다.',
      '오프닝 당일에는 작가와의 대화가 준비되어 있습니다.',
    ],
    eventDate: '2026-10-02T17:00:00',
    scheduleLine: '10.02 — 10.26 · 화–일 11:00 — 19:00 (월 휴관)',
    venueName: '아뜰리에 하루',
    venueDetail: '2F 전시실',
    address: '서울 종로구 삼청로 75',
    mapLat: 37.5826,
    mapLng: 126.9816,
    accountsTitle: '관람료 · 후원',
    accounts: [
      { role: '관람료', bank: '하나은행', number: '111-222333-44444', holder: '아뜰리에 하루' },
      { role: '작가 후원', bank: '토스뱅크', number: '1000-1234-5678', holder: '김서연' },
    ],
    transportInfo: ['3호선 안국역 1번 출구 도보 12분', '종로 02번 마을버스 정독도서관 하차'],
    parkingInfo: ['전용 주차장이 없어 인근 공영주차장을 이용해 주세요'],
  },
};

function weddingFixture(visualTemplateId: VisualTemplateId): WeddingInvitationData {
  const gallery = buildSampleGallery(
    visualTemplateId,
    WEDDING_SIBLINGS[visualTemplateId] ?? []
  );
  const coupleNames = `${WEDDING_EVENT.groomName} · ${WEDDING_EVENT.brideName}`;
  const greeting = [
    '서로 다른 계절을 지나온 두 사람이',
    '이제 같은 방향으로 걸어가려 합니다.',
    '귀한 걸음으로 축복해 주시면 감사하겠습니다.',
  ];

  return {
    templateType: 'FULL',
    conceptType: 'WEDDING',
    visualTemplateId,
    title: coupleNames,
    subtitle: '서로의 오늘이 만나 하나의 계절이 됩니다',
    content: greeting.join('\n'),
    eventDate: WEDDING_EVENT.eventDate,
    locationText: WEDDING_EVENT.venueName,
    venueDetail: WEDDING_EVENT.venueDetail,
    venueName: WEDDING_EVENT.venueName,
    schedule: ['예식 후 같은 층 연회장에서 식사가 준비됩니다'],
    rsvpEnabled: true,
    guestbookEnabled: true,
    commentsEnabled: true,
    heroImage: templateHeroAsset(visualTemplateId),
    galleryImages: gallery,
    galleryDisplayMode: getPreviewFixtureGalleryMode(visualTemplateId),
    heroTitle: coupleNames,
    heroSubtitle: readableDateTime(WEDDING_EVENT.eventDate),
    coupleNames,
    introQuote: '서로의 오늘이 만나 하나의 계절이 됩니다',
    introText: greeting,
    weddingDate: new Date(WEDDING_EVENT.eventDate),
    weddingDateTime: readableDateTime(WEDDING_EVENT.eventDate),
    address: WEDDING_EVENT.address,
    formattedAddress: WEDDING_EVENT.address,
    detailAddress: `${WEDDING_EVENT.address} ${WEDDING_EVENT.venueDetail}`,
    mapLat: WEDDING_EVENT.mapLat,
    mapLng: WEDDING_EVENT.mapLng,
    mapProvider: 'GOOGLE',
    groomName: WEDDING_EVENT.groomName,
    brideName: WEDDING_EVENT.brideName,
    groomImage: WEDDING_GROOM_PROFILE,
    brideImage: WEDDING_BRIDE_PROFILE,
    groomPhone: '010-2345-6789',
    bridePhone: '010-3456-7890',
    parentsInfo: '',
    groom: {
      name: WEDDING_EVENT.groomName,
      image: WEDDING_GROOM_PROFILE,
      phone: '010-2345-6789',
      parentsText: '김도현 · 이수경 의 장남',
    },
    bride: {
      name: WEDDING_EVENT.brideName,
      image: WEDDING_BRIDE_PROFILE,
      phone: '010-3456-7890',
      parentsText: '박정우 · 최은영 의 차녀',
    },
    accounts: [
      { role: '신랑', bank: '국민은행', number: '294801-04-123456', holder: '김민준' },
      { role: '신부', bank: '신한은행', number: '110-234-567890', holder: '박지수' },
      { role: '신랑 혼주', bank: '우리은행', number: '1002-123-456789', holder: '김도현' },
      { role: '신부 혼주', bank: '농협은행', number: '302-1234-5678-91', holder: '박정우' },
    ],
    accountEnabled: true,
    accountsTitle: '마음 전하실 곳',
    music: { enabled: true, sourceType: 'SHARED', loop: true },
    transportInfo: ['2호선 선릉역 3번 출구 도보 5분', '강남역에서 택시 10분'],
    parkingInfo: ['건물 지하 주차장 2시간 무료', '만차 시 인근 공영주차장 안내'],
  };
}

function generalFixture(visualTemplateId: VisualTemplateId): WeddingInvitationData {
  const event = GENERAL_EVENTS[visualTemplateId] ?? GENERAL_EVENTS.GENERAL_04_CLEAN;
  const gallery = buildSampleGallery(visualTemplateId, GENERAL_SIBLINGS[visualTemplateId] ?? []);

  return {
    templateType: 'FULL',
    conceptType: 'GENERAL',
    visualTemplateId,
    title: event.title,
    subtitle: event.subtitle,
    content: event.greeting.join('\n'),
    eventDate: event.eventDate,
    locationText: event.venueName,
    venueDetail: event.venueDetail,
    venueName: event.venueName,
    schedule: [event.scheduleLine],
    rsvpEnabled: true,
    guestbookEnabled: true,
    commentsEnabled: true,
    heroImage: templateHeroAsset(visualTemplateId),
    galleryImages: gallery,
    galleryDisplayMode: getPreviewFixtureGalleryMode(visualTemplateId),
    heroTitle: event.title,
    heroSubtitle: event.subtitle,
    coupleNames: '',
    introQuote: event.subtitle,
    introText: event.greeting,
    weddingDate: new Date(event.eventDate),
    weddingDateTime: readableDateTime(event.eventDate),
    address: event.address,
    formattedAddress: event.address,
    detailAddress: `${event.address} ${event.venueDetail}`,
    mapLat: event.mapLat,
    mapLng: event.mapLng,
    mapProvider: 'GOOGLE',
    groomName: '',
    brideName: '',
    accounts: event.accounts,
    accountEnabled: true,
    accountsTitle: event.accountsTitle,
    music: { enabled: true, sourceType: 'SHARED', loop: true },
    transportInfo: event.transportInfo,
    parkingInfo: event.parkingInfo,
  };
}

const ORGANIZATION_EVENT = {
  title: '2026 회장단 이·취임식',
  subtitle: '새로운 리더십, 더 나은 지역사회를 향한 출발',
  greeting: [
    '새로운 리더십의 출발과 지역사회의 더 나은 변화를 함께하는 뜻깊은 자리에 귀하를 정중히 초대합니다.',
  ],
  eventDate: '2026-12-18T18:30:00',
  scheduleLine: '18:00 등록 및 리셉션 · 18:30 개회 및 이·취임식 · 19:30 네트워킹 디너',
  venueName: '시그니엘 부산 그랜드볼룸',
  venueDetail: '',
  address: '부산광역시 해운대구 중동 해운대로 265',
  mapLat: 35.1595,
  mapLng: 129.1604,
  accountsTitle: '참가비 안내',
  accounts: [
    { role: '참가비', bank: '국민은행', number: '000-0000-0000', holder: '서울광진청년회의소' },
  ],
  transportInfo: ['부산도시철도 2호선 해운대역 도보 이용'],
  parkingInfo: ['호텔 주차 안내 데스크에 문의해 주세요'],
  organization: {
    name: '서울광진청년회의소',
    englishName: 'JCI Seoul Gwangjin',
    englishFullName: 'Junior Chamber International Seoul Gwangjin',
    logo: ORGANIZATION_SAMPLE_LOGO,
    accentColor: DEFAULT_BRAND_ACCENT_COLOR,
  },
};

function organizationFixture(visualTemplateId: VisualTemplateId): WeddingInvitationData {
  const event = ORGANIZATION_EVENT;
  const gallery = buildSampleGallery(
    visualTemplateId,
    ORGANIZATION_SIBLINGS[visualTemplateId] ?? []
  );
  const isJciTemplate = visualTemplateId === 'ORGANIZATION_02_JCI';
  const accentColor = isJciTemplate ? '#0097D7' : DEFAULT_BRAND_ACCENT_COLOR;

  return {
    templateType: 'FULL',
    conceptType: 'ORGANIZATION',
    visualTemplateId,
    title: event.title,
    subtitle: event.subtitle,
    content: event.greeting.join('\n'),
    eventDate: event.eventDate,
    locationText: event.venueName,
    venueDetail: event.venueDetail,
    venueName: event.venueName,
    schedule: [event.scheduleLine],
    rsvpEnabled: true,
    guestbookEnabled: true,
    commentsEnabled: true,
    heroImage: templateHeroAsset(visualTemplateId),
    galleryImages: gallery,
    galleryDisplayMode: getPreviewFixtureGalleryMode(visualTemplateId),
    heroTitle: event.title,
    heroSubtitle: event.subtitle,
    coupleNames: '',
    introQuote: event.subtitle,
    introText: event.greeting,
    weddingDate: new Date(event.eventDate),
    weddingDateTime: readableDateTime(event.eventDate),
    address: event.address,
    formattedAddress: event.address,
    detailAddress: `${event.address} ${event.venueDetail}`,
    mapLat: event.mapLat,
    mapLng: event.mapLng,
    mapProvider: 'GOOGLE',
    groomName: '',
    brideName: '',
    accounts: event.accounts,
    accountEnabled: true,
    accountsTitle: event.accountsTitle,
    organization: {
      ...event.organization,
      accentColor,
      // Preview fixture only — never copied into create draft
      presetId: isJciTemplate ? 'JCI' : 'CUSTOM',
    },
    // Preview 전용 샘플 BGM — create draft 경로(useCreateInvitation)는 fixture 를 저장하지 않음.
    music: {
      enabled: true,
      sourceType: 'SHARED',
      loop: true,
      trackId: ORGANIZATION_SAMPLE_MUSIC.trackId,
      musicKey: ORGANIZATION_SAMPLE_MUSIC.trackId,
      // object key — resolvePlayableInvitationMusic 이 CDN 으로 정규화
      fileUrl: ORGANIZATION_SAMPLE_MUSIC.objectKey,
      title: ORGANIZATION_SAMPLE_MUSIC.title,
    },
    transportInfo: event.transportInfo,
    parkingInfo: event.parkingInfo,
  };
}

export function getVisualTemplatePreviewFixture(id: VisualTemplateId): WeddingInvitationData {
  const concept = VISUAL_TEMPLATE_CONCEPT[id];
  if (concept === 'WEDDING') return weddingFixture(id);
  if (concept === 'ORGANIZATION') return organizationFixture(id);
  return generalFixture(id);
}
