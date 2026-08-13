'use client';
/* eslint-disable i18next/no-literal-string */

/**
 * GENERAL 05 — Festive Color
 * 포스터형 히어로 + 스크랩북 갤러리 + 티켓형 안내.
 */
import ImageWithFallback from '@/src/components/media/ImageWithFallback';
import InvitationAccountsSection from '@/src/templates/shared/InvitationAccountsSection';
import InvitationRsvpSection from '@/src/templates/shared/InvitationRsvpSection';
import LocationMapSection from '@/src/templates/shared/LocationMapSection';
import TemplateDateGrid from '@/src/templates/shared/TemplateDateGrid';
import { InvitationReveal } from '@/src/templates/shared/motion/InvitationReveal';
import {
  buildTemplateInvitationModel,
  resolveTemplateRenderFlags,
  type VisualTemplateProps,
} from '@/src/templates/shared/templateInvitationModel';
import VisualTemplateGallery from '@/src/templates/visualGallery/VisualTemplateGallery';
import { invitationT } from '@/src/i18n/invitationT';
import styles from './GeneralFestiveInvitation.module.css';

export default function GeneralFestiveInvitation(props: VisualTemplateProps) {
  const { data, invitationSlug = '' } = props;
  const model = buildTemplateInvitationModel(data);
  const flags = resolveTemplateRenderFlags(props);
  const t = (key: string) => invitationT(model.locale, key);
  const weekdayChip =
    model.locale === 'en-US' ? model.dateParts?.weekdayEn : model.dateParts?.weekday;

  const showHeroMedia = Boolean(model.heroImage) || flags.showEmptyPlaceholder;
  const chips = [model.dateText, model.venueName, model.venueDetail].filter(Boolean);

  return (
    <div
      className={styles.page}
      data-testid="public-invitation-document"
      data-visual-template="GENERAL_05_FESTIVE"
      data-concept={model.conceptType}
    >
      <section className={styles.hero} data-section-id="hero" data-preview-section="hero">
        <span className={`${styles.shape} ${styles.shapeOne}`} aria-hidden />
        <span className={`${styles.shape} ${styles.shapeTwo}`} aria-hidden />
        {showHeroMedia ? (
          <div className={styles.photo}>
            <ImageWithFallback
              className={styles.photoImage}
              src={model.heroImage || null}
              alt=""
              loading="eager"
              fallback={<div className={styles.photoPlaceholder}>{t('invitation.placeholder.hero')}</div>}
            />
          </div>
        ) : null}
        <h1 className={styles.title}>{model.title}</h1>
        {model.subtitle ? <p className={styles.subtitle}>{model.subtitle}</p> : null}
        {model.dateParts ? (
          <p className={styles.sticker}>
            <span className={styles.stickerMonth}>{`${model.dateParts.month}.${model.dateParts.day}`}</span>
            <span className={styles.stickerWeekday}>{weekdayChip}</span>
          </p>
        ) : null}
      </section>

      {chips.length > 0 || flags.showEmptyPlaceholder ? (
        <section className={styles.basic} data-section-id="basic" data-preview-section="basic">
          {chips.length > 0 ? (
            <div className={styles.chipRow}>
              {chips.map((chip) => (
                <span key={chip} className={styles.chip}>
                  {chip}
                </span>
              ))}
            </div>
          ) : (
            <p className={styles.placeholder}>{t('invitation.placeholder.eventSchedule')}</p>
          )}
        </section>
      ) : null}

      {model.hasGreeting || flags.showEmptyPlaceholder ? (
        <section className={styles.copy} data-section-id="greeting" data-preview-section="greeting">
          <InvitationReveal variant="rise">
            <h2 className={styles.sectionTitle}>{t('invitation.defaults.inviteTitle')}</h2>
            {model.hasGreeting ? (
              model.greetingLines.map((line, index) => (
                <p key={`greeting-${index}`} className={styles.copyLine}>
                  {line}
                </p>
              ))
            ) : (
              <p className={styles.placeholder}>{t('invitation.placeholder.notice')}</p>
            )}
          </InvitationReveal>
        </section>
      ) : null}

      {model.gallery.hasItems ? (
        <VisualTemplateGallery
          visualTemplateId="GENERAL_05_FESTIVE"
          items={model.gallery.items}
          displayMode={model.gallery.displayMode}
          sectionLabel={t('invitation.section.snap')}
          labelClassName={styles.sectionTitle}
          lockBodyScroll={flags.isPublic}
        />
      ) : flags.showEmptyPlaceholder ? (
        <section className={styles.gallery} data-section-id="gallery" data-preview-section="gallery">
          <p className={styles.placeholder}>{t('invitation.placeholder.gallery')}</p>
        </section>
      ) : null}

      <section className={styles.schedule} data-section-id="schedule" data-preview-section="schedule">
        <InvitationReveal variant="rise">
          <h2 className={styles.sectionTitle}>{t('invitation.section.eventSchedule')}</h2>
          <p className={styles.scheduleDate}>{model.dateText || t('invitation.placeholder.schedule')}</p>
        </InvitationReveal>
        <InvitationReveal variant="fade" delayMs={100}>
          <div className={styles.calendarCard}>
            <TemplateDateGrid
              variant="festive"
              eventDate={data.eventDate}
              weddingDate={data.weddingDate}
              weddingDateTime={data.weddingDateTime}
              locale={model.locale}
              className={styles.dateGrid}
            />
          </div>
        </InvitationReveal>
      </section>

      {model.hasLocation || flags.showEmptyPlaceholder ? (
        <section className={styles.location} data-section-id="location" data-preview-section="location">
          <LocationMapSection
            sectionTitle={t('invitation.defaults.directions')}
            title={model.venueName}
            address={model.address}
            detailAddress={model.detailAddress || undefined}
            invitationData={data}
            googlePlaceId={data.googlePlaceId}
            mapLat={data.mapLat}
            mapLng={data.mapLng}
            mapProvider={data.mapProvider}
            naverPlaceId={data.naverPlaceId}
            naverMapUrl={data.naverMapUrl}
            mapImage={data.mapImage}
            tone="light"
            previewMode={flags.previewMode}
            transportTitle={t('invitation.defaults.directions')}
            transportInfo={model.transportInfo}
            parkingTitle={t('invitation.defaults.parking')}
            parkingInfo={model.parkingInfo}
          />
        </section>
      ) : null}

      {model.showAccounts ? (
        <div className={styles.ticketWrap}>
          <div className={styles.ticket}>
            <span className={styles.ticketLabel}>TICKET</span>
            <p className={styles.ticketTitle}>{model.title}</p>
            {model.dateText ? <p className={styles.ticketMeta}>{model.dateText}</p> : null}
          </div>
          <InvitationAccountsSection
            accounts={data.accounts}
            conceptType={model.conceptType}
            accountsTitle={data.accountsTitle}
            className={styles.accounts}
          />
        </div>
      ) : flags.showEmptyPlaceholder ? (
        <section
          className={styles.accountsEmpty}
          data-section-id="accounts"
          data-preview-section="accounts"
        >
          <p className={styles.placeholder}>{t('invitation.placeholder.accounts')}</p>
        </section>
      ) : null}

      <InvitationRsvpSection
        data={data}
        conceptType={model.conceptType}
        invitationSlug={invitationSlug}
        previewMode={flags.previewMode}
        className={styles.rsvp}
      />

      <section data-section-id="music" data-preview-section="music" className={styles.anchor} aria-hidden />
      <section data-section-id="share" data-preview-section="share" className={styles.anchor} aria-hidden />
    </div>
  );
}
