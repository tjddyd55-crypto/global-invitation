/* eslint-disable i18next/no-literal-string */

import { HeartIcon, BookOpenIcon, CalendarDaysIcon } from '@/src/ui/icons/ConceptIcons';
import styles from './InvitationDecorativeCards.module.css';

const CARDS = [
  {
    key: 'wedding',
    Icon: HeartIcon,
    title: '이준혁 ♥ 김지은',
    badge: '결혼식',
    color: '#BE185D',
    bg: '#FDF2F8',
    className: styles.cardWedding,
  },
  {
    key: 'general-left',
    Icon: CalendarDaysIcon,
    title: '2025 연간 발표회',
    badge: '일반 행사',
    color: '#1D4ED8',
    bg: '#EFF6FF',
    className: styles.cardGeneralLeft,
  },
  {
    key: 'funeral',
    Icon: BookOpenIcon,
    title: '故 홍길동 님',
    badge: '부고장',
    color: '#374151',
    bg: '#F9FAFB',
    className: styles.cardFuneral,
  },
  {
    key: 'general-right',
    Icon: CalendarDaysIcon,
    title: '봄 정기 모임',
    badge: '일반 행사',
    color: '#1D4ED8',
    bg: '#EFF6FF',
    className: styles.cardGeneralRight,
  },
] as const;

/**
 * Figma Make `DesktopEmailStartScreen` BackgroundDecorations.
 * 장식용 미니 초대장 카드 4장 — 클릭 불가.
 */
export default function InvitationDecorativeCards() {
  return (
    <div className={styles.root} aria-hidden="true" data-testid="auth-decorative-cards">
      {CARDS.map(({ key, Icon, title, badge, color, bg, className }) => (
        <div key={key} className={`${styles.card} ${className}`}>
          <div className={styles.cardHead}>
            <Icon size={14} style={{ color }} />
            <span className={styles.badge} style={{ color, background: bg }}>
              {badge}
            </span>
          </div>
          <p className={styles.title}>{title}</p>
          <div className={styles.bars}>
            <span />
            <span />
            <span />
          </div>
        </div>
      ))}
    </div>
  );
}
