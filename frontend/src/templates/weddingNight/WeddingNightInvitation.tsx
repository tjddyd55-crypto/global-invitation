'use client';
/* eslint-disable i18next/no-literal-string */

/**
 * WEDDING 06 — Minimal Night
 * 다크 시네마틱 히어로 + 가로 필름 갤러리.
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
  toTelHref,
  type TemplatePerson,
  type VisualTemplateProps,
} from '@/src/templates/shared/templateInvitationModel';
import VisualTemplateGallery from '@/src/templates/visualGallery/VisualTemplateGallery';
import { invitationT } from '@/src/i18n/invitationT';
import styles from './WeddingNightInvitation.module.css';

function ContactLine({ person, contactLabel }: { person: TemplatePerson; contactLabel: string }) {
  return (
    <div className={styles.contactLine}>
      <span className={styles.contactRole}>{person.role}</span>
      <span className={styles.contactName}>{person.name}</span>
      {person.phone ? (
        <a className={styles.contactLink} href={toTelHref(person.phone)}>
          {contactLabel}
        </a>
      ) : null}
    </div>
  );
}

export default function WeddingNightInvitation(props: VisualTemplateProps) {
  const { data, invitationSlug = '' } = props;
  const model = buildTemplateInvitationModel(data);
  const flags = resolveTemplateRenderFlags(props);
  const t = (key: string) => invitationT(model.locale, key);

  const showHeroMedia = Boolean(model.heroImage) || flags.showEmptyPlaceholder;

  return (
    <div
      className={styles.page}
      data-testid="public-invitation-document"
      data-visual-template="WEDDING_06_NIGHT"
      data-concept={model.conceptType}
    >
      <section className={styles.hero} data-section-id="hero" data-preview-section="hero">
        {showHeroMedia ? (
          <div className={styles.heroMedia}>
            <ImageWithFallback
              className={styles.heroImage}
              src={model.heroImage || null}
              alt=""
              loading="eager"
              fallback={<div className={styles.heroPlaceholder}>{t('invitation.placeholder.hero')}</div>}
            />
            <span className={styles.heroScrim} aria-hidden />
          </div>
        ) : null}
        <div className={styles.heroText}>
          <InvitationReveal variant="mask" delayMs={120}>
            <h1 className={styles.title}>{model.title}</h1>
          </InvitationReveal>
          {model.dateCompact ? (
            <InvitationReveal variant="rise" delayMs={280}>
              <p className={styles.heroDate}>{model.dateCompact}</p>
            </InvitationReveal>
          ) : null}
          {model.venueName ? (
            <InvitationReveal variant="rise" delayMs={360}>
              <p className={styles.heroVenue}>{model.venueName}</p>
            </InvitationReveal>
          ) : null}
        </div>
      </section>

      {model.hasGreeting || model.subtitle || flags.showEmptyPlaceholder ? (
        <section className={styles.intro} data-section-id="greeting" data-preview-section="greeting">
          <InvitationReveal variant="rise">
            {model.subtitle ? <p className={styles.introQuote}>{model.subtitle}</p> : null}
            <InvitationReveal variant="draw" delayMs={160}>
              <span className={styles.hairline} aria-hidden />
            </InvitationReveal>
            {model.hasGreeting ? (
              model.greetingLines.map((line, index) => (
                <p key={`greeting-${index}`} className={styles.introLine}>
                  {line}
                </p>
              ))
            ) : (
              <p className={styles.placeholder}>{t('invitation.placeholder.greeting')}</p>
            )}
          </InvitationReveal>
        </section>
      ) : null}

      {model.hasCouple ? (
        <section className={styles.couple} data-section-id="couple" data-preview-section="couple">
          <InvitationReveal variant="fade">
            <p className={styles.sectionLabel}>{t('invitation.section.couple')}</p>
            {model.groom ? <ContactLine person={model.groom} contactLabel={t('invitation.action.contact')} /> : null}
            {model.bride ? <ContactLine person={model.bride} contactLabel={t('invitation.action.contact')} /> : null}
          </InvitationReveal>
        </section>
      ) : null}

      {model.gallery.hasItems ? (
        <VisualTemplateGallery
          visualTemplateId="WEDDING_06_NIGHT"
          items={model.gallery.items}
          displayMode={model.gallery.displayMode}
          sectionLabel="FILM"
          labelClassName={styles.sectionLabel}
          lockBodyScroll={flags.isPublic}
        />
      ) : flags.showEmptyPlaceholder ? (
        <section className={styles.film} data-section-id="gallery" data-preview-section="gallery">
          <p className={styles.placeholder}>{t('invitation.placeholder.gallery')}</p>
        </section>
      ) : null}

      {model.hasLocation || flags.showEmptyPlaceholder ? (
        <section className={styles.location} data-section-id="location" data-preview-section="location">
          <InvitationReveal variant="rise">
            <p className={styles.sectionLabel}>VENUE</p>
            {model.venueName ? <p className={styles.venueName}>{model.venueName}</p> : null}
            {model.venueDetail ? <p className={styles.venueDetail}>{model.venueDetail}</p> : null}
          </InvitationReveal>
          <LocationMapSection
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
            tone="dark"
            previewMode={flags.previewMode}
            transportTitle={t('invitation.map.transport')}
            transportInfo={model.transportInfo}
            parkingTitle={t('invitation.map.parking')}
            parkingInfo={model.parkingInfo}
          />
        </section>
      ) : null}

      <section className={styles.calendar} data-section-id="schedule" data-preview-section="schedule">
        <InvitationReveal variant="fade">
          <p className={styles.sectionLabel}>DATE</p>
          <p className={styles.calendarDate}>{model.dateText || t('invitation.placeholder.schedule')}</p>
        </InvitationReveal>
        <InvitationReveal variant="fade" delayMs={120}>
          <TemplateDateGrid
            variant="night"
            eventDate={data.eventDate}
            weddingDate={data.weddingDate}
            weddingDateTime={data.weddingDateTime}
            locale={model.locale}
            className={styles.dateGrid}
          />
        </InvitationReveal>
      </section>

      {model.showAccounts ? (
        <InvitationAccountsSection
          accounts={data.accounts}
          conceptType={model.conceptType}
          accountsTitle={data.accountsTitle}
          className={styles.accounts}
        />
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

      <footer className={styles.footer}>
        <p className={styles.footerMark}>
          <span className={styles.musicRing} aria-hidden />
          {model.dateCompact || 'WEDDING'}
        </p>
      </footer>
    </div>
  );
}
