import type { ComponentType } from 'react';
import type { VisualTemplateId, VisualTemplateConcept } from './ids';
import { listVisualTemplatesForConcept } from './ids';
import { templateThumbnailAsset } from './templateSampleAssets';

export type InvitationRenderMode = 'TEMPLATE_PREVIEW' | 'EDITOR_PREVIEW' | 'PUBLIC';

export type VisualTemplateDefinition = {
  id: VisualTemplateId;
  conceptType: VisualTemplateConcept;
  /** Customer-facing name — never show internal id / 01·04 numbers */
  name: string;
  description: string;
  styleTags: string[];
  /** R2 shared object key — `cdnImageSrc` 로 절대 URL 로 정규화해서 사용 */
  thumbnailAsset: string;
  sortOrder: number;
  isActive: boolean;
  version: number;
};

export type VisualTemplateRendererProps = {
  data: Record<string, unknown> & { conceptType?: string };
  invitationSlug?: string;
  showPlayButton?: boolean;
  previewMode?: boolean;
  renderMode?: InvitationRenderMode;
  showRsvp?: boolean;
  showGuestbook?: boolean;
  showComments?: boolean;
  onShare?: () => void;
  onKakaoShare?: () => void;
  isShared?: boolean;
};

export type VisualTemplateRenderer = ComponentType<VisualTemplateRendererProps>;

const DEFINITIONS: Record<VisualTemplateId, VisualTemplateDefinition> = {
  WEDDING_01_CLASSIC: {
    id: 'WEDDING_01_CLASSIC',
    conceptType: 'WEDDING',
    name: '클래식',
    description: '정석적인 웨딩 초대장 레이아웃으로 모든 정보를 차분하게 전달합니다',
    styleTags: ['클래식', '정갈함', '전통'],
    thumbnailAsset: templateThumbnailAsset('WEDDING_01_CLASSIC'),
    sortOrder: 10,
    isActive: true,
    version: 1,
  },
  WEDDING_04_EDITORIAL: {
    id: 'WEDDING_04_EDITORIAL',
    conceptType: 'WEDDING',
    name: '모던 에디토리얼',
    description: '웨딩 매거진처럼 세련되고 비대칭적인 디자인',
    styleTags: ['고급스러움', '사진중심', '매거진'],
    thumbnailAsset: templateThumbnailAsset('WEDDING_04_EDITORIAL'),
    sortOrder: 20,
    isActive: true,
    version: 1,
  },
  WEDDING_05_GARDEN: {
    id: 'WEDDING_05_GARDEN',
    conceptType: 'WEDDING',
    name: '로맨틱 가든',
    description: '부드러운 아치와 편지 형식의 따뜻한 정원 감성',
    styleTags: ['로맨틱', '자연', '따뜻한'],
    thumbnailAsset: templateThumbnailAsset('WEDDING_05_GARDEN'),
    sortOrder: 30,
    isActive: true,
    version: 1,
  },
  WEDDING_06_NIGHT: {
    id: 'WEDDING_06_NIGHT',
    conceptType: 'WEDDING',
    name: '미니멀 나이트',
    description: '어두운 시네마틱 히어로와 절제된 타이포그래피',
    styleTags: ['미니멀', '다크', '시네마틱'],
    thumbnailAsset: templateThumbnailAsset('WEDDING_06_NIGHT'),
    sortOrder: 40,
    isActive: true,
    version: 1,
  },
  GENERAL_01_CLASSIC: {
    id: 'GENERAL_01_CLASSIC',
    conceptType: 'GENERAL',
    name: '클래식',
    description: '일반 행사에 맞춘 기본 레이아웃으로 정보를 명확히 전달합니다',
    styleTags: ['클래식', '정보형', '담백함'],
    thumbnailAsset: templateThumbnailAsset('GENERAL_01_CLASSIC'),
    sortOrder: 10,
    isActive: true,
    version: 1,
  },
  GENERAL_04_CLEAN: {
    id: 'GENERAL_04_CLEAN',
    conceptType: 'GENERAL',
    name: '클린 이벤트',
    description: '제목과 일정 중심의 정돈된 브로슈어형 디자인',
    styleTags: ['클린', '모듈형', '정보중심'],
    thumbnailAsset: templateThumbnailAsset('GENERAL_04_CLEAN'),
    sortOrder: 20,
    isActive: true,
    version: 1,
  },
  GENERAL_05_FESTIVE: {
    id: 'GENERAL_05_FESTIVE',
    conceptType: 'GENERAL',
    name: '페스티브 컬러',
    description: '포스터형 히어로와 컬러 블록이 돋보이는 축제 감성',
    styleTags: ['컬러풀', '페스티벌', '포스터'],
    thumbnailAsset: templateThumbnailAsset('GENERAL_05_FESTIVE'),
    sortOrder: 30,
    isActive: true,
    version: 1,
  },
  GENERAL_06_CULTURE: {
    id: 'GENERAL_06_CULTURE',
    conceptType: 'GENERAL',
    name: '컬처 앤 엑시비션',
    description: '전시·공연에 어울리는 비대칭 포스터와 그리드 구성',
    styleTags: ['전시', '문화', '포스터'],
    thumbnailAsset: templateThumbnailAsset('GENERAL_06_CULTURE'),
    sortOrder: 40,
    isActive: true,
    version: 1,
  },
  ORGANIZATION_01_OFFICIAL: {
    id: 'ORGANIZATION_01_OFFICIAL',
    conceptType: 'ORGANIZATION',
    name: '공식',
    description: '기관·단체 행사에 맞는 공식적인 브랜드 헤더 레이아웃',
    styleTags: ['공식', '기관', '네이비'],
    thumbnailAsset: templateThumbnailAsset('ORGANIZATION_01_OFFICIAL'),
    sortOrder: 10,
    isActive: true,
    version: 1,
  },
  ORGANIZATION_02_JCI: {
    id: 'ORGANIZATION_02_JCI',
    conceptType: 'ORGANIZATION',
    name: 'JCI',
    description: 'JCI 행사와 공식 초청에 맞춘 브랜드 템플릿',
    styleTags: ['JCI', '공식행사', '기관초청'],
    thumbnailAsset: templateThumbnailAsset('ORGANIZATION_02_JCI'),
    sortOrder: 20,
    isActive: true,
    version: 1,
  },
};

export function getVisualTemplateDefinition(id: VisualTemplateId): VisualTemplateDefinition {
  return DEFINITIONS[id];
}

export function listActiveVisualTemplates(concept: VisualTemplateConcept): VisualTemplateDefinition[] {
  return listVisualTemplatesForConcept(concept)
    .map((id) => DEFINITIONS[id])
    .filter((def) => def.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getAllVisualTemplateDefinitions(): VisualTemplateDefinition[] {
  return Object.values(DEFINITIONS).sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}
