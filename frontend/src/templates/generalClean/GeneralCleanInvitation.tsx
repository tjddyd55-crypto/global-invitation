'use client';
/* eslint-disable i18next/no-literal-string */

/**
 * GENERAL 04 — Clean Event
 * 제목·일정 정보를 먼저 전달하는 모듈형 브로슈어 레이아웃.
 */
import { type CSSProperties } from 'react';
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
import styles from './GeneralCleanInvitation.module.css';

type Fact = { label: string; value: string };

function buildFacts(date: string, venue: string, detail: string, t: (key: string) => string): Fact[] {
  return [
    { label: t('invitation.common.date'), value: date },
    { label: t('invitation.common.place'), value: venue },
    { label: t('invitation.common.info'), value: detail },
  ].filter((fact) => Boolean(fact.value));
}

export default function GeneralCleanInvitation(props: VisualTemplateProps) {
  const { data, invitationSlug = '' } = props;
  const model = buildTemplateInvitationModel(data);
  const flags = resolveTemplateRenderFlags(props);
  const t = (key: string) => invitationT(model.locale, key);

  const facts = buildFacts(model.dateText, model.venueName, model.venueDetail, t);
  const showHeroMedia = Boolean(model.heroImage) || flags.showEmptyPlaceholder;

  return (
    <div
      className={styles.page}
      data-testid="public-invitation-document"
      data-visual-template="GENERAL_04_CLEAN"
      data-concept={model.conceptType}
    >
      <section className={styles.hero} data-section-id="hero" data-preview-section="hero">
        <InvitationReveal variant="fade">
          <p className={styles.eyebrow}>INVITATION</p>
          <h1 className={styles.title}>{model.title}</h1>
          {model.subtitle ? <p className={styles.subtitle}>{model.subtitle}</p> : null}
          <span className={styles.rule} aria-hidden />
        </InvitationReveal>
      </section>

      {facts.length > 0 || flags.showEmptyPlaceholder ? (
        <section className={styles.facts} data-section-id="basic" data-preview-section="basic">
          <InvitationReveal variant="fade" delayMs={80}>
            {facts.length > 0 ? (
              <dl className={styles.factGrid}>
                {facts.map((fact, index) => (
                  <div
                    key={fact.label}
                    className={styles.factCell}
                    style={{ '--fact-index': index } as CSSProperties}
                  >
                    <dt className={styles.factLabel}>{fact.label}</dt>
                    <dd className={styles.factValue}>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className={styles.placeholder}>{t('invitation.placeholder.eventSchedule')}</p>
            )}
          </InvitationReveal>
        </section>
      ) : null}

      {showHeroMedia ? (
        <InvitationReveal variant="fade">
          <figure className={styles.banner}>
            <ImageWithFallback
              className={styles.bannerImage}
              src={model.heroImage || null}
              alt=""
              loading="eager"
              fallback={<div className={styles.bannerPlaceholder}>{t('invitation.placeholder.hero')}</div>}
            />
          </figure>
        </InvitationReveal>
      ) : null}

      {model.hasGreeting || flags.showEmptyPlaceholder ? (
        <section className={styles.copy} data-section-id="greeting" data-preview-section="greeting">
          <InvitationReveal variant="fade">
            <h2 className={styles.sectionTitle}>{t('invitation.section.notice')}</h2>
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

      <section className={styles.schedule} data-section-id="schedule" data-preview-section="schedule">
        <InvitationReveal variant="fade">
          <h2 className={styles.sectionTitle}>{t('invitation.section.eventSchedule')}</h2>
          <p className={styles.scheduleDate}>{model.dateText || t('invitation.placeholder.schedule')}</p>
        </InvitationReveal>
        <InvitationReveal variant="fade" delayMs={100}>
          <TemplateDateGrid
            variant="clean"
            eventDate={data.eventDate}
            weddingDate={data.weddingDate}
            weddingDateTime={data.weddingDateTime}
            className={styles.dateGrid}
          />
        </InvitationReveal>
        {model.scheduleLines.length > 0 ? (
          <ul className={styles.scheduleList}>
            {model.scheduleLines.map((line, index) => (
              <li key={`schedule-${index}`}>{line}</li>
            ))}
          </ul>
        ) : null}
      </section>

      {model.gallery.hasItems ? (
        <VisualTemplateGallery
          visualTemplateId="GENERAL_04_CLEAN"
          items={model.gallery.items}
          displayMode={model.gallery.displayMode}
          sectionLabel={t('invitation.gallery.pastRecords')}
          labelClassName={styles.sectionTitle}
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
            sectionTitle={t('invitation.map.directionsTitle')}
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
            transportTitle={t('invitation.map.transport')}
            transportInfo={model.transportInfo}
            parkingTitle={t('invitation.map.parking')}
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
        <p className={styles.footerMark}>{model.dateCompact || 'EVENT'}</p>
      </footer>
    </div>
  );
}
