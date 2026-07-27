/* eslint-disable i18next/no-literal-string */

import { HeartIcon, BookOpenIcon, CalendarDaysIcon } from '@/src/ui/icons/ConceptIcons';
import { MailIcon } from '@/src/ui/icons/MarketingIcons';
import styles from './InvitationDecorativeCards.module.css';

const CARDS = [
  { key: 'wedding', Icon: HeartIcon, accent: 'var(--mk-wedding)', soft: 'var(--mk-wedding-soft)', className: styles.cardTopLeft },
  { key: 'funeral', Icon: BookOpenIcon, accent: 'var(--mk-funeral)', soft: 'var(--mk-funeral-soft)', className: styles.cardTopRight },
  { key: 'general', Icon: CalendarDaysIcon, accent: 'var(--mk-general)', soft: 'var(--mk-general-soft)', className: styles.cardBottomLeft },
  { key: 'mail', Icon: MailIcon, accent: 'var(--mk-primary)', soft: 'var(--mk-primary-soft)', className: styles.cardBottomRight },
] as const;

/**
 * Figma Make `DesktopEmailStartScreen` BackgroundDecorations — 인증 카드 배경의
 * 장식용 미니 초대장 카드 4장. 데스크톱 전용이며 상호작용하지 않는다.
 */
export default function InvitationDecorativeCards() {
  return (
    <div className={styles.root} aria-hidden="true">
      {CARDS.map(({ key, Icon, accent, soft, className }) => (
        <div key={key} className={`${styles.card} ${className}`}>
          <span className={styles.iconWrap} style={{ background: soft, color: accent }}>
            <Icon size={20} />
          </span>
          <span className={styles.lineWide} />
          <span className={styles.lineNarrow} />
        </div>
      ))}
    </div>
  );
}
