/**
 * Desktop public sticky share panel — Figma DesktopPublicInvitationPage right panel.
 */
'use client';
/* eslint-disable i18next/no-literal-string */

import { useMemo, useState } from 'react';
import { shareViaKakaoTalk } from '@/src/lib/shareKakaoTalk';
import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import styles from './DesktopPublicSharePanel.module.css';

export type DesktopPublicSharePanelProps = {
  shareUrl: string;
  title?: string;
  text?: string;
  imageUrl?: string;
};

export default function DesktopPublicSharePanel({
  shareUrl,
  title,
  text,
  imageUrl,
}: DesktopPublicSharePanelProps) {
  const { t } = useInvitationT();
  const resolvedTitle = title?.trim() || t('invitation.share.fallbackTitle');
  const resolvedText = text?.trim() || t('invitation.share.fallback');
  const shareApps = [
    { id: 'whatsapp', label: 'WhatsApp', initial: 'W', color: '#25D366', textColor: '#fff' },
    { id: 'messenger', label: 'Messenger', initial: 'M', color: '#0084FF', textColor: '#fff' },
    { id: 'line', label: 'LINE', initial: 'L', color: '#06C755', textColor: '#fff' },
    { id: 'telegram', label: 'Telegram', initial: 'T', color: '#2AABEE', textColor: '#fff' },
    { id: 'email', label: 'Email', initial: 'E', color: '#6B7280', textColor: '#fff' },
    { id: 'native', label: t('invitation.share.device'), initial: '↑', color: '#4F46E5', textColor: '#fff' },
    { id: 'kakao', label: t('invitation.share.kakao'), initial: 'K', color: '#FEE500', textColor: '#1F2937' },
  ] as const;
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`${resolvedText}\n${shareUrl}`);

  const hrefById = useMemo(
    () =>
      ({
        whatsapp: `https://wa.me/?text=${encodedText}`,
        messenger: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        line: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
        telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(resolvedText)}`,
        email: `mailto:?subject=${encodeURIComponent(resolvedTitle)}&body=${encodedText}`,
      }) as Record<string, string>,
    [encodedText, encodedUrl, resolvedText, resolvedTitle]
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
        await navigator.share({ title: resolvedTitle, text: resolvedText, url: shareUrl });
        return;
      } catch {
        // fall through
      }
    }
    await handleCopy();
  };

  const handleKakao = async () => {
    try {
      const result = await shareViaKakaoTalk({
        title: resolvedTitle,
        description: resolvedText,
        imageUrl,
        canonicalUrl: shareUrl,
      });
      if (result === 'kakao-sdk') {
        setNotice(null);
        return;
      }
      setNotice(t('invitation.share.kakaoFallback'));
      if (result === 'clipboard') setCopied(true);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setNotice(null);
        return;
      }
      setNotice(t('invitation.share.kakaoInvalid'));
    }
  };

  return (
    <div className={styles.panel} data-testid="desktop-public-share-panel">
      <p className={styles.heading}>{t('invitation.share.native')}</p>
      <div className={styles.urlBox}>
        <span className={styles.urlText}>{shareUrl}</span>
      </div>
      <button
        type="button"
        className={copied ? `${styles.copyButton} ${styles.copyDone}` : styles.copyButton}
        onClick={() => void handleCopy()}
      >
        {copied ? t('invitation.share.copied') : t('invitation.share.copyLink')}
      </button>
      {notice ? <p className={styles.urlText}>{notice}</p> : null}
      <div className={styles.appGrid}>
        {shareApps.map((app) => {
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
