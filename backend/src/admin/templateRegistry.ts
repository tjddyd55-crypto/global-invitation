export const TEMPLATE_COMPONENT_BY_KEY = {
  wedding_classic: 'WeddingClassicTemplate',
  classic: 'WeddingClassicTemplate',
  funeral_classic: 'FuneralClassicTemplate',
  message_simple: 'MessageSimpleTemplate',
  message_thankyou: 'MessageThankYouTemplate',
  message_branded_jci: 'MessageBrandedJciTemplate',
  message_branded: 'MessageBrandedJciTemplate',
} as const;

export type ValidTemplateKey = keyof typeof TEMPLATE_COMPONENT_BY_KEY;

export const VALID_TEMPLATE_KEYS = Object.keys(TEMPLATE_COMPONENT_BY_KEY) as ValidTemplateKey[];
const CREATOR_TEMPLATE_KEY_REGEX = /^creator_(wedding|funeral|message)_[a-z0-9_]+$/;

const CREATOR_COMPONENT_BY_CATEGORY: Record<'wedding' | 'funeral' | 'message', string> = {
  wedding: 'CreatorWeddingTemplate',
  funeral: 'CreatorFuneralTemplate',
  message: 'CreatorMessageTemplate',
};

export function isValidTemplateKey(value: string): value is ValidTemplateKey {
  return value in TEMPLATE_COMPONENT_BY_KEY || CREATOR_TEMPLATE_KEY_REGEX.test(value);
}

export function resolveTemplateComponentByKey(templateKey: string): string | null {
  if (CREATOR_TEMPLATE_KEY_REGEX.test(templateKey)) {
    const category = templateKey.split('_')[1] as 'wedding' | 'funeral' | 'message';
    return CREATOR_COMPONENT_BY_CATEGORY[category] ?? null;
  }
  return TEMPLATE_COMPONENT_BY_KEY[templateKey as ValidTemplateKey] ?? null;
}
