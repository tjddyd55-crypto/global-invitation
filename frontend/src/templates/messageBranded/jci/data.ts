import type { BrandedMessageCard } from '@/src/models/messageBranded';

export const DEMO_MESSAGE_BRANDED_JCI_SLUG = 'demo-jci';

export const JCI_PRIMARY_BLUE = '#0097D7';
export const JCI_SECONDARY_NAVY = '#1F4789';

export function isMessageBrandedJciDemoSlug(slug?: string | null): boolean {
  return slug === DEMO_MESSAGE_BRANDED_JCI_SLUG;
}

export function getMessageBrandedJciDemoData(): BrandedMessageCard {
  return {
    templateKey: 'message_branded',
    brand: {
      key: 'jci',
      name: 'JCI Korea-Seoul',
      logo: '/brands/jci/jci-logo.png',
      primaryColor: JCI_PRIMARY_BLUE,
      secondaryColor: JCI_SECONDARY_NAVY,
    },
    heroImage: '/images/wedding/classic/hero.jpg',
    title: 'Placeholder Title',
    message: 'Placeholder message text for branded message card.\nNo specific event or organisation detail.',
    schedule: {
      date: '2026-03-15',
      time: '19:00',
      place: 'Placeholder Place',
    },
    map: {
      lat: 37.5665,
      lng: 126.978,
      label: 'JCI Demo Location',
    },
  };
}
