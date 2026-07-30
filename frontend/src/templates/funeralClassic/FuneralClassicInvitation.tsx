'use client';

import styles from './FuneralClassicInvitation.module.css';
import type { FuneralInvitationData } from '@/src/invitation/schemas';
import LocationMapSection from '@/src/templates/shared/LocationMapSection';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';
import { formatDate, formatDateTime } from '@/src/lib/i18n/format';
import { cdnImageSrc } from '@/src/lib/image';
import InvitationCommentsSection from '@/src/features/comments/ui/InvitationCommentsSection';
import InvitationRsvpSection from '@/src/templates/shared/InvitationRsvpSection';

type FuneralClassicInvitationProps = {
  data: FuneralInvitationData;
  invitationSlug?: string;
  previewMode?: boolean;
  onShare?: () => void;
  isShared?: boolean;
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

export default function FuneralClassicInvitation({
  data,
  invitationSlug,
  previewMode = false,
  onShare,
  isShared = false,
  onKakaoShare,
}: FuneralClassicInvitationProps) {
  const { t, language } = useI18n();
  const heroNamePrefix = t(I18N_KEYS.funeral.heroNamePrefix);
  const heroNameSuffix = t(I18N_KEYS.funeral.heroNameSuffix);
  const hasLocation = Boolean(
    data.funeralHall?.address || (data.funeralHall?.mapLat != null && data.funeralHall?.mapLng != null)
  );

  return (
    <div className={styles.page} data-testid="public-invitation-document" data-concept="FUNERAL">
      <section
        className={styles.hero}
        data-testid="public-hero"
        data-section-id="hero"
        data-preview-section="hero"
      >
        {data.heroImage && (
          <img
            className={styles.heroImage}
            src={cdnImageSrc(data.heroImage)}
            alt={t(I18N_KEYS.funeral.heroImageAlt)}
            loading="eager"
            fetchPriority="high"
          />
        )}
        <div className={styles.heroCopy}>
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
        </div>
      </section>

      <section className={styles.section} data-section-id="greeting" data-preview-section="greeting">
        <div className={styles.sectionTitle}>{t(I18N_KEYS.funeral.sectionMessage)}</div>
        <div className={styles.message}>{data.message}</div>
      </section>

      <section className={styles.section} data-section-id="deceased" data-preview-section="deceased">
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

      <section className={styles.section} data-section-id="schedule" data-preview-section="schedule">
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
        <section
          className={styles.locationSection}
          data-section-id="location"
          data-preview-section="location"
        >
          <LocationMapSection
            sectionTitle={t(I18N_KEYS.funeral.sectionHallLocation)}
            title={data.funeralHall.name}
            address={data.funeralHall.address}
            mapLat={data.funeralHall.mapLat}
            mapLng={data.funeralHall.mapLng}
            mapImage={data.funeralHall.mapImage}
            mapImageAlt={t(I18N_KEYS.common.mapAlt)}
            invitationData={data}
            previewMode={Boolean(previewMode)}
          />
        </section>
      )}

      <InvitationRsvpSection
        data={data}
        conceptType="FUNERAL"
        invitationSlug={invitationSlug}
        previewMode={previewMode || !invitationSlug}
      />

      <InvitationCommentsSection
        invitationSlug={invitationSlug}
        conceptType="FUNERAL"
        enabled
        previewMode={previewMode || !invitationSlug}
      />

      {data.contact && (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>{t(I18N_KEYS.funeral.sectionContact)}</div>
          <div className={styles.contactCard}>
            <div>{data.contact.name}</div>
            <div>{data.contact.phone}</div>
          </div>
        </section>
      )}

      <section
        data-section-id="music"
        data-preview-section="music"
        aria-hidden
        style={{ height: 1, margin: 0, padding: 0, border: 0, overflow: 'hidden' }}
      />

      {(onShare || onKakaoShare) ? (
        <section
          className={styles.shareSection}
          data-section-id="share"
          data-preview-section="share"
        >
          <div className={styles.sectionTitle}>{t(I18N_KEYS.funeral.sectionShare)}</div>
          <div className={styles.shareButtons}>
            {onShare && (
              <button
                type="button"
                className={`${styles.shareButton} ${styles.shareButtonPrimary}`}
                onClick={onShare}
              >
                {isShared ? t(I18N_KEYS.common.shared) : t(I18N_KEYS.common.share)}
              </button>
            )}
            {onKakaoShare && (
              <button type="button" className={styles.shareButton} onClick={onKakaoShare}>
                {t(I18N_KEYS.funeral.actionKakaoShare)}
              </button>
            )}
          </div>
          <div className={styles.shareHint}>{t(I18N_KEYS.funeral.shareHint)}</div>
        </section>
      ) : (
        <section
          data-section-id="share"
          data-preview-section="share"
          aria-hidden
          style={{ height: 1, margin: 0, padding: 0, border: 0, overflow: 'hidden' }}
        />
      )}
    </div>
  );
}
