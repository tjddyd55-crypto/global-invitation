'use client';
/* eslint-disable i18next/no-literal-string */

/**
 * WEDDING 04 — Modern Editorial
 * 매거진 편집 레이아웃. 데이터 정규화는 templateInvitationModel 이 담당하고
 * 이 파일은 레이아웃·모션만 기술한다.
 */
import ImageWithFallback from '@/src/components/media/ImageWithFallback';
import InvitationAccountsSection from '@/src/templates/shared/InvitationAccountsSection';
import InvitationRsvpSection from '@/src/templates/shared/InvitationRsvpSection';
import LocationMapSection from '@/src/templates/shared/LocationMapSection';
import TemplateDateGrid from '@/src/templates/shared/TemplateDateGrid';
import { InvitationReveal } from '@/src/templates/shared/motion/InvitationReveal';
import { useHeroParallax } from '@/src/templates/shared/motion/useHeroParallax';
import {
  buildTemplateInvitationModel,
  resolveTemplateRenderFlags,
  toTelHref,
  type TemplatePerson,
  type VisualTemplateProps,
} from '@/src/templates/shared/templateInvitationModel';
import VisualTemplateGallery from '@/src/templates/visualGallery/VisualTemplateGallery';
import { invitationT } from '@/src/i18n/invitationT';
import styles from './WeddingEditorialInvitation.module.css';

