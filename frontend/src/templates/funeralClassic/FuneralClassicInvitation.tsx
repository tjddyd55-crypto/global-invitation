'use client';

import styles from './FuneralClassicInvitation.module.css';
import type { FuneralInvitation } from './data';
import LocationMapSection from '@/src/templates/shared/LocationMapSection';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';

type FuneralClassicInvitationProps = {
  data: FuneralInvitation;
  onCopyLink?: () => void;
  onKakaoShare?: () => void;
};

function formatDate(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTime(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function FuneralClassicInvitation({ data, onCopyLink, onKakaoShare }: FuneralClassicInvitationProps) {
  const { t, language } = useI18n();
  const locale = language === 'ko' ? 'ko-KR' : language === 'mn' ? 'mn-MN' : 'en-US';
  const heroNamePrefix = t(I18N_KEYS.funeral.heroNamePrefix);
  const heroNameSuffix = t(I18N_KEYS.funeral.heroNameSuffix);
  const hasLocation = Boolean(
    data.funeralHall?.address || (data.funeralHall?.mapLat != null && data.funeralHall?.mapLng != null)
  );

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        {data.heroImage && <img className={styles.heroImage} src={data.heroImage} alt="funeral hero" />}
        <div className={styles.heroTitle}>{t(I18N_KEYS.funeral.heroTitle)}</div>
        <div className={styles.heroName}>
          {heroNamePrefix} {data.deceasedName}
          {heroNameSuffix ? ` ${heroNameSuffix}` : ''}
        </div>
        <div className={styles.heroMeta}>
          {data.birthDate && (
            <span>
              {formatDate(data.birthDate, locale)} {t(I18N_KEYS.funeral.birthSuffix)} ·{' '}
            </span>
          )}
          <span>
            {formatDate(data.deathDate, locale)} {t(I18N_KEYS.funeral.deathSuffix)}
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
              <div key={member}>{member}</div>
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
              {formatDateTime(data.schedule.wakeStart, locale)}
            </div>
          )}
          <div>
            <span className={styles.label}>{t(I18N_KEYS.funeral.labelFuneral)}</span>
            {formatDateTime(data.schedule.funeralDate, locale)}
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
