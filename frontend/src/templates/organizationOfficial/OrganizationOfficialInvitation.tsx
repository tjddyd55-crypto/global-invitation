'use client';
/* eslint-disable i18next/no-literal-string */

/**
 * ORGANIZATION 01 — Official
 * Figma B hero: brand header → photo → title. Navy theme.
 * Shared sections: accounts, rsvp, map, VisualTemplateGallery.
 */
import { type CSSProperties } from 'react';
import ImageWithFallback from '@/src/components/media/ImageWithFallback';
import {
  DEFAULT_BRAND_ACCENT_COLOR,
  normalizeBrandAccentColor,
  normalizeOrganizationBranding,
} from '@/src/invitation/conceptTypes';
import InvitationAccountsSection from '@/src/templates/shared/InvitationAccountsSection';
import InvitationRsvpSection from '@/src/templates/shared/InvitationRsvpSection';
import LocationMapSection from '@/src/templates/shared/LocationMapSection';
import OrganizationBrandLogo from '@/src/templates/shared/OrganizationBrandLogo';
import TemplateDateGrid from '@/src/templates/shared/TemplateDateGrid';
import { InvitationReveal } from '@/src/templates/shared/motion/InvitationReveal';
import {
  buildTemplateInvitationModel,
  resolveTemplateRenderFlags,
  type VisualTemplateProps,
} from '@/src/templates/shared/templateInvitationModel';
import VisualTemplateGallery from '@/src/templates/visualGallery/VisualTemplateGallery';
import styles from './OrganizationOfficialInvitation.module.css';

type Fact = { label: string; value: string };

function buildFacts(date: string, venue: string, detail: string): Fact[] {
  return [
    { label: 'DATE', value: date },
    { label: 'PLACE', value: venue },
    { label: 'INFO', value: detail },
  ].filter((fact) => Boolean(fact.value));
}

export default function OrganizationOfficialInvitation(props: VisualTemplateProps) {
  const { data, invitationSlug = '' } = props;
  const model = buildTemplateInvitationModel(data);
  const flags = resolveTemplateRenderFlags(props);
  const organization = normalizeOrganizationBranding(
    (data as { organization?: unknown }).organization
  );
  const accent = normalizeBrandAccentColor(organization.accentColor || DEFAULT_BRAND_ACCENT_COLOR);
  const orgName = organization.name || '';
  const orgEnglish = organization.englishName || '';
  const facts = buildFacts(model.dateText, model.venueName, model.venueDetail);
  const showHeroMedia = Boolean(model.heroImage) || flags.showEmptyPlaceholder;

  return (
    <div
      className={styles.page}
      style={{ ['--brand-accent' as string]: accent } as CSSProperties}
      data-testid="public-invitation-document"
      data-visual-template="ORGANIZATION_01_OFFICIAL"
      data-concept={model.conceptType}
    >
      <header
        className={styles.brandHeader}
        data-section-id="organization"
        data-preview-section="organization"
      >
        <InvitationReveal variant="fade">
          <div className={styles.brandRow}>
            <OrganizationBrandLogo
              logo={organization.logo}
              name={orgName}
              englishName={orgEnglish}
              accentColor={accent}
              className={styles.brandLogo}
            />
            <div className={styles.brandText}>
              {orgName ? <p className={styles.orgName}>{orgName}</p> : null}
              {orgEnglish ? <p className={styles.orgEnglish}>{orgEnglish}</p> : null}
              {!orgName && !orgEnglish && flags.showEmptyPlaceholder ? (
                <p className={styles.placeholder}>기관명을 입력해 주세요</p>
              ) : null}
            </div>
          </div>
        </InvitationReveal>
      </header>

      {showHeroMedia ? (
        <InvitationReveal variant="fade">
          <figure className={styles.heroPhoto} data-section-id="hero" data-preview-section="hero">
            <ImageWithFallback
              className={styles.heroImage}
              src={model.heroImage || null}
              alt=""
              loading="eager"
              fallback={<div className={styles.heroPlaceholder}>대표 이미지를 추가해 주세요</div>}
            />
          </figure>
        </InvitationReveal>
      ) : null}

      <section className={styles.titleBlock} data-section-id="basic" data-preview-section="basic">
        <InvitationReveal variant="fade" delayMs={60}>
          <p className={styles.eyebrow}>OFFICIAL INVITATION</p>
          <h1 className={styles.title}>{model.title || (flags.showEmptyPlaceholder ? '행사 제목' : '')}</h1>
          {model.subtitle ? <p className={styles.subtitle}>{model.subtitle}</p> : null}
          <span className={styles.rule} aria-hidden />
        </InvitationReveal>
      </section>

      {facts.length > 0 || flags.showEmptyPlaceholder ? (
        <section className={styles.facts}>
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
              <p className={styles.placeholder}>행사 일정과 장소를 입력해 주세요</p>
            )}
          </InvitationReveal>
        </section>
      ) : null}

      {model.hasGreeting || flags.showEmptyPlaceholder ? (
        <section className={styles.copy} data-section-id="greeting" data-preview-section="greeting">
          <InvitationReveal variant="fade">
            <h2 className={styles.sectionTitle}>안내 말씀</h2>
            {model.hasGreeting ? (
              model.greetingLines.map((line, index) => (
                <p key={`greeting-${index}`} className={styles.copyLine}>
                  {line}
                </p>
              ))
            ) : (
              <p className={styles.placeholder}>안내 문구를 입력해 주세요</p>
            )}
          </InvitationReveal>
        </section>
      ) : null}

      <section className={styles.schedule} data-section-id="schedule" data-preview-section="schedule">
        <InvitationReveal variant="fade">
          <h2 className={styles.sectionTitle}>행사 일정</h2>
          <p className={styles.scheduleDate}>{model.dateText || '일정을 입력해 주세요'}</p>
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
          visualTemplateId="ORGANIZATION_01_OFFICIAL"
          items={model.gallery.items}
          displayMode={model.gallery.displayMode}
          sectionLabel="갤러리"
          labelClassName={styles.sectionTitle}
          lockBodyScroll={flags.isPublic}
          tone="general"
        />
      ) : flags.showEmptyPlaceholder ? (
        <section className={styles.gallery} data-section-id="gallery" data-preview-section="gallery">
          <p className={styles.placeholder}>갤러리 이미지를 추가해 주세요</p>
        </section>
      ) : null}

      {model.hasLocation || flags.showEmptyPlaceholder ? (
        <section className={styles.location} data-section-id="location" data-preview-section="location">
          <LocationMapSection
            sectionTitle="오시는 길"
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
            transportTitle="교통 안내"
            transportInfo={model.transportInfo}
            parkingTitle="주차 안내"
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
          <p className={styles.placeholder}>계좌 정보를 추가해 주세요</p>
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
        <p className={styles.footerMark}>{orgName || model.dateCompact || 'OFFICIAL'}</p>
      </footer>
    </div>
  );
}
