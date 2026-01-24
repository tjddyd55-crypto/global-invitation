'use client';

import styles from './FuneralClassicInvitation.module.css';
import type { FuneralInvitation } from './data';

type FuneralClassicInvitationProps = {
  data: FuneralInvitation;
  onCopyLink?: () => void;
  onKakaoShare?: () => void;
};

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function FuneralClassicInvitation({ data, onCopyLink, onKakaoShare }: FuneralClassicInvitationProps) {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        {data.heroImage && <img className={styles.heroImage} src={data.heroImage} alt="funeral hero" />}
        <div className={styles.heroTitle}>謹 弔</div>
        <div className={styles.heroName}>故 {data.deceasedName} 님</div>
        <div className={styles.heroMeta}>
          {data.birthDate && <span>{formatDate(data.birthDate)} 生 · </span>}
          <span>{formatDate(data.deathDate)} 별세</span>
        </div>
        <div className={styles.heroNotice}>삼가 고인의 명복을 빕니다.</div>
        <div className={styles.heroSubNotice}>별세하셨음을 삼가 알려드립니다.</div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>알리는 글</div>
        <div className={styles.message}>{data.message}</div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>상주 정보</div>
        <div className={styles.infoList}>
          <div>
            <span className={styles.label}>상주</span>
            {data.chiefMourner}
          </div>
        </div>
        {data.familyMembers && data.familyMembers.length > 0 && (
          <div className={styles.familyList}>
            {data.familyMembers.map((member) => (
              <div key={member}>{member}</div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>장례 일정</div>
        <div className={styles.scheduleGrid}>
          {data.schedule.wakeStart && (
            <div>
              <span className={styles.label}>빈소</span>
              {formatDateTime(data.schedule.wakeStart)}
            </div>
          )}
          <div>
            <span className={styles.label}>발인/장례식</span>
            {formatDateTime(data.schedule.funeralDate)}
          </div>
          {data.schedule.burial && (
            <div>
              <span className={styles.label}>장지</span>
              {data.schedule.burial}
            </div>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>장례식장</div>
        <div className={styles.hallBlock}>
          <div>{data.funeralHall.name}</div>
          <div>{data.funeralHall.address}</div>
        </div>
        {data.funeralHall.mapImage && (
          <img className={styles.mapImage} src={data.funeralHall.mapImage} alt="map" />
        )}
      </section>

      {data.contact && (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>연락처</div>
          <div className={styles.contactCard}>
            <div>{data.contact.name}</div>
            <div>{data.contact.phone}</div>
          </div>
        </section>
      )}

      <section className={styles.shareSection}>
        <div className={styles.sectionTitle}>공유하기</div>
        <div className={styles.shareButtons}>
          <button type="button" className={styles.shareButton} onClick={onCopyLink}>
            링크 복사
          </button>
          <button type="button" className={`${styles.shareButton} ${styles.shareButtonPrimary}`} onClick={onKakaoShare}>
            카카오 공유
          </button>
        </div>
        <div className={styles.shareHint}>공유 버튼은 서비스 준비 단계에서 stub 상태입니다.</div>
      </section>
    </div>
  );
}
