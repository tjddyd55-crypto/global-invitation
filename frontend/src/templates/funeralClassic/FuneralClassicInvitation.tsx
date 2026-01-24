'use client';

import styles from './FuneralClassicInvitation.module.css';
import type { FuneralInvitation } from './data';
import LocationMapSection from '@/src/templates/shared/LocationMapSection';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';
import { formatDate, formatDateTime } from '@/src/lib/i18n/format';

type FuneralClassicInvitationProps = {
  data: FuneralInvitation;
  onCopyLink?: () => void;
  onKakaoShare?: () => void;
};

const RELATIONSHIP_LABELS = [
  { term: '아들', key: I18N_KEYS.relationship.son },
  { term: '딸', key: I18N_KEYS.relationship.daughter },
  { term: '손자', key: I18N_KEYS.relationship.grandson },
  { term: '손녀', key: I18N_KEYS.relationship.granddaughter },
  { term: '사위', key: I18N_KEYS.relationship.sonInLaw },
  { term: '며느리', key: I18N_KEYS.relationship.daughterInLaw },
];

function canReplaceRelationship(member: string, term: string): boolean {
  if (!member.startsWith(term)) return false;
  const nextChar = member.charAt(term.length);
  return nextChar === '' || nextChar.trim() === '' || nextChar === '·' || nextChar === ':' || nextChar === '-';
}

function translateRelationship(member: string, t: (key: string) => string): string {
  for (const { term, key } of RELATIONSHIP_LABELS) {
    if (canReplaceRelationship(member, term)) {
      const rest = member.slice(term.length).trimStart();
      const translated = t(key);
      return rest ? `${translated} ${rest}` : translated;
    }
  }
  return member;
}

function formatDateValue(value: string | undefined, language: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatDate(language, date);
}

function formatDateTimeValue(value: string | undefined, language: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatDateTime(language, date);
}

export default function FuneralClassicInvitation({ data, onCopyLink, onKakaoShare }: FuneralClassicInvitationProps) {
  const { t, language } = useI18n();
  const heroNamePrefix = t(I18N_KEYS.funeral.heroNamePrefix);
  const heroNameSuffix = t(I18N_KEYS.funeral.heroNameSuffix);
  const hasLocation = Boolean(
    data.funeralHall?.address || (data.funeralHall?.mapLat != null && data.funeralHall?.mapLng != null)
  );

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        {data.heroImage && (
          <img className={styles.heroImage} src={data.heroImage} alt={t(I18N_KEYS.funeral.heroImageAlt)} />
        )}
        <div className={styles.heroTitle}>{t(I18N_KEYS.funeral.heroTitle)}</div>
        <div className={styles.heroName}>
          {heroNamePrefix} {data.deceasedName}
          {heroNameSuffix ? ` ${heroNameSuffix}` : ''}
        </div>
        <div className={styles.heroMeta}>
          {data.birthDate && (
            <span>
              {formatDateValue(data.birthDate, language)} {t(I18N_KEYS.funeral.birthSuffix)} ·{' '}
            </span>
          )}
          <span>
            {formatDateValue(data.deathDate, language)} {t(I18N_KEYS.funeral.deathSuffix)}
          </span>
        </div>
        <div className={styles.heroNotice}>{t(I18N_KEYS.funeral.heroNotice)}</div>
        <div className={styles.heroSubNotice}>{t(I18N_KEYS.funeral.heroSubNotice)}</div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>{t(I18N_KEYS.funeral.sectionMessage)}</div>
        <div className={styles.message}>{data.message}</div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>{t(I18N_KEYS.funeral.sectionFamily)}</div>
        <div className={styles.infoList}>
          <div>
            <span className={styles.label}>{t(I18N_KEYS.funeral.labelChiefMourner)}</span>
            {data.chiefMourner}
          </div>
        </div>
        {data.familyMembers && data.familyMembers.length > 0 && (
          <div className={styles.familyList}>
            {data.familyMembers.map((member) => (
              <div key={member}>{translateRelationship(member, t)}</div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>{t(I18N_KEYS.funeral.sectionSchedule)}</div>
        <div className={styles.scheduleGrid}>
          {data.schedule.wakeStart && (
            <div>
              <span className={styles.label}>{t(I18N_KEYS.funeral.labelWake)}</span>
              {formatDateTimeValue(data.schedule.wakeStart, language)}
            </div>
          )}
          <div>
            <span className={styles.label}>{t(I18N_KEYS.funeral.labelFuneral)}</span>
            {formatDateTimeValue(data.schedule.funeralDate, language)}
          </div>
          {data.schedule.burial && (
            <div>
              <span className={styles.label}>{t(I18N_KEYS.funeral.labelBurial)}</span>
              {data.schedule.burial}
            </div>
          )}
        </div>
      </section>

      {hasLocation && (
        <section className={styles.section}>
          <LocationMapSection
            sectionTitle={t(I18N_KEYS.funeral.sectionHallLocation)}
            title={data.funeralHall.name}
            address={data.funeralHall.address}
            mapImage={data.funeralHall.mapImage}
            mapImageAlt={t(I18N_KEYS.common.mapAlt)}
            navLabels={{
              tmap: t(I18N_KEYS.weddingClassic.navTmap),
              kakao: t(I18N_KEYS.weddingClassic.navKakao),
              naver: t(I18N_KEYS.weddingClassic.navNaver),
            }}
          />
        </section>
      )}

      {data.contact && (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>{t(I18N_KEYS.funeral.sectionContact)}</div>
          <div className={styles.contactCard}>
            <div>{data.contact.name}</div>
            <div>{data.contact.phone}</div>
          </div>
        </section>
      )}

      <section className={styles.shareSection}>
        <div className={styles.sectionTitle}>{t(I18N_KEYS.funeral.sectionShare)}</div>
        <div className={styles.shareButtons}>
          <button type="button" className={styles.shareButton} onClick={onCopyLink}>
            {t(I18N_KEYS.funeral.actionCopyLink)}
          </button>
          <button type="button" className={`${styles.shareButton} ${styles.shareButtonPrimary}`} onClick={onKakaoShare}>
            {t(I18N_KEYS.funeral.actionKakaoShare)}
          </button>
        </div>
        <div className={styles.shareHint}>{t(I18N_KEYS.funeral.shareHint)}</div>
      </section>
    </div>
  );
}
