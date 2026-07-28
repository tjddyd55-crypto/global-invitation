'use client';
/* eslint-disable i18next/no-literal-string */

import { useMemo, useState } from 'react';
import { KAKAO_SHARE_FALLBACK_NOTICE, shareViaKakaoTalk } from '@/src/lib/shareKakaoTalk';
import styles from './GlobalSharePanel.module.css';

export type GlobalSharePanelProps = {
  shareUrl: string;
  title?: string;
  text?: string;
  imageUrl?: string;
  variant?: 'card' | 'sheet';
  onCopied?: () => void;
};

type ShareTarget = {
  id: string;
  label: string;
  href?: string;
  action?: 'copy' | 'native' | 'kakao';
};

function resolveFacebookAppId(): string {
  return (process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '').trim();
}

/**
 * 글로벌 공유 옵션.
 * KakaoTalk 단독 강조 없이 WhatsApp/Messenger/LINE/Telegram/Email/SMS를 동일 그리드로 둔다.
 * Messenger: app_id 없으면 빈 dialog URL 대신 링크 복사로 fallback.
 */
export default function GlobalSharePanel({
  shareUrl,
  title = '초대장',
  text = '초대장을 확인해 주세요.',
  imageUrl,
  variant = 'card',
  onCopied,
}: GlobalSharePanelProps) {
  const [notice, setNotice] = useState<string | null>(null);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`${text}\n${shareUrl}`);
  const facebookAppId = resolveFacebookAppId();

  const targets = useMemo<ShareTarget[]>(() => {
    const items: ShareTarget[] = [
      { id: 'copy', label: '링크 복사', action: 'copy' },
      { id: 'native', label: '기기 공유', action: 'native' },
      {
        id: 'whatsapp',
        label: 'WhatsApp',
        href: `https://wa.me/?text=${encodedText}`,
      },
    ];

    if (facebookAppId) {
      items.push({
        id: 'messenger',
        label: 'Messenger',
        href: `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=${encodeURIComponent(facebookAppId)}&redirect_uri=${encodedUrl}`,
      });
    } else {
      items.push({
        id: 'messenger',
        label: 'Messenger',
        action: 'copy',
      });
    }

    items.push(
      {
        id: 'line',
        label: 'LINE',
        href: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
      },
      {
        id: 'telegram',
        label: 'Telegram',
        href: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(text)}`,
      },
      {
        id: 'email',
        label: 'Email',
        href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}`,
      },
      {
        id: 'sms',
        label: 'SMS',
        href: `sms:?&body=${encodedText}`,
      },
      {
        id: 'kakao',
        label: '카카오톡',
        action: 'kakao',
      },
    );

    return items;
  }, [encodedText, encodedUrl, facebookAppId, text, title]);

  const handleCopy = async (successNotice = '링크를 복사했습니다.') => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setNotice(successNotice);
      onCopied?.();
    } catch {
      setNotice('복사에 실패했습니다. 주소를 직접 선택해 주세요.');
    }
  };

  const handleNative = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch {
        // fall through to copy
      }
    }
    await handleCopy();
  };

  const handleKakao = async () => {
    try {
      const result = await shareViaKakaoTalk({
        title,
        description: text,
        imageUrl,
        canonicalUrl: shareUrl,
      });
      if (result === 'kakao-sdk') {
        setNotice(null);
        return;
      }
      setNotice(KAKAO_SHARE_FALLBACK_NOTICE);
      if (result === 'clipboard') onCopied?.();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setNotice(null);
        return;
      }
      setNotice('카카오톡 공유 URL이 올바르지 않습니다. 공개 링크를 확인해 주세요.');
    }
  };

  return (
    <section className={variant === 'sheet' ? styles.sheet : styles.card}>
      <h2 className={styles.heading}>공유하기</h2>
      <p className={styles.url}>{shareUrl}</p>
      <div className={styles.grid}>
        {targets.map((target) => {
          if (target.action === 'copy') {
            const noticeText =
              target.id === 'messenger'
                ? 'Messenger 앱 ID가 없어 링크를 복사했습니다. Messenger에 붙여넣어 공유해 주세요.'
                : '링크를 복사했습니다.';
            return (
              <button
                key={target.id}
                type="button"
                className={styles.item}
                onClick={() => void handleCopy(noticeText)}
              >
                {target.label}
              </button>
            );
          }
          if (target.action === 'native') {
            return (
              <button key={target.id} type="button" className={styles.item} onClick={() => void handleNative()}>
                {target.label}
              </button>
            );
          }
          if (target.action === 'kakao') {
            return (
              <button
                key={target.id}
                type="button"
                className={styles.item}
                data-testid="share-kakao-talk"
                onClick={() => void handleKakao()}
              >
                {target.label}
              </button>
            );
          }
          return (
            <a
              key={target.id}
              className={styles.item}
              href={target.href}
              target="_blank"
              rel="noreferrer"
            >
              {target.label}
            </a>
          );
        })}
      </div>
      {notice && <p className={styles.notice}>{notice}</p>}
    </section>
  );
}
