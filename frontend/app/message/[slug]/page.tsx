'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import MessageThankYouCard from '@/src/templates/messageThankYou/MessageThankYouCard';
import {
  getMessageCardDemoData,
  isMessageCardDemoSlug,
} from '@/src/templates/messageThankYou/data';
import type { MessageCardData } from '@/src/models/messageCard';
import MessageSimpleCard from '@/src/templates/messageSimple/MessageSimpleCard';
import { getMessageSimpleDemoData, isMessageSimpleDemoSlug } from '@/src/templates/messageSimple/data';
import type { MessageCardSimple } from '@/src/models/messageSimple';

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function buildCalendarIcs(title: string, eventDate: string, location?: string) {
  const start = new Date(eventDate);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Global Invitation//MessageCard//EN',
    'BEGIN:VEVENT',
    `UID:${title.replace(/\s+/g, '-')}-${start.getTime()}@global-invitation`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${title}`,
    location ? `LOCATION:${location}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\n');
}

export default function MessageCardPage() {
  const params = useParams();
  const slugParam = params.slug;
  const slug = typeof slugParam === 'string' ? slugParam : Array.isArray(slugParam) ? slugParam[0] : '';

  const [data, setData] = useState<MessageCardData | null>(null);
  const [simpleData, setSimpleData] = useState<MessageCardSimple | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setData(null);
    setSimpleData(null);
    setError(null);

    if (isMessageSimpleDemoSlug(slug)) {
      setSimpleData(getMessageSimpleDemoData());
      return;
    }

    if (isMessageCardDemoSlug(slug)) {
      setData(getMessageCardDemoData());
      return;
    }

    setError('지원하지 않는 메시지 카드입니다.');
  }, [slug]);

  const actionHandlers = useMemo(() => {
    if (!data) return null;

    return {
      onCopyLink: async () => {
        const url = window.location.href;
        try {
          await navigator.clipboard.writeText(url);
          alert('링크가 복사되었습니다.');
        } catch {
          prompt('링크 복사에 실패했습니다. 아래 주소를 복사하세요.', url);
        }
      },
      onCalendar: () => {
        if (!data.eventDate) {
          alert('일정 정보가 없습니다.');
          return;
        }
        const ics = buildCalendarIcs(data.title, data.eventDate, data.location);
        if (!ics) {
          alert('유효한 일정 정보가 없습니다.');
          return;
        }
        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${data.slug || 'message-card'}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      onKakaoShare: () => {
        alert('카카오 공유는 준비 중입니다.');
      },
    };
  }, [data]);

  const simpleActionHandlers = useMemo(() => {
    if (!simpleData) return null;

    const buildEventDate = () => {
      if (!simpleData.schedule?.date) return null;
      const time = simpleData.schedule.time ?? '09:00';
      return `${simpleData.schedule.date}T${time}`;
    };

    return {
      onCopyLink: async () => {
        const url = window.location.href;
        try {
          await navigator.clipboard.writeText(url);
          alert('링크가 복사되었습니다.');
        } catch {
          prompt('링크 복사에 실패했습니다. 아래 주소를 복사하세요.', url);
        }
      },
      onKakaoShare: () => {
        alert('카카오 공유는 준비 중입니다.');
      },
      onCalendarSave: () => {
        const eventDate = buildEventDate();
        if (!eventDate) {
          alert('일정 정보가 없습니다.');
          return;
        }
        const ics = buildCalendarIcs(simpleData.title || '일정', eventDate, simpleData.schedule?.place);
        if (!ics) {
          alert('유효한 일정 정보가 없습니다.');
          return;
        }
        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${simpleData.templateKey}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
    };
  }, [simpleData]);

  if (!data && !simpleData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>{error || '로딩 중...'}</p>
      </div>
    );
  }

  if (simpleData && simpleData.templateKey === 'message_simple') {
    return (
      <MessageSimpleCard
        data={simpleData}
        onCopyLink={simpleActionHandlers?.onCopyLink}
        onKakaoShare={simpleActionHandlers?.onKakaoShare}
        onCalendarSave={simpleActionHandlers?.onCalendarSave}
      />
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>{error || '메시지 카드를 불러올 수 없습니다.'}</p>
      </div>
    );
  }

  return (
    <MessageThankYouCard
      data={data}
      onCalendar={actionHandlers?.onCalendar}
      onCopyLink={actionHandlers?.onCopyLink}
      onKakaoShare={actionHandlers?.onKakaoShare}
    />
  );
}
