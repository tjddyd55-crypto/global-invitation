import type { MessageCardSimple } from '@/src/models/messageSimple';

export const DEMO_MESSAGE_SIMPLE_SLUG = 'demo-simple';

export function isMessageSimpleDemoSlug(slug?: string | null): boolean {
  return slug === DEMO_MESSAGE_SIMPLE_SLUG;
}

export function getMessageSimpleDemoData(): MessageCardSimple {
  return {
    templateKey: 'message_simple',
    heroImage: '/images/wedding/classic/hero.jpg',
    title: '따뜻한 안부를 전합니다',
    subtitle: '김지우 드림',
    message: '짧은 안부와 감사의 마음을 전합니다.\n항상 건강하고 행복하세요.',
    schedule: {
      date: '2026-02-14',
      time: '18:00',
      place: '서울 강남구 작은 모임',
    },
    actions: {
      copyLink: true,
      kakaoShare: true,
      calendarSave: true,
    },
  };
}
