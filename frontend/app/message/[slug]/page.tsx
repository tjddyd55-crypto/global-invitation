'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import EditorBackButton from '@/app/_components/EditorBackButton';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';
import { logEvent } from '@/src/lib/events';
import { buildShareUrl, getShareContent, shareLink } from '@/src/lib/share';
import { buildCanonicalUrl } from '@/src/lib/siteUrl';
import ShareFallbackNotice from '@/src/components/ShareFallbackNotice';
import PaymentButton from '@/src/components/PaymentButton';
import { canAccessPaidAction, notifyPaymentRequired } from '@/src/lib/payments';
import { getStoredSession } from '@/src/lib/auth';

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
  const { t, language } = useI18n();

  const [data, setData] = useState<MessageCardData | null>(null);
  const [simpleData, setSimpleData] = useState<MessageCardSimple | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const [shareFallbackUrl, setShareFallbackUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const viewLoggedRef = useRef(false);
  const pageUrl = buildCanonicalUrl(`/message/${slug}`);
  const isDemo = isMessageSimpleDemoSlug(slug) || isMessageCardDemoSlug(slug);

  useEffect(() => {
    setHasSession(Boolean(getStoredSession()));
  }, []);

  useEffect(() => {
    if (!slug) return;
    setData(null);
    setSimpleData(null);
    setError(null);
    setShared(false);
    setShareFallbackUrl(null);
    setIsSharing(false);

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

  useEffect(() => {
    if (viewLoggedRef.current) return;
    if (data || simpleData) {
      logEvent({ eventType: 'invitation_view', templateType: 'message', language, pageUrl });
      viewLoggedRef.current = true;
    }
  }, [data, simpleData, language, pageUrl]);

  const markShared = () => {
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const actionHandlers = useMemo(() => {
    if (!data) return null;

    return {
      onShare: async () => {
        if (isSharing) return;
        if (!isDemo && !hasSession) {
          alert('공유하려면 로그인이 필요합니다.');
          return;
        }
        if (!canAccessPaidAction({ product: 'simple_message' })) {
          notifyPaymentRequired(t);
          return;
        }
        setShareFallbackUrl(null);
        setIsSharing(true);
        try {
          logEvent({ eventType: 'share_click', templateType: 'message', language, pageUrl });
          const { title, description } = getShareContent('message', t);
          const url = buildShareUrl(`/message/${slug}`);
          const result = await shareLink({ url, title, text: description });
          if (result === 'shared' || result === 'copied') {
            markShared();
            return;
          }
          if (result === 'manual') {
            setShareFallbackUrl(url);
            return;
          }
          if (result === 'failed') {
            alert(t(I18N_KEYS.notice.copyFailed));
          }
        } finally {
          setIsSharing(false);
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
        logEvent({ eventType: 'share_click', templateType: 'message', language, pageUrl });
        alert(t(I18N_KEYS.notice.kakaoShareUnavailable));
      },
    };
  }, [data, hasSession, isDemo, isSharing, language, markShared, pageUrl, slug, t]);

  const simpleActionHandlers = useMemo(() => {
    if (!simpleData) return null;

    const buildEventDate = () => {
      if (!simpleData.schedule?.date) return null;
      const time = simpleData.schedule.time ?? '09:00';
      return `${simpleData.schedule.date}T${time}`;
    };

    return {
      onShare: async () => {
        if (isSharing) return;
        if (!isDemo && !hasSession) {
          alert('공유하려면 로그인이 필요합니다.');
          return;
        }
        if (!canAccessPaidAction({ product: 'simple_message' })) {
          notifyPaymentRequired(t);
          return;
        }
        setShareFallbackUrl(null);
        setIsSharing(true);
        try {
          logEvent({ eventType: 'share_click', templateType: 'message', language, pageUrl });
          const { title, description } = getShareContent('message', t);
          const url = buildShareUrl(`/message/${slug}`);
          const result = await shareLink({ url, title, text: description });
          if (result === 'shared' || result === 'copied') {
            markShared();
            return;
          }
          if (result === 'manual') {
            setShareFallbackUrl(url);
            return;
          }
          if (result === 'failed') {
            alert(t(I18N_KEYS.notice.copyFailed));
          }
        } finally {
          setIsSharing(false);
        }
      },
      onKakaoShare: () => {
        logEvent({ eventType: 'share_click', templateType: 'message', language, pageUrl });
        alert(t(I18N_KEYS.notice.kakaoShareUnavailable));
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
  }, [hasSession, isDemo, isSharing, language, markShared, pageUrl, simpleData, slug, t]);

  if (!data && !simpleData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>{error || '로딩 중...'}</p>
      </div>
    );
  }

  if (simpleData && simpleData.templateKey === 'message_simple') {
    return (
      <>
        <EditorBackButton fallbackUrl={`/message/editor/${slug}`} />
        <MessageSimpleCard
          data={simpleData}
          onShare={simpleActionHandlers?.onShare}
          isShared={shared}
          onKakaoShare={simpleActionHandlers?.onKakaoShare}
          onCalendarSave={simpleActionHandlers?.onCalendarSave}
        />
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
          <PaymentButton product="simple_message" />
        </div>
        {shareFallbackUrl && (
          <ShareFallbackNotice url={shareFallbackUrl} onClose={() => setShareFallbackUrl(null)} />
        )}
      </>
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
    <>
      <EditorBackButton fallbackUrl={`/message/editor/${slug}`} />
      <MessageThankYouCard
        data={data}
        onCalendar={actionHandlers?.onCalendar}
        onShare={actionHandlers?.onShare}
        isShared={shared}
        onKakaoShare={actionHandlers?.onKakaoShare}
      />
      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
        <PaymentButton product="simple_message" />
      </div>
      {shareFallbackUrl && (
        <ShareFallbackNotice url={shareFallbackUrl} onClose={() => setShareFallbackUrl(null)} />
      )}
    </>
  );
}
