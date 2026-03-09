type JsonRecord = Record<string, unknown>;

export type CreatorTemplateCategory =
  | 'wedding'
  | 'funeral'
  | 'message'
  | 'simple_notice'
  | 'event'
  | 'business';

type ActiveCreatorCategory = 'wedding' | 'funeral' | 'message';
type CreatorSpacingScale = 'compact' | 'normal' | 'wide';
type CreatorFontFamily = 'Playfair Display' | 'Noto Sans' | 'Noto Serif' | 'Montserrat' | 'Inter';

export const ACTIVE_CREATOR_CATEGORIES: CreatorTemplateCategory[] = ['wedding', 'funeral', 'message'];
export const PLANNED_CREATOR_CATEGORIES: CreatorTemplateCategory[] = ['simple_notice', 'event', 'business'];

const ACTIVE_CATEGORY_SET = new Set<CreatorTemplateCategory>(ACTIVE_CREATOR_CATEGORIES);
const CATEGORY_SET = new Set<CreatorTemplateCategory>([
  ...ACTIVE_CREATOR_CATEGORIES,
  ...PLANNED_CREATOR_CATEGORIES,
]);

const SECTION_CONTRACT: Record<ActiveCreatorCategory, string[]> = {
  wedding: [
    'hero',
    'basicInfo',
    'invitationMessage',
    'couple',
    'gallery',
    'location',
    'accounts',
    'messages',
    'rsvp',
    'share',
  ],
  funeral: ['hero', 'deceasedInfo', 'schedule', 'location', 'messages', 'share'],
  message: ['hero', 'message', 'image', 'sender', 'share'],
};

const ALLOWED_THEME_KEYS = new Set([
  'primaryColor',
  'backgroundColor',
  'textColor',
  'fontFamily',
  'spacingScale',
]);
const ALLOWED_FONT_FAMILIES = new Set<CreatorFontFamily>([
  'Playfair Display',
  'Noto Sans',
  'Noto Serif',
  'Montserrat',
  'Inter',
]);
const ALLOWED_SPACING_SCALES = new Set<CreatorSpacingScale>(['compact', 'normal', 'wide']);
const ALLOWED_TOP_LEVEL_KEYS = new Set(['category', 'theme', 'sections', 'sectionOrder', 'blockOrder']);

const BASE_SECTION_KEYS = new Set([
  'enabled',
  'layout',
  'textAlign',
  'backgroundStyle',
  'cardStyle',
  'spacing',
]);
const GALLERY_SECTION_KEYS = new Set(['enabled', 'layout', 'columns', 'imageStyle', 'textAlign', 'backgroundStyle']);
const LOCATION_SECTION_KEYS = new Set([
  'enabled',
  'layout',
  'textAlign',
  'backgroundStyle',
  'mapStyle',
  'showTransport',
  'showParking',
]);

const ALLOWED_LAYOUT_VALUES = new Set(['center', 'left', 'right', 'split', 'full']);
const ALLOWED_TEXT_ALIGN_VALUES = new Set(['left', 'center', 'right']);
const ALLOWED_BACKGROUND_STYLE_VALUES = new Set(['image', 'color', 'gradient']);
const ALLOWED_CARD_STYLE_VALUES = new Set(['none', 'soft', 'outline', 'elevated']);
const ALLOWED_GALLERY_LAYOUT_VALUES = new Set(['grid', 'masonry', 'carousel']);
const ALLOWED_GALLERY_COLUMNS = new Set([2, 3, 4]);
const ALLOWED_GALLERY_IMAGE_STYLE = new Set(['square', 'rounded', 'circle']);
const ALLOWED_MAP_STYLE_VALUES = new Set(['card', 'full', 'compact']);

type StudioSectionConfig = {
  enabled: boolean;
  layout: string;
  textAlign: string;
  backgroundStyle: string;
  cardStyle?: string;
  spacing?: CreatorSpacingScale;
  columns?: 2 | 3 | 4;
  imageStyle?: string;
  mapStyle?: string;
  showTransport?: boolean;
  showParking?: boolean;
};

type StudioConfigNormalized = {
  category: ActiveCreatorCategory;
  theme: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: CreatorFontFamily;
    spacingScale: CreatorSpacingScale;
  };
  sections: Record<string, StudioSectionConfig>;
  sectionOrder: string[];
};

export type StudioValidationResult =
  | {
      ok: true;
      normalized: StudioConfigNormalized;
    }
  | {
      ok: false;
      errors: string[];
    };

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeColor(value: unknown, fallback: string): string {
  const text = normalizeText(value);
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(text)) return text;
  return fallback;
}

