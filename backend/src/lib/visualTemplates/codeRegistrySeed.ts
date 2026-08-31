/**
 * CODE visual template registry seed for catalog bootstrap.
 * Keep in sync with frontend/src/templates/visualTemplate/{ids,visualTemplateRegistry,templateSampleAssets}.ts
 */
export type CodeVisualTemplateSeed = {
  templateKey: string;
  concept: 'WEDDING' | 'GENERAL' | 'ORGANIZATION';
  displayNameKo: string;
  displayNameEn: string;
  descriptionKo: string;
  descriptionEn: string;
  sortOrder: number;
  /** R2 object key (not absolute URL) */
  thumbnailObjectKey: string;
};

const PREFIX = 'invitation/shared/images/templates';

function thumb(key: string): string {
  return `${PREFIX}/${key}/thumbnail.webp`;
}

export const CODE_VISUAL_TEMPLATE_SEEDS: CodeVisualTemplateSeed[] = [
  {
    templateKey: 'WEDDING_01_CLASSIC',
    concept: 'WEDDING',
    displayNameKo: '클래식',
    displayNameEn: 'Classic',
    descriptionKo: '정석적인 웨딩 초대장 레이아웃으로 모든 정보를 차분하게 전달합니다',
    descriptionEn: 'A timeless wedding layout that presents every detail with calm clarity',
    sortOrder: 10,
    thumbnailObjectKey: thumb('WEDDING_01_CLASSIC'),
  },
  {
    templateKey: 'WEDDING_04_EDITORIAL',
    concept: 'WEDDING',
    displayNameKo: '모던 에디토리얼',
    displayNameEn: 'Modern Editorial',
    descriptionKo: '웨딩 매거진처럼 세련되고 비대칭적인 디자인',
    descriptionEn: 'Magazine-inspired asymmetric editorial design',
    sortOrder: 20,
    thumbnailObjectKey: thumb('WEDDING_04_EDITORIAL'),
  },
  {
    templateKey: 'WEDDING_05_GARDEN',
    concept: 'WEDDING',
    displayNameKo: '로맨틱 가든',
    displayNameEn: 'Romantic Garden',
    descriptionKo: '부드러운 아치와 편지 형식의 따뜻한 정원 감성',
    descriptionEn: 'Soft arches and letter-like warmth of a garden wedding',
    sortOrder: 30,
    thumbnailObjectKey: thumb('WEDDING_05_GARDEN'),
  },
  {
    templateKey: 'WEDDING_06_NIGHT',
    concept: 'WEDDING',
    displayNameKo: '미니멀 나이트',
    displayNameEn: 'Minimal Night',
    descriptionKo: '어두운 시네마틱 히어로와 절제된 타이포그래피',
    descriptionEn: 'Cinematic dark hero with restrained typography',
    sortOrder: 40,
    thumbnailObjectKey: thumb('WEDDING_06_NIGHT'),
  },
  {
    templateKey: 'GENERAL_01_CLASSIC',
    concept: 'GENERAL',
    displayNameKo: '클래식',
    displayNameEn: 'Classic',
    descriptionKo: '일반 행사에 맞춘 기본 레이아웃으로 정보를 명확히 전달합니다',
    descriptionEn: 'Clear classic layout for general events',
    sortOrder: 10,
    thumbnailObjectKey: thumb('GENERAL_01_CLASSIC'),
  },
  {
    templateKey: 'GENERAL_04_CLEAN',
    concept: 'GENERAL',
    displayNameKo: '클린 이벤트',
    displayNameEn: 'Clean Event',
    descriptionKo: '제목과 일정 중심의 정돈된 브로슈어형 디자인',
    descriptionEn: 'Brochure-style focus on title and schedule',
    sortOrder: 20,
    thumbnailObjectKey: thumb('GENERAL_04_CLEAN'),
  },
  {
    templateKey: 'GENERAL_05_FESTIVE',
    concept: 'GENERAL',
    displayNameKo: '페스티브 컬러',
    displayNameEn: 'Festive Color',
    descriptionKo: '포스터형 히어로와 컬러 블록이 돋보이는 축제 감성',
    descriptionEn: 'Poster hero and colorful festive blocks',
    sortOrder: 30,
    thumbnailObjectKey: thumb('GENERAL_05_FESTIVE'),
  },
  {
    templateKey: 'GENERAL_06_CULTURE',
    concept: 'GENERAL',
    displayNameKo: '컬처 앤 엑시비션',
    displayNameEn: 'Culture & Exhibition',
    descriptionKo: '전시·공연에 어울리는 비대칭 포스터와 그리드 구성',
    descriptionEn: 'Asymmetric poster grid for culture and exhibitions',
    sortOrder: 40,
    thumbnailObjectKey: thumb('GENERAL_06_CULTURE'),
  },
  {
    templateKey: 'ORGANIZATION_01_OFFICIAL',
    concept: 'ORGANIZATION',
    displayNameKo: '공식',
    displayNameEn: 'Official',
    descriptionKo: '기관·단체 행사에 맞는 공식적인 브랜드 헤더 레이아웃',
    descriptionEn: 'Formal brand header layout for organizations',
    sortOrder: 10,
    // Alias to GENERAL_01 thumbnail (matches frontend templateSampleAssets)
    thumbnailObjectKey: thumb('GENERAL_01_CLASSIC'),
  },
  {
    templateKey: 'ORGANIZATION_02_JCI',
    concept: 'ORGANIZATION',
    displayNameKo: 'JCI',
    displayNameEn: 'JCI',
    descriptionKo: 'JCI 행사와 공식 초청에 맞춘 브랜드 템플릿',
    descriptionEn: 'Brand template for JCI events and formal invitations',
    sortOrder: 20,
    thumbnailObjectKey: thumb('ORGANIZATION_02_JCI'),
  },
];

export function listCodeRegistryKeys(): string[] {
  return CODE_VISUAL_TEMPLATE_SEEDS.map((s) => s.templateKey);
}

export function isCodeRegistryKey(key: string): boolean {
  return CODE_VISUAL_TEMPLATE_SEEDS.some((s) => s.templateKey === key);
}
