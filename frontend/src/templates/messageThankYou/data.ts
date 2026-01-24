import type { MessageCardData } from '@/src/models/messageCard';

export const DEMO_MESSAGE_CARD_SLUG = 'demo-thank-you';

export function isMessageCardDemoSlug(slug?: string | null): boolean {
  return slug === DEMO_MESSAGE_CARD_SLUG;
}

export function getMessageCardDemoData(): MessageCardData {
  return {
    slug: DEMO_MESSAGE_CARD_SLUG,
    coverImage: '/images/wedding/classic/hero.jpg',
    title: 'Thank You',
    subtitle: '유동규 ♥ 이소영',
    description: '소중한 순간을 함께해 주셔서 진심으로 감사합니다.',
    eventDate: '2025-04-13T17:20:00',
    location: '더링크호텔 서울',
    actions: {
      calendar: true,
      copyLink: true,
      kakaoShare: true,
    },
    theme: 'light',
  };
}

export function buildMessageCardOgMeta(data: MessageCardData) {
  return {
    title: data.title,
    description: data.subtitle || data.description || '',
    image: data.coverImage,
  };
}