function normalizeSectionConfig(
  sectionName: string,
  value: unknown,
  errors: string[]
): StudioSectionConfig {
  if (!isRecord(value)) {
    errors.push(`sections.${sectionName} must be an object`);
    return {
      enabled: true,
      layout: 'center',
      textAlign: 'center',
      backgroundStyle: 'color',
    };
  }

  const allowedKeys =
    sectionName === 'gallery'
      ? GALLERY_SECTION_KEYS
      : sectionName === 'location'
        ? LOCATION_SECTION_KEYS
        : BASE_SECTION_KEYS;

  Object.keys(value).forEach((key) => {
    if (!allowedKeys.has(key)) {
      errors.push(`sections.${sectionName}.${key} is not allowed`);
    }
  });

  const layout = normalizeText(value.layout) || (sectionName === 'gallery' ? 'grid' : 'center');
  const textAlign = normalizeText(value.textAlign) || 'center';
  const backgroundStyle = normalizeText(value.backgroundStyle) || 'color';

  if (sectionName === 'gallery') {
    if (!ALLOWED_GALLERY_LAYOUT_VALUES.has(layout)) {
      errors.push(`sections.${sectionName}.layout is invalid`);
    }
  } else if (!ALLOWED_LAYOUT_VALUES.has(layout)) {
    errors.push(`sections.${sectionName}.layout is invalid`);
  }

  if (!ALLOWED_TEXT_ALIGN_VALUES.has(textAlign)) {
    errors.push(`sections.${sectionName}.textAlign is invalid`);
  }
  if (!ALLOWED_BACKGROUND_STYLE_VALUES.has(backgroundStyle)) {
    errors.push(`sections.${sectionName}.backgroundStyle is invalid`);
  }

  const normalized: StudioSectionConfig = {
    enabled: typeof value.enabled === 'boolean' ? value.enabled : true,
    layout,
    textAlign,
    backgroundStyle,
  };

  const cardStyle = normalizeText(value.cardStyle);
  if (cardStyle) {
    if (!ALLOWED_CARD_STYLE_VALUES.has(cardStyle)) {
      errors.push(`sections.${sectionName}.cardStyle is invalid`);
    } else {
      normalized.cardStyle = cardStyle;
    }
  }

  const spacing = normalizeText(value.spacing) as CreatorSpacingScale;
  if (spacing) {
    if (!ALLOWED_SPACING_SCALES.has(spacing)) {
      errors.push(`sections.${sectionName}.spacing is invalid`);
    } else {
      normalized.spacing = spacing;
    }
  }

  if (sectionName === 'gallery') {
    const columns = Number(value.columns);
    if (Number.isFinite(columns)) {
      if (!ALLOWED_GALLERY_COLUMNS.has(columns)) {
        errors.push(`sections.gallery.columns is invalid`);
      } else {
        normalized.columns = columns as 2 | 3 | 4;
      }
    }
    const imageStyle = normalizeText(value.imageStyle);
    if (imageStyle) {
      if (!ALLOWED_GALLERY_IMAGE_STYLE.has(imageStyle)) {
        errors.push(`sections.gallery.imageStyle is invalid`);
      } else {
        normalized.imageStyle = imageStyle;
      }
    }
  }

  if (sectionName === 'location') {
    const mapStyle = normalizeText(value.mapStyle);
    if (mapStyle) {
      if (!ALLOWED_MAP_STYLE_VALUES.has(mapStyle)) {
        errors.push(`sections.location.mapStyle is invalid`);
      } else {
        normalized.mapStyle = mapStyle;
      }
    }
    if (value.showTransport !== undefined && typeof value.showTransport !== 'boolean') {
      errors.push(`sections.location.showTransport must be boolean`);
    } else if (typeof value.showTransport === 'boolean') {
      normalized.showTransport = value.showTransport;
    }
    if (value.showParking !== undefined && typeof value.showParking !== 'boolean') {
      errors.push(`sections.location.showParking must be boolean`);
    } else if (typeof value.showParking === 'boolean') {
      normalized.showParking = value.showParking;
    }
  }

  return normalized;
}

export function isCreatorTemplateCategory(value: string): value is CreatorTemplateCategory {
  return CATEGORY_SET.has(value as CreatorTemplateCategory);
}

export function isActiveCreatorCategory(value: string): value is ActiveCreatorCategory {
  return ACTIVE_CATEGORY_SET.has(value as CreatorTemplateCategory);
}

