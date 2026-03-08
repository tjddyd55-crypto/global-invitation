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

export function isValidTemplateKey(value: string): value is ValidTemplateKey {
  return value in TEMPLATE_COMPONENT_BY_KEY;
}

export function resolveTemplateComponentByKey(templateKey: string): string | null {
  return TEMPLATE_COMPONENT_BY_KEY[templateKey as ValidTemplateKey] ?? null;
}
