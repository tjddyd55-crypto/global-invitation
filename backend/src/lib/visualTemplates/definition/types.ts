/**
 * TemplateDefinition schema v1 — portable runtime schema (not React/JSX).
 */

export const TEMPLATE_DEFINITION_SCHEMA_VERSION = 1 as const;

export const GI_SECTIONS = [
  'HERO',
  'HOST_INFO',
  'EVENT_INFO',
  'MESSAGE',
  'GALLERY',
  'LOCATION',
  'ACCOUNT',
  'RSVP',
  'COMMENTS',
  'MUSIC',
  'FOOTER',
] as const;

export type GiSectionId = (typeof GI_SECTIONS)[number];

export const GI_FIELDS = [
  'EVENT_TITLE',
  'BRIDE_NAME',
  'GROOM_NAME',
  'HOST_NAME',
  'EVENT_DATE',
  'EVENT_TIME',
  'VENUE_NAME',
  'VENUE_ADDRESS',
  'MESSAGE_BODY',
] as const;

export type GiFieldId = (typeof GI_FIELDS)[number];

export const GI_COMPONENTS = [
  'MAP',
  'ACCOUNT',
  'RSVP',
  'COMMENTS',
  'MUSIC_PLAYER',
] as const;

export type GiComponentId = (typeof GI_COMPONENTS)[number];

export const GI_COPY_KEYS = [
  'LOCATION_TITLE',
  'RSVP_TITLE',
  'ACCOUNT_TITLE',
  'GALLERY_TITLE',
  'HOST_TITLE',
  'MESSAGE_TITLE',
  'FOOTER_NOTE',
] as const;

export type GiCopyId = (typeof GI_COPY_KEYS)[number];

export const GI_MEDIA = ['HERO_IMAGE', 'GALLERY_IMAGE'] as const;
export type GiMediaId = (typeof GI_MEDIA)[number];

/** Allowlisted style keys only — no arbitrary CSS strings. */
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

export type DefinitionNodeType =
  | 'CONTAINER'
  | 'TEXT'
  | 'FIELD'
  | 'IMAGE'
  | 'REPEAT'
  | 'COMPONENT'
  | 'DECORATION'
  | 'COPY';

export type DefinitionNode = {
  id: string;
  type: DefinitionNodeType;
  style?: DefinitionStyle;
  children?: DefinitionNode[];
  /** Static text for TEXT nodes */
  text?: string;
  binding?: GiFieldId;
  fallbackText?: string;
  media?: GiMediaId;
  /** R2 public URL for decorative assets */
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
  mobile: {
    width: number;
    sections: DefinitionSection[];
  };
  desktop?: {
    width: number;
    sections: DefinitionSection[];
  };
};

export const MAX_DEFINITION_DEPTH = 20;
export const MAX_DEFINITION_NODES = 1000;
export const MAX_DEFINITION_JSON_BYTES = 500_000;

export const WEDDING_POC_REQUIRED_SECTIONS: GiSectionId[] = [
  'HERO',
  'EVENT_INFO',
  'MESSAGE',
  'LOCATION',
  'RSVP',
];

export function isGiSectionId(value: string): value is GiSectionId {
  return (GI_SECTIONS as readonly string[]).includes(value);
}

export function isGiFieldId(value: string): value is GiFieldId {
  return (GI_FIELDS as readonly string[]).includes(value);
}

export function isGiComponentId(value: string): value is GiComponentId {
  return (GI_COMPONENTS as readonly string[]).includes(value);
}

export function isGiCopyId(value: string): value is GiCopyId {
  return (GI_COPY_KEYS as readonly string[]).includes(value);
}

export function isGiMediaId(value: string): value is GiMediaId {
  return (GI_MEDIA as readonly string[]).includes(value);
}
