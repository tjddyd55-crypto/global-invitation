export type CreatorActiveCategory = 'wedding' | 'funeral' | 'message';
export type CreatorTemplateCategory = CreatorActiveCategory | 'simple_notice' | 'event' | 'business';
export type CreatorAvailability = 'active' | 'planned';
export type CreatorFontFamily = 'Playfair Display' | 'Noto Sans' | 'Noto Serif' | 'Montserrat' | 'Inter';
export type CreatorSpacingScale = 'compact' | 'normal' | 'wide';
export type CreatorLayout =
  | 'center'
  | 'left'
  | 'right'
  | 'split'
  | 'full'
  | 'grid'
  | 'masonry'
  | 'carousel';
export type CreatorTextAlign = 'left' | 'center' | 'right';
export type CreatorBackgroundStyle = 'image' | 'color' | 'gradient';
export type CreatorGalleryLayout = 'grid' | 'masonry' | 'carousel';
export type CreatorGalleryColumns = 2 | 3 | 4;
export type CreatorGalleryImageStyle = 'square' | 'rounded' | 'circle';
export type CreatorLocationMapStyle = 'card' | 'full' | 'compact';

export type CreatorThemeConfig = {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: CreatorFontFamily;
  spacingScale: CreatorSpacingScale;
};

export type CreatorSectionConfig = {
  enabled?: boolean;
  layout?: CreatorLayout;
  textAlign?: CreatorTextAlign;
  backgroundStyle?: CreatorBackgroundStyle;
  cardStyle?: 'none' | 'soft' | 'outline' | 'elevated';
  spacing?: CreatorSpacingScale;
};

export type CreatorGallerySectionConfig = CreatorSectionConfig & {
  layout?: CreatorGalleryLayout;
  columns?: CreatorGalleryColumns;
  imageStyle?: CreatorGalleryImageStyle;
};

export type CreatorLocationSectionConfig = CreatorSectionConfig & {
  mapStyle?: CreatorLocationMapStyle;
  showTransport?: boolean;
  showParking?: boolean;
};

export type CreatorSectionMap = Record<string, CreatorSectionConfig | CreatorGallerySectionConfig | CreatorLocationSectionConfig>;

export type CreatorStudioConfig = {
  category: CreatorActiveCategory;
  theme: CreatorThemeConfig;
  sections: CreatorSectionMap;
  sectionOrder: string[];
};

export const CREATOR_ACTIVE_CATEGORIES: CreatorActiveCategory[] = ['wedding', 'funeral', 'message'];
export const CREATOR_PLANNED_CATEGORIES: Exclude<CreatorTemplateCategory, CreatorActiveCategory>[] = [
  'simple_notice',
  'event',
  'business',
];

export const CREATOR_FONT_FAMILIES: CreatorFontFamily[] = [
  'Playfair Display',
  'Noto Sans',
  'Noto Serif',
  'Montserrat',
  'Inter',
];

export const CREATOR_SPACING_SCALES: CreatorSpacingScale[] = ['compact', 'normal', 'wide'];

export const CREATOR_CATEGORY_SECTIONS: Record<CreatorActiveCategory, string[]> = {
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

const DEFAULT_THEME: CreatorThemeConfig = {
  primaryColor: '#e8a3b3',
  backgroundColor: '#ffffff',
  textColor: '#333333',
  fontFamily: 'Playfair Display',
  spacingScale: 'normal',
};

export function isCreatorActiveCategory(value: string): value is CreatorActiveCategory {
  return CREATOR_ACTIVE_CATEGORIES.includes(value as CreatorActiveCategory);
}

function buildDefaultSectionConfig(section: string): CreatorSectionConfig | CreatorGallerySectionConfig | CreatorLocationSectionConfig {
  if (section === 'gallery') {
    return {
      enabled: true,
      layout: 'grid',
      columns: 3,
      imageStyle: 'rounded',
      textAlign: 'center',
      backgroundStyle: 'color',
    };
  }
  if (section === 'location') {
    return {
      enabled: true,
      layout: 'center',
      textAlign: 'center',
      backgroundStyle: 'color',
      mapStyle: 'card',
      showTransport: true,
      showParking: true,
    };
  }
  return {
    enabled: true,
    layout: 'center',
    textAlign: 'center',
    backgroundStyle: 'color',
    cardStyle: 'soft',
    spacing: 'normal',
  };
}

export function buildDefaultStudioConfig(category: CreatorActiveCategory): CreatorStudioConfig {
  const sectionOrder = [...CREATOR_CATEGORY_SECTIONS[category]];
  const sections = sectionOrder.reduce<CreatorSectionMap>((acc, section) => {
    acc[section] = buildDefaultSectionConfig(section);
    return acc;
  }, {});

  return {
    category,
    theme: { ...DEFAULT_THEME },
    sections,
    sectionOrder,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parseStudioConfig(value: unknown): CreatorStudioConfig | null {
  if (!isRecord(value)) return null;
  const categoryValue = value.category;
  if (typeof categoryValue !== 'string' || !isCreatorActiveCategory(categoryValue)) return null;

  const base = buildDefaultStudioConfig(categoryValue);
  const themeInput = isRecord(value.theme) ? value.theme : {};
  const sectionsInput = isRecord(value.sections) ? value.sections : {};
  const sectionOrderInput =
    Array.isArray(value.sectionOrder) && value.sectionOrder.every((item) => typeof item === 'string')
      ? (value.sectionOrder as string[])
      : Array.isArray((value as { blockOrder?: unknown }).blockOrder) &&
          (value as { blockOrder: unknown[] }).blockOrder.every((item) => typeof item === 'string')
        ? ((value as { blockOrder: string[] }).blockOrder as string[])
        : base.sectionOrder;

  const mergedTheme: CreatorThemeConfig = {
    primaryColor:
      typeof themeInput.primaryColor === 'string' ? themeInput.primaryColor : base.theme.primaryColor,
    backgroundColor:
      typeof themeInput.backgroundColor === 'string'
        ? themeInput.backgroundColor
        : base.theme.backgroundColor,
    textColor: typeof themeInput.textColor === 'string' ? themeInput.textColor : base.theme.textColor,
    fontFamily:
      typeof themeInput.fontFamily === 'string' &&
      CREATOR_FONT_FAMILIES.includes(themeInput.fontFamily as CreatorFontFamily)
        ? (themeInput.fontFamily as CreatorFontFamily)
        : base.theme.fontFamily,
    spacingScale:
      typeof themeInput.spacingScale === 'string' &&
      CREATOR_SPACING_SCALES.includes(themeInput.spacingScale as CreatorSpacingScale)
        ? (themeInput.spacingScale as CreatorSpacingScale)
        : base.theme.spacingScale,
  };

  const mergedSections: CreatorSectionMap = {};
  base.sectionOrder.forEach((section) => {
    const defaultSection = base.sections[section];
    const inputSection = isRecord(sectionsInput[section]) ? sectionsInput[section] : {};
    mergedSections[section] = {
      ...(defaultSection as Record<string, unknown>),
      ...(inputSection as Record<string, unknown>),
    } as CreatorSectionConfig;
  });

  const allowed = new Set(base.sectionOrder);
  const normalizedOrder = sectionOrderInput.filter((section) => allowed.has(section));
  const missing = base.sectionOrder.filter((section) => !normalizedOrder.includes(section));

  return {
    category: categoryValue,
    theme: mergedTheme,
    sections: mergedSections,
    sectionOrder: [...normalizedOrder, ...missing],
  };
}
