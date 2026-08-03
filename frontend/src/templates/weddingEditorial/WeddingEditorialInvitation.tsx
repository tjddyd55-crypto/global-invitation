'use client';
/* eslint-disable i18next/no-literal-string */

/**
 * WEDDING 04 — Modern Editorial
 * 매거진 편집 레이아웃. 데이터 정규화는 templateInvitationModel 이 담당하고
 * 이 파일은 레이아웃·모션만 기술한다.
 */
import { useState } from 'react';
import ImageWithFallback from '@/src/components/media/ImageWithFallback';
import GalleryLightboxDialog from '@/src/templates/shared/GalleryLightboxDialog';
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
import styles from './WeddingEditorialInvitation.module.css';

function ProfileRow({ person, flip }: { person: TemplatePerson; flip: boolean }) {
  return (
    <div className={`${styles.profileRow} ${flip ? styles.profileRowFlip : ''}`.trim()}>
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
            연락하기
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
          <div className={styles.heroMedia}>
            <ImageWithFallback
              className={styles.heroImage}
              src={model.heroImage || null}
              alt=""
              loading="eager"
              fallback={<div className={styles.heroPlaceholder}>대표 이미지를 추가해 주세요</div>}
            />
          </div>
        ) : null}
        {model.dateParts ? (
          <p className={styles.heroRail} aria-hidden>
            {`${model.dateParts.year}.${model.dateParts.month}.${model.dateParts.day}`}
          </p>
        ) : null}

        <div className={styles.names}>
          <InvitationReveal variant="rise" delayMs={80}>
            <p className={styles.eyebrow}>WE ARE GETTING MARRIED</p>
          </InvitationReveal>
          <InvitationReveal variant="rise" delayMs={180}>
            <h1 className={styles.title}>{model.title}</h1>
          </InvitationReveal>
          <InvitationReveal variant="wipe" delayMs={320}>
            <span className={styles.divider} aria-hidden />
          </InvitationReveal>
          {model.subtitle ? (
            <InvitationReveal variant="rise" delayMs={400}>
              <p className={styles.subtitle}>{model.subtitle}</p>
            </InvitationReveal>
          ) : null}
          <InvitationReveal variant="rise" delayMs={480}>
            <p className={styles.heroMeta}>
              {model.dateText}
              {model.venueName ? <span className={styles.heroMetaLine}>{model.venueName}</span> : null}
            </p>
          </InvitationReveal>
        </div>
      </section>

      {model.hasGreeting || flags.showEmptyPlaceholder ? (
        <section className={styles.letter} data-section-id="greeting" data-preview-section="greeting">
          <InvitationReveal variant="rise">
            <p className={styles.sectionLabel}>INVITATION</p>
            {model.hasGreeting ? (
              model.greetingLines.map((line, index) => (
                <p key={`greeting-${index}`} className={styles.letterLine}>
                  {line}
                </p>
              ))
            ) : (
              <p className={styles.placeholder}>인사말을 입력해 주세요</p>
            )}
          </InvitationReveal>
        </section>
      ) : null}

      {model.hasCouple ? (
        <section className={styles.profiles} data-section-id="couple" data-preview-section="couple">
          <InvitationReveal variant="rise">
            <p className={styles.sectionLabel}>THE COUPLE</p>
          </InvitationReveal>
          {model.groom ? (
            <InvitationReveal variant="rise" delayMs={80}>
              <ProfileRow person={model.groom} flip={false} />
            </InvitationReveal>
          ) : null}
          {model.bride ? (
            <InvitationReveal variant="rise" delayMs={160}>
              <ProfileRow person={model.bride} flip />
            </InvitationReveal>
          ) : null}
        </section>
      ) : null}

      {model.gallery.hasItems ? (
        <section className={styles.gallery} data-section-id="gallery" data-preview-section="gallery">
          <InvitationReveal variant="rise">
            <p className={styles.sectionLabel}>GALLERY</p>
          </InvitationReveal>
          <div className={styles.collage}>
            {model.gallery.items.map((item, index) => (
              <button
                key={item.id || item.url}
                type="button"
                className={styles.collageCell}
                onClick={() => setLightboxIndex(index)}
                aria-label={`${index + 1}번째 사진 크게 보기`}
              >
                <ImageWithFallback className={styles.collageImage} src={item.url} alt={item.alt} />
              </button>
            ))}
          </div>
        </section>
      ) : flags.showEmptyPlaceholder ? (
        <section className={styles.gallery} data-section-id="gallery" data-preview-section="gallery">
          <p className={styles.placeholder}>갤러리 이미지를 추가해 주세요</p>
        </section>
      ) : null}

      <section className={styles.schedule} data-section-id="schedule" data-preview-section="schedule">
        <InvitationReveal variant="rise">
          <div className={styles.scheduleHead}>
            <span className={styles.scheduleMonth}>{model.dateParts?.month ?? '--'}</span>
            <div className={styles.scheduleMeta}>
              <p className={styles.scheduleYear}>{model.dateParts?.year ?? ''}</p>
              <p className={styles.scheduleDate}>{model.dateText || '일정을 입력해 주세요'}</p>
            </div>
          </div>
        </InvitationReveal>
        <InvitationReveal variant="fade" delayMs={120}>
          <TemplateDateGrid
            variant="editorial"
            eventDate={data.eventDate}
            weddingDate={data.weddingDate}
            weddingDateTime={data.weddingDateTime}
            className={styles.dateGrid}
          />
        </InvitationReveal>
      </section>

      {model.hasLocation || flags.showEmptyPlaceholder ? (
        <section className={styles.location} data-section-id="location" data-preview-section="location">
          <LocationMapSection
            sectionTitle="LOCATION"
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
            transportTitle="오시는 길"
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

      <GalleryLightboxDialog
        items={model.gallery.items}
        openIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={setLightboxIndex}
        lockBodyScroll={flags.isPublic}
      />
    </div>
  );
}
