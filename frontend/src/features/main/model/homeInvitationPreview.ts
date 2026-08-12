import type { InvitationConceptType } from '@/src/invitation/conceptTypes';
import type { FuneralInvitationData, InvitationRuntimeData, WeddingInvitationData } from '@/src/invitation/schemas';
import type { VisualTemplateId } from '@/src/templates/visualTemplate/ids';
import { getVisualTemplatePreviewFixture } from '@/src/templates/visualTemplate/previewFixtures';
import { getFuneralClassicDemoData } from '@/src/templates/funeralClassic/data';

export type HomeInvitationExampleId = 'wedding' | 'funeral' | 'general' | 'organization';

export type HomeInvitationExample = {
  id: HomeInvitationExampleId;
  concept: InvitationConceptType;
  label: string;
  caption: string;
  href: string;
  visualTemplateId?: VisualTemplateId;
};

export const HOME_PREVIEW_TEMPLATE_ID: VisualTemplateId = 'WEDDING_05_GARDEN';
export const HOME_PREVIEW_PATH = `/templates/${HOME_PREVIEW_TEMPLATE_ID}/preview`;

const GENERAL_PREVIEW_TEMPLATE_ID: VisualTemplateId = 'GENERAL_06_CULTURE';
const ORGANIZATION_PREVIEW_TEMPLATE_ID: VisualTemplateId = 'ORGANIZATION_02_JCI';

export const HOME_INVITATION_EXAMPLES: HomeInvitationExample[] = [
  {
    id: 'wedding',
    concept: 'WEDDING',
    label: '결혼식',
    caption: '감성적인 모바일 청첩장',
    href: HOME_PREVIEW_PATH,
    visualTemplateId: HOME_PREVIEW_TEMPLATE_ID,
  },
  {
    id: 'funeral',
    concept: 'FUNERAL',
    label: '부고',
    caption: '차분하고 정중한 부고장',
    href: '/create/concept',
  },
  {
    id: 'general',
    concept: 'GENERAL',
    label: '일반 행사',
    caption: '모임과 행사에 어울리는 안내형 초대장',
    href: `/templates/${GENERAL_PREVIEW_TEMPLATE_ID}/preview`,
    visualTemplateId: GENERAL_PREVIEW_TEMPLATE_ID,
  },
  {
    id: 'organization',
    concept: 'ORGANIZATION',
    label: '기업·단체 행사',
    caption: '협회·기관·공식 초청용 템플릿',
    href: `/templates/${ORGANIZATION_PREVIEW_TEMPLATE_ID}/preview`,
    visualTemplateId: ORGANIZATION_PREVIEW_TEMPLATE_ID,
  },
];

export function listHomeInvitationExamples(): HomeInvitationExample[] {
  return HOME_INVITATION_EXAMPLES;
}

export function getHomeInvitationExample(id: HomeInvitationExampleId): HomeInvitationExample {
  const match = HOME_INVITATION_EXAMPLES.find((item) => item.id === id);
  if (!match) return HOME_INVITATION_EXAMPLES[0];
  return match;
}

/** Hero still uses the wedding Garden sample. */
export function getHomeInvitationPreviewData(): WeddingInvitationData {
  return getHomeInvitationExampleData('wedding') as WeddingInvitationData;
}

export function getHomeInvitationExampleData(id: HomeInvitationExampleId): InvitationRuntimeData {
  if (id === 'funeral') return lightenFuneralFixture(getFuneralClassicDemoData());
  if (id === 'general') {
    return lightenVisualFixture(getVisualTemplatePreviewFixture(GENERAL_PREVIEW_TEMPLATE_ID));
  }
  if (id === 'organization') {
    return lightenVisualFixture(getVisualTemplatePreviewFixture(ORGANIZATION_PREVIEW_TEMPLATE_ID));
  }
  return lightenVisualFixture(getVisualTemplatePreviewFixture(HOME_PREVIEW_TEMPLATE_ID));
}

function lightenVisualFixture(fixture: WeddingInvitationData): WeddingInvitationData {
  return {
    ...fixture,
    galleryImages: [],
    mapLat: undefined,
    mapLng: undefined,
    mapProvider: undefined,
    googlePlaceId: undefined,
    address: '',
    formattedAddress: '',
    detailAddress: '',
    accounts: [],
    accountEnabled: false,
    music: { enabled: false },
    transportInfo: [],
    parkingInfo: [],
    guestbookEnabled: false,
    commentsEnabled: false,
  };
}

function lightenFuneralFixture(fixture: FuneralInvitationData): FuneralInvitationData {
  return {
    ...fixture,
    funeralHall: { name: fixture.funeralHall.name },
    heroImage: undefined,
  };
}
