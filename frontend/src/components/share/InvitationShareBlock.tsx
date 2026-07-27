/**
 * Invitation public share block — Figma PublicInvitationPage Share hierarchy.
 * Primary: 공유하기 (opens bottom sheet)
 * Secondary: 링크 복사
 * Sheet: WhatsApp / Messenger / LINE / Telegram / Email / SMS / KakaoTalk / 링크 복사
 */
'use client';
/* eslint-disable i18next/no-literal-string */

import { useState } from 'react';
import styles from './InvitationShareBlock.module.css';

export type InvitationShareBlockProps = {
  shareUrl: string;
  title?: string;
  text?: string;
};

const SHARE_APPS = [
  { id: 'whatsapp', label: 'WhatsApp', initial: 'W', color: '#25D366', textColor: '#fff' },
  { id: 'messenger', label: 'Messenger', initial: 'M', color: '#0084FF', textColor: '#fff' },
  { id: 'line', label: 'LINE', initial: 'L', color: '#06C755', textColor: '#fff' },
  { id: 'telegram', label: 'Telegram', initial: 'T', color: '#2AABEE', textColor: '#fff' },
  { id: 'email', label: 'Email', initial: 'E', color: '#6B7280', textColor: '#fff' },
  { id: 'sms', label: 'SMS', initial: 'S', color: '#374151', textColor: '#fff' },
  { id: 'kakao', label: 'KakaoTalk', initial: 'K', color: '#FEE500', textColor: '#1F2937' },
  { id: 'copy', label: '링크 복사', initial: '⎘', color: '#4F46E5', textColor: '#fff' },
] as const;

export default function InvitationShareBlock({
  shareUrl,
  title = '초대장',
  text = '초대장을 확인해 주세요.',
}: InvitationShareBlockProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setLinkCopied(false);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch {
        // fall through to sheet
      }
    }
    setSheetOpen(true);
  };

  const handleApp = async (id: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(`${text}\n${shareUrl}`);
    if (id === 'copy') {
      await handleCopy();
      setSheetOpen(false);
      return;
    }
    const hrefById: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodedText}`,
      messenger: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      line: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(text)}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}`,
      sms: `sms:?&body=${encodedText}`,
      kakao: `https://story.kakao.com/share?url=${encodedUrl}`,
    };
    const href = hrefById[id];
    if (href) window.open(href, '_blank', 'noopener,noreferrer');
    setSheetOpen(false);
  };

  return (
    <section className={styles.section} data-testid="invitation-share-block">
      <p className={styles.scriptLabel}>Share</p>
      <p className={styles.hint}>
        사용 중인 기기의 공유 기능으로
        <br />
        원하는 앱에 바로 보낼 수 있습니다.
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={() => void handleNativeShare()}>
          공유하기
        </button>
        <button type="button" className={styles.secondary} onClick={() => void handleCopy()}>
          {linkCopied ? '복사됨!' : '링크 복사'}
        </button>
      </div>

      {sheetOpen ? (
        <div
          className={styles.sheetBackdrop}
          role="presentation"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className={styles.sheet}
            role="dialog"
            aria-label="공유하기"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.sheetHandle} />
            <div className={styles.sheetHeader}>
              <p className={styles.sheetTitle}>공유하기</p>
              <button type="button" className={styles.sheetClose} onClick={() => setSheetOpen(false)}>
                ×
              </button>
            </div>
            <div className={styles.appGrid}>
              {SHARE_APPS.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  className={styles.appItem}
                  onClick={() => void handleApp(app.id)}
                >
                  <span
                    className={styles.appIcon}
                    style={{ background: app.color, color: app.textColor }}
                  >
                    {app.initial}
                  </span>
                  <span className={styles.appLabel}>{app.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
