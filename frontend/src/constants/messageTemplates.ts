import { I18N_KEYS, type I18nKey } from '@/src/i18n';

export type MessageTemplateCard = {
  id: string;
  nameKey: I18nKey;
  descriptionKey: I18nKey;
  previewUrl: string;
  editorUrl: string;
};

export type MessageTemplateGroup = {
  id: string;
  titleKey: I18nKey;
  subtitleKey?: I18nKey;
  templates: MessageTemplateCard[];
};

export const MESSAGE_TEMPLATE_GROUPS: MessageTemplateGroup[] = [
  {
    id: 'simple-message',
    titleKey: I18N_KEYS.messageTemplates.simpleTitle,
    subtitleKey: I18N_KEYS.messageTemplates.simpleSubtitle,
    templates: [
      {
        id: 'thank-you',
        nameKey: I18N_KEYS.messageTemplates.thankYouName,
        descriptionKey: I18N_KEYS.messageTemplates.thankYouDescription,
        previewUrl: '/message/demo-thank-you',
        editorUrl: '/message/editor/demo-thank-you',
      },
      {
        id: 'simple-message',
        nameKey: I18N_KEYS.messageTemplates.simpleName,
        descriptionKey: I18N_KEYS.messageTemplates.simpleDescription,
        previewUrl: '/message/demo-simple',
        editorUrl: '/message/editor/demo-simple',
      },
    ],
  },
  {
    id: 'branded-message',
    titleKey: I18N_KEYS.messageTemplates.brandedTitle,
    subtitleKey: I18N_KEYS.messageTemplates.brandedSubtitle,
    templates: [
      {
        id: 'jci',
        nameKey: I18N_KEYS.messageTemplates.brandedJciName,
        descriptionKey: I18N_KEYS.messageTemplates.brandedJciDescription,
        previewUrl: '/message/branded/demo-jci',
        editorUrl: '/message/branded/editor/demo-jci',
      },
    ],
  },
];
