'use client';
/* eslint-disable i18next/no-literal-string */

import { useMemo, useState } from 'react';
import styles from './GlobalSharePanel.module.css';

export type GlobalSharePanelProps = {
  shareUrl: string;
  title?: string;
  text?: string;
  variant?: 'card' | 'sheet';
  onCopied?: () => void;
};

type ShareTarget = {
  id: string;
  label: string;
  href?: string;
  action?: 'copy' | 'native';
};

/**
 * 글로벌 공유 옵션.
 * KakaoTalk 단독 강조 없이 WhatsApp/Messenger/LINE/Telegram/Email/SMS를 동일 그리드로 둔다.
 */
export default function GlobalSharePanel({
  shareUrl,
  title = '초대장',
  text = '초대장을 확인해 주세요.',
  variant = 'card',
  onCopied,
}: GlobalSharePanelProps) {
  const [notice, setNotice] = useState<string | null>(null);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`${text}\n${shareUrl}`);

  const targets = useMemo<ShareTarget[]>(
    () => [
      { id: 'copy', label: '링크 복사', action: 'copy' },
      { id: 'native', label: '기기 공유', action: 'native' },
      {
        id: 'whatsapp',
        label: 'WhatsApp',
        href: `https://wa.me/?text=${encodedText}`,
      },
      {
        id: 'messenger',
        label: 'Messenger',
        href: `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=&redirect_uri=${encodedUrl}`,
      },
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
        label: 'KakaoTalk',
        href: `https://story.kakao.com/share?url=${encodedUrl}`,
      },
    ],
    [encodedText, encodedUrl, text, title],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setNotice('링크를 복사했습니다.');
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

  return (
    <section className={variant === 'sheet' ? styles.sheet : styles.card}>
      <h2 className={styles.heading}>공유하기</h2>
      <p className={styles.url}>{shareUrl}</p>
      <div className={styles.grid}>
        {targets.map((target) => {
          if (target.action === 'copy') {
            return (
              <button key={target.id} type="button" className={styles.item} onClick={() => void handleCopy()}>
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
