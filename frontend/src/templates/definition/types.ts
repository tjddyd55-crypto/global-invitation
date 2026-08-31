/**
 * Shared TemplateDefinition types for frontend DefinitionTemplateRenderer.
 * Keep in sync with backend/src/lib/visualTemplates/definition/types.ts
 */

export const TEMPLATE_DEFINITION_SCHEMA_VERSION = 1 as const;

export type GiFieldId =
  | 'EVENT_TITLE'
  | 'BRIDE_NAME'
  | 'GROOM_NAME'
  | 'HOST_NAME'
  | 'EVENT_DATE'
  | 'EVENT_TIME'
  | 'VENUE_NAME'
  | 'VENUE_ADDRESS'
  | 'MESSAGE_BODY';

export type GiComponentId = 'MAP' | 'ACCOUNT' | 'RSVP' | 'COMMENTS' | 'MUSIC_PLAYER';
export type GiCopyId =
  | 'LOCATION_TITLE'
  | 'RSVP_TITLE'
  | 'ACCOUNT_TITLE'
  | 'GALLERY_TITLE'
  | 'HOST_TITLE'
  | 'MESSAGE_TITLE'
  | 'FOOTER_NOTE';
export type GiMediaId = 'HERO_IMAGE' | 'GALLERY_IMAGE';
export type GiSectionId =
  | 'HERO'
  | 'HOST_INFO'
  | 'EVENT_INFO'
  | 'MESSAGE'
  | 'GALLERY'
  | 'LOCATION'
  | 'ACCOUNT'
  | 'RSVP'
  | 'COMMENTS'
  | 'MUSIC'
  | 'FOOTER';

export type DefinitionStyle = {
  display?: 'flex' | 'block' | 'none';
  flexDirection?: 'row' | 'column';
  gap?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  textAlign?: 'left' | 'center' | 'right';
  fontSize?: number;
  fontWeight?: number | string;
  lineHeight?: number | string;
  letterSpacing?: number;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  opacity?: number;
  width?: number | string;
  maxWidth?: number | string;
  minHeight?: number;
  objectFit?: 'cover' | 'contain' | 'fill';
};

export type DefinitionNode = {
  id: string;
  type: 'CONTAINER' | 'TEXT' | 'FIELD' | 'IMAGE' | 'REPEAT' | 'COMPONENT' | 'DECORATION' | 'COPY';
  style?: DefinitionStyle;
  children?: DefinitionNode[];
  text?: string;
  binding?: GiFieldId;
  fallbackText?: string;
  media?: GiMediaId;
  assetUrl?: string;
  alt?: string;
  component?: GiComponentId;
  copyKey?: GiCopyId;
  repeatOf?: 'GALLERY';
};

export type DefinitionSection = {
  id: GiSectionId;
  style?: DefinitionStyle;
  nodes: DefinitionNode[];
};

export type TemplateDefinition = {
  schemaVersion: typeof TEMPLATE_DEFINITION_SCHEMA_VERSION;
  templateKey: string;
  concept: 'WEDDING' | 'FUNERAL' | 'GENERAL' | 'ORGANIZATION';
  source: {
    type: 'FIGMA' | 'FIXTURE';
    fileKey?: string;
    nodeId?: string;
    url?: string;
    sourceHash?: string;
  };
  tokens?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  mobile: { width: number; sections: DefinitionSection[] };
  desktop?: { width: number; sections: DefinitionSection[] };
};

export const COPY_FALLBACKS: Record<GiCopyId, { ko: string; en: string }> = {
  LOCATION_TITLE: { ko: '오시는 길', en: 'Location' },
  RSVP_TITLE: { ko: '참석 여부', en: 'RSVP' },
  ACCOUNT_TITLE: { ko: '마음 전하실 곳', en: 'Gift accounts' },
  GALLERY_TITLE: { ko: '갤러리', en: 'Gallery' },
  HOST_TITLE: { ko: '모시는 글', en: 'Hosts' },
  MESSAGE_TITLE: { ko: '초대 인사', en: 'Invitation' },
  FOOTER_NOTE: { ko: '소중한 날에 함께해 주세요', en: 'We look forward to celebrating with you' },
};