function ProfileRow({
  person,
  flip,
  contactLabel,
}: {
  person: TemplatePerson;
  flip: boolean;
  contactLabel: string;
}) {
  return (
    <div className={`${styles.profileRow} ${flip ? styles.profileRowFlip : ''}`.trim()}>
      {/* 이미지/텍스트 순서는 CSS order 로 뒤집는다 (RTL 을 쓰면 전화번호가 뒤집힌다) */}
      <div className={styles.profileFrame}>
        <ImageWithFallback
          className={styles.profileImage}
          src={person.image || null}
          alt=""
          fallback={<span className={styles.profileInitial}>{person.name.slice(0, 1) || person.role}</span>}
        />
      </div>
      <div className={styles.profileText}>
        <p className={styles.profileRole}>{person.role}</p>
        {person.name ? <p className={styles.profileName}>{person.name}</p> : null}
        {person.parentsText ? <p className={styles.profileMeta}>{person.parentsText}</p> : null}
        {person.phone ? (
          <a className={styles.profileContact} href={toTelHref(person.phone)}>
            {contactLabel}
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default function WeddingEditorialInvitation(props: VisualTemplateProps) {
  const { data, invitationSlug = '' } = props;
  const model = buildTemplateInvitationModel(data);
  const flags = resolveTemplateRenderFlags(props);
  const t = (key: string) => invitationT(model.locale, key);
  // CSS 변수는 상속되므로 컨테이너에 걸고 이미지가 소비한다.
  const heroRef = useHeroParallax<HTMLDivElement>(0.1, 30);

  const showHeroMedia = Boolean(model.heroImage) || flags.showEmptyPlaceholder;

  return (
    <div
      className={styles.page}
      data-testid="public-invitation-document"
      data-visual-template="WEDDING_04_EDITORIAL"
      data-concept={model.conceptType}
    >
      <section className={styles.hero} data-section-id="hero" data-preview-section="hero">
        {showHeroMedia ? (
          <div className={styles.heroMedia} ref={heroRef}>
            <ImageWithFallback
              className={styles.heroImage}
              src={model.heroImage || null}
              alt=""
              loading="eager"
              fallback={<div className={styles.heroPlaceholder}>{t('invitation.placeholder.hero')}</div>}
            />
            <span className={styles.heroFrame} aria-hidden />
          </div>
        ) : null}
        {model.dateCompact ? (
          <p className={styles.heroRail} aria-hidden>
            {model.dateCompact}
          </p>
        ) : null}

        <div className={styles.names}>
          <InvitationReveal variant="rise" delayMs={80}>
            <p className={styles.eyebrow}>{t('invitation.placeholder.weddingHeadline')}</p>
          </InvitationReveal>
          <InvitationReveal variant="rise" delayMs={180}>
            <h1 className={styles.title}>{model.title}</h1>
          </InvitationReveal>
          <InvitationReveal variant="draw" delayMs={320}>
            <span className={styles.divider} aria-hidden />
          </InvitationReveal>
          {model.subtitle ? (
            <InvitationReveal variant="rise" delayMs={400}>
              <p className={styles.subtitle}>{model.subtitle}</p>
            </InvitationReveal>
          ) : null}
          <InvitationReveal variant="rise" delayMs={480}>
            <p className={styles.heroMeta}>
              <span className={styles.heroMetaLine}>{model.dateText}</span>
              {model.venueName ? (
                <span className={styles.heroMetaLine}>
                  {model.venueName}
                  {model.venueDetail ? ` · ${model.venueDetail}` : ''}
                </span>
              ) : null}
            </p>
            <span className={styles.scrollCue} aria-hidden />
          </InvitationReveal>
        </div>
      </section>

      {model.hasGreeting || flags.showEmptyPlaceholder ? (
        <section className={styles.letter} data-section-id="greeting" data-preview-section="greeting">
          <InvitationReveal variant="rise">
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
          </InvitationReveal>
        </section>
      ) : null}

      {model.hasCouple ? (
        <section className={styles.profiles} data-section-id="couple" data-preview-section="couple">
          <InvitationReveal variant="rise">
            <p className={styles.sectionLabel}>{t('invitation.section.couple')}</p>
          </InvitationReveal>
          {model.groom ? (
            <InvitationReveal variant="rise" delayMs={80}>
              <ProfileRow person={model.groom} flip={false} contactLabel={t('invitation.action.contact')} />
            </InvitationReveal>
          ) : null}
          {model.bride ? (
            <InvitationReveal variant="rise" delayMs={160}>
              <ProfileRow person={model.bride} flip contactLabel={t('invitation.action.contact')} />
            </InvitationReveal>
          ) : null}
        </section>
      ) : null}

      {model.gallery.hasItems ? (
        <VisualTemplateGallery
          visualTemplateId="WEDDING_04_EDITORIAL"
          items={model.gallery.items}
          displayMode={model.gallery.displayMode}
          sectionLabel={t('invitation.section.gallery')}
          labelClassName={styles.sectionLabel}
          lockBodyScroll={flags.isPublic}
        />
      ) : flags.showEmptyPlaceholder ? (
        <section className={styles.gallery} data-section-id="gallery" data-preview-section="gallery">
          <p className={styles.placeholder}>{t('invitation.placeholder.gallery')}</p>
        </section>
      ) : null}

      <section className={styles.schedule} data-section-id="schedule" data-preview-section="schedule">
        <InvitationReveal variant="rise">
          <div className={styles.scheduleHead}>
            <span className={styles.scheduleMonth}>{model.dateParts?.month ?? '--'}</span>
            <div className={styles.scheduleMeta}>
              <p className={styles.scheduleYear}>{model.dateParts?.year ?? ''}</p>
              <p className={styles.scheduleDate}>{model.dateText || t('invitation.placeholder.schedule')}</p>
            </div>
          </div>
        </InvitationReveal>
        {model.scheduleLines.length > 0 ? (
          <InvitationReveal variant="fade" delayMs={80}>
            {model.scheduleLines.map((line, index) => (
              <p key={`schedule-${index}`} className={styles.scheduleNote}>
                {line}
              </p>
            ))}
          </InvitationReveal>
        ) : null}
        <InvitationReveal variant="fade" delayMs={120}>
          <TemplateDateGrid
            variant="editorial"
            eventDate={data.eventDate}
            weddingDate={data.weddingDate}
            weddingDateTime={data.weddingDateTime}
            locale={model.locale}
            className={styles.dateGrid}
          />
        </InvitationReveal>
      </section>

      {model.hasLocation || flags.showEmptyPlaceholder ? (
        <section className={styles.location} data-section-id="location" data-preview-section="location">
          <LocationMapSection
            sectionTitle={t('invitation.section.location')}
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
            transportTitle={t('invitation.map.directionsTitle')}
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
        <p className={styles.footerMark}>{model.dateCompact}</p>
      </footer>
    </div>
  );
}
