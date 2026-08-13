'use client';
/* eslint-disable i18next/no-literal-string */

/**
 * WEDDING 05 — Romantic Garden
 * 아치 히어로 + 편지형 인사말 + 폴라로이드 갤러리.
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
import styles from './WeddingGardenInvitation.module.css';

function PersonCard({
  person,
  offset,
  contactLabel,
}: {
  person: TemplatePerson;
  offset: boolean;
  contactLabel: string;
}) {
  return (
    <div className={`${styles.personCard} ${offset ? styles.personCardOffset : ''}`.trim()}>
      <div className={styles.personFrame}>
        <ImageWithFallback
          className={styles.personImage}
          src={person.image || null}
          alt=""
          fallback={<span className={styles.personInitial}>{person.name.slice(0, 1) || person.role}</span>}
        />
      </div>
      <p className={styles.personRole}>{person.role}</p>
      {person.name ? <p className={styles.personName}>{person.name}</p> : null}
      {person.parentsText ? <p className={styles.personMeta}>{person.parentsText}</p> : null}
      {person.phone ? (
        <a className={styles.personPill} href={toTelHref(person.phone)}>
          {contactLabel}
        </a>
      ) : null}
    </div>
  );
}

export default function WeddingGardenInvitation(props: VisualTemplateProps) {
  const { data, invitationSlug = '' } = props;
  const model = buildTemplateInvitationModel(data);
  const flags = resolveTemplateRenderFlags(props);
  const t = (key: string) => invitationT(model.locale, key);

  const showHeroMedia = Boolean(model.heroImage) || flags.showEmptyPlaceholder;

  return (
    <div
      className={styles.page}
      data-testid="public-invitation-document"
      data-visual-template="WEDDING_05_GARDEN"
      data-concept={model.conceptType}
    >
      <section className={styles.hero} data-section-id="hero" data-preview-section="hero">
        {showHeroMedia ? (
          <InvitationReveal variant="blur">
            <div className={styles.arch}>
              <ImageWithFallback
                className={styles.archImage}
                src={model.heroImage || null}
                alt=""
                loading="eager"
                fallback={<div className={styles.archPlaceholder}>{t('invitation.placeholder.hero')}</div>}
              />
            </div>
          </InvitationReveal>
        ) : null}
        <InvitationReveal variant="rise" delayMs={120}>
          <p className={styles.eyebrow}>{t('invitation.placeholder.weddingHeadline')}</p>
          <h1 className={styles.title}>{model.title}</h1>
          <span className={styles.leaf} aria-hidden />
          {model.dateText ? <p className={styles.heroDate}>{model.dateText}</p> : null}
          {model.venueName ? <p className={styles.heroVenue}>{model.venueName}</p> : null}
        </InvitationReveal>
      </section>

      {model.hasGreeting || flags.showEmptyPlaceholder ? (
        <section className={styles.letter} data-section-id="greeting" data-preview-section="greeting">
          <InvitationReveal variant="blur">
            <div className={styles.letterCard}>
              <p className={styles.sectionLabel}>{t('invitation.section.greeting')}</p>
              {model.hasGreeting ? (
                model.greetingLines.map((line, index) => (
                  <p key={`greeting-${index}`} className={styles.letterLine}>
                    {line}
                  </p>
                ))
              ) : (
                <p className={styles.placeholder}>{t('invitation.placeholder.greeting')}</p>
              )}
            </div>
          </InvitationReveal>
        </section>
      ) : null}

      {model.hasCouple ? (
        <section className={styles.people} data-section-id="couple" data-preview-section="couple">
          <InvitationReveal variant="rise">
            <p className={styles.sectionLabel}>{t('invitation.section.couple')}</p>
          </InvitationReveal>
          <div className={styles.peopleGrid}>
            {model.groom ? (
              <InvitationReveal variant="slideLeft" delayMs={80}>
                <PersonCard person={model.groom} offset={false} contactLabel={t('invitation.action.contact')} />
              </InvitationReveal>
            ) : null}
            {model.bride ? (
              <InvitationReveal variant="slideRight" delayMs={200}>
                <PersonCard person={model.bride} offset contactLabel={t('invitation.action.contact')} />
              </InvitationReveal>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className={styles.schedule} data-section-id="schedule" data-preview-section="schedule">
        <InvitationReveal variant="rise">
          <p className={styles.sectionLabel}>{t('invitation.section.ceremony')}</p>
          <p className={styles.scheduleDate}>{model.dateText || t('invitation.placeholder.schedule')}</p>
        </InvitationReveal>
        <InvitationReveal variant="fade" delayMs={120}>
          <TemplateDateGrid
            variant="garden"
            eventDate={data.eventDate}
            weddingDate={data.weddingDate}
            weddingDateTime={data.weddingDateTime}
            className={styles.dateGrid}
          />
        </InvitationReveal>
        {model.scheduleLines.map((line, index) => (
          <p key={`schedule-${index}`} className={styles.scheduleNote}>
            {line}
          </p>
        ))}
        {model.venueName ? (
          <InvitationReveal variant="rise" delayMs={200}>
            <p className={styles.ribbon}>{model.venueName}</p>
            {model.venueDetail ? <p className={styles.ribbonDetail}>{model.venueDetail}</p> : null}
          </InvitationReveal>
        ) : null}
      </section>

      {model.gallery.hasItems ? (
        <VisualTemplateGallery
          visualTemplateId="WEDDING_05_GARDEN"
          items={model.gallery.items}
          displayMode={model.gallery.displayMode}
          sectionLabel={t('invitation.section.ourMoments')}
          labelClassName={styles.sectionLabel}
          lockBodyScroll={flags.isPublic}
        />
      ) : flags.showEmptyPlaceholder ? (
        <section className={styles.gallery} data-section-id="gallery" data-preview-section="gallery">
          <p className={styles.placeholder}>{t('invitation.placeholder.gallery')}</p>
        </section>
      ) : null}

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
        <span className={styles.leaf} aria-hidden />
        <p className={styles.footerMark}>{model.dateText}</p>
      </footer>
    </div>
  );
}
