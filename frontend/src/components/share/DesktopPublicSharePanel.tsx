/**
 * Desktop public sticky share panel — Figma DesktopPublicInvitationPage right panel.
 */
'use client';
/* eslint-disable i18next/no-literal-string */

import { useMemo, useState } from 'react';
import { shareViaKakaoTalk } from '@/src/lib/shareKakaoTalk';
import styles from './DesktopPublicSharePanel.module.css';

export type DesktopPublicSharePanelProps = {
  shareUrl: string;
  title?: string;
  text?: string;
  imageUrl?: string;
};

const SHARE_APPS = [
  { id: 'whatsapp', label: 'WhatsApp', initial: 'W', color: '#25D366', textColor: '#fff' },
  { id: 'messenger', label: 'Messenger', initial: 'M', color: '#0084FF', textColor: '#fff' },
  { id: 'line', label: 'LINE', initial: 'L', color: '#06C755', textColor: '#fff' },
  { id: 'telegram', label: 'Telegram', initial: 'T', color: '#2AABEE', textColor: '#fff' },
  { id: 'email', label: 'Email', initial: 'E', color: '#6B7280', textColor: '#fff' },
  { id: 'native', label: '기기 공유', initial: '↑', color: '#4F46E5', textColor: '#fff' },
  { id: 'kakao', label: '카카오톡', initial: 'K', color: '#FEE500', textColor: '#1F2937' },
] as const;

export default function DesktopPublicSharePanel({
  shareUrl,
  title = '초대장',
  text = '초대장을 확인해 주세요.',
  imageUrl,
}: DesktopPublicSharePanelProps) {
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`${text}\n${shareUrl}`);

  const hrefById = useMemo(
    () =>
      ({
        whatsapp: `https://wa.me/?text=${encodedText}`,
        messenger: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        line: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
        telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(text)}`,
        email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}`,
      }) as Record<string, string>,
    [encodedText, encodedUrl, text, title]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleNative = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch {
        // fall through
      }
    }
    await handleCopy();
  };

  const handleKakao = async () => {
    const result = await shareViaKakaoTalk({
      title,
      description: text,
      imageUrl,
      canonicalUrl: shareUrl,
    });
    if (result === 'copy') {
      setNotice('카카오톡 공유를 열지 못해 초대장 링크를 복사했습니다.');
      setCopied(true);
    } else {
      setNotice(null);
    }
  };

  return (
    <div className={styles.panel} data-testid="desktop-public-share-panel">
      <p className={styles.heading}>공유하기</p>
      <div className={styles.urlBox}>
        <span className={styles.urlText}>{shareUrl}</span>
      </div>
      <button
        type="button"
        className={copied ? `${styles.copyButton} ${styles.copyDone}` : styles.copyButton}
        onClick={() => void handleCopy()}
      >
        {copied ? '복사됨!' : '링크 복사'}
      </button>
      {notice ? <p className={styles.urlText}>{notice}</p> : null}
      <div className={styles.appGrid}>
        {SHARE_APPS.map((app) => {
          if (app.id === 'native') {
            return (
              <button key={app.id} type="button" className={styles.appItem} onClick={() => void handleNative()}>
                <span className={styles.appIcon} style={{ background: app.color, color: app.textColor }}>
                  {app.initial}
                </span>
                <span className={styles.appLabel}>{app.label}</span>
              </button>
            );
          }
          if (app.id === 'kakao') {
            return (
              <button
                key={app.id}
                type="button"
                className={styles.appItem}
                data-testid="share-kakao-talk"
                onClick={() => void handleKakao()}
              >
                <span className={styles.appIcon} style={{ background: app.color, color: app.textColor }}>
                  {app.initial}
                </span>
                <span className={styles.appLabel}>{app.label}</span>
              </button>
            );
          }
          return (
            <a
              key={app.id}
              className={styles.appItem}
              href={hrefById[app.id]}
              target="_blank"
              rel="noreferrer"
            >
              <span className={styles.appIcon} style={{ background: app.color, color: app.textColor }}>
                {app.initial}
              </span>
              <span className={styles.appLabel}>{app.label}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