export function validateStudioConfigForCategory(
  category: string,
  studioConfig: unknown
): StudioValidationResult {
  if (!isActiveCreatorCategory(category)) {
    return {
      ok: false,
      errors: ['UNSUPPORTED_CREATOR_CATEGORY'],
    };
  }

  if (!isRecord(studioConfig)) {
    return { ok: false, errors: ['studioConfig must be an object'] };
  }

  const errors: string[] = [];
  const categorySections = SECTION_CONTRACT[category];
  const sectionSet = new Set(categorySections);

  Object.keys(studioConfig).forEach((key) => {
    if (!ALLOWED_TOP_LEVEL_KEYS.has(key)) {
      errors.push(`${key} is not allowed in studioConfig`);
    }
  });

  if (studioConfig.category !== category) {
    errors.push('studioConfig.category must match submission category');
  }

  if (!isRecord(studioConfig.theme)) {
    errors.push('theme must be an object');
  }
  const theme = isRecord(studioConfig.theme) ? studioConfig.theme : {};
  Object.keys(theme).forEach((key) => {
    if (!ALLOWED_THEME_KEYS.has(key)) {
      errors.push(`theme.${key} is not allowed`);
    }
  });

  const fontFamily = normalizeText(theme.fontFamily) as CreatorFontFamily;
  if (fontFamily && !ALLOWED_FONT_FAMILIES.has(fontFamily)) {
    errors.push('theme.fontFamily is invalid');
  }
  const spacingScale = normalizeText(theme.spacingScale) as CreatorSpacingScale;
  if (spacingScale && !ALLOWED_SPACING_SCALES.has(spacingScale)) {
    errors.push('theme.spacingScale is invalid');
  }

  if (!isRecord(studioConfig.sections)) {
    errors.push('sections must be an object');
  }
  const sectionsInput = isRecord(studioConfig.sections) ? studioConfig.sections : {};

  Object.keys(sectionsInput).forEach((section) => {
    if (!sectionSet.has(section)) {
      errors.push(`sections.${section} is not allowed for ${category}`);
    }
  });

  const normalizedSections: Record<string, StudioSectionConfig> = {};
  categorySections.forEach((section) => {
    normalizedSections[section] = normalizeSectionConfig(section, sectionsInput[section] ?? {}, errors);
  });

  const sectionOrderInput = Array.isArray(studioConfig.sectionOrder)
    ? studioConfig.sectionOrder
    : Array.isArray(studioConfig.blockOrder)
      ? studioConfig.blockOrder
      : [];

  if (!Array.isArray(sectionOrderInput) || !sectionOrderInput.every((item) => typeof item === 'string')) {
    errors.push('sectionOrder must be a string array');
  }

  const duplicateCheck = new Set<string>();
  const normalizedOrder: string[] = [];
  sectionOrderInput.forEach((sectionRaw) => {
    const section = String(sectionRaw);
    if (duplicateCheck.has(section)) {
      errors.push(`sectionOrder has duplicate section: ${section}`);
      return;
    }
    duplicateCheck.add(section);

    if (!sectionSet.has(section)) {
      errors.push(`sectionOrder includes unsupported section: ${section}`);
      return;
    }
    normalizedOrder.push(section);
  });

  categorySections.forEach((section) => {
    if (!normalizedOrder.includes(section)) {
      normalizedOrder.push(section);
    }
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    normalized: {
      category,
      theme: {
        primaryColor: normalizeColor(theme.primaryColor, '#e8a3b3'),
        backgroundColor: normalizeColor(theme.backgroundColor, '#ffffff'),
        textColor: normalizeColor(theme.textColor, '#333333'),
        fontFamily: ALLOWED_FONT_FAMILIES.has(fontFamily) ? fontFamily : 'Playfair Display',
        spacingScale: ALLOWED_SPACING_SCALES.has(spacingScale) ? spacingScale : 'normal',
      },
      sections: normalizedSections,
      sectionOrder: normalizedOrder,
    },
  };
}

export function validateSubmissionReadyForReview(params: {
  category: string;
  studioConfig: unknown;
  previewThumbnailUrl: string | null | undefined;
}): StudioValidationResult {
  const baseValidation = validateStudioConfigForCategory(params.category, params.studioConfig);
  if (!baseValidation.ok) return baseValidation;

  if (!normalizeText(params.previewThumbnailUrl)) {
    return {
      ok: false,
      errors: ['PREVIEW_THUMBNAIL_REQUIRED'],
    };
  }

  return baseValidation;
}
