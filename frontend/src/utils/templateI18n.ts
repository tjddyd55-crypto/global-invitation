import type { Template } from '@/src/constants/templates';

/**
 * 템플릿의 다국어 이름을 반환합니다.
 */
export function getTemplateName(template: Template, t: (key: string) => string): string {
  return t(`template.${template.i18nKey}.name`);
}

/**
 * 템플릿의 다국어 설명을 반환합니다.
 */
export function getTemplateDescription(template: Template, t: (key: string) => string): string {
  return t(`template.${template.i18nKey}.description`);
}

/**
 * 태그의 다국어 이름을 반환합니다.
 */
export function getTagName(tagKey: string, t: (key: string) => string): string {
  return t(`tag.${tagKey}`);
}
