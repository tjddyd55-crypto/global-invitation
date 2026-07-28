'use client';

import styles from './LocationMapSection.module.css';
import { cdnImageSrc } from '@/src/lib/image';
import GoogleMapsExternalLinks from '@/src/maps/GoogleMapsExternalLinks';
import NaverMapsExternalLinks from '@/src/maps/NaverMapsExternalLinks';
import InvitationProviderMap from '@/src/maps/InvitationProviderMap';
import { hasGoogleMapsApiKey } from '@/src/maps/config';
import { hasNaverMapsClientId } from '@/src/maps/loadNaverMaps';
import {
  getInvitationMapSettings,
  hasMapTarget,
  type InvitationMapProvider,
} from '@/src/invitation/mapSettings';
import type { InvitationLocation } from '@/src/maps/types';

type LocationMapSectionProps = {
  sectionTitle?: string;
  title: string;
  address?: string;
  detailAddress?: string;
  googlePlaceId?: string;
  mapLat?: number;
  mapLng?: number;
  mapProvider?: InvitationMapProvider;
  naverPlaceId?: string;
  naverMapUrl?: string;
  mapImage?: string;
  mapImageAlt?: string;
  /** @deprecated ignored */
  navLabels?: unknown;
  transportTitle?: string;
  transportInfo?: string[];
  parkingTitle?: string;
  parkingInfo?: string[];
  tone?: 'light' | 'dark';
  layoutMapPlaceholder?: boolean;
  /** LivePreview: non-interactive map + preview testids */
  previewMode?: boolean;
  /** Prefer full invitation data when available — selector SSOT */
  invitationData?: unknown;
};

/**
 * Public/Preview location section — titles/links here, canvas via InvitationProviderMap.
 */
export default function LocationMapSection({
  sectionTitle,
  title,
  address,
  detailAddress,
  googlePlaceId,
  mapLat,
  mapLng,
  mapProvider,
  naverPlaceId,
  naverMapUrl,
  mapImage,
  mapImageAlt = 'Map',
  transportTitle,
  transportInfo,
  parkingTitle,
  parkingInfo,
  tone = 'light',
  layoutMapPlaceholder = false,
  previewMode = false,
  invitationData,
}: LocationMapSectionProps) {
  const mergedSource: Record<string, unknown> = {
    ...(invitationData && typeof invitationData === 'object'
      ? (invitationData as Record<string, unknown>)
      : {}),
  };
  if (mapProvider) mergedSource.mapProvider = mapProvider;
  if (title?.trim()) mergedSource.venueName = title.trim();
  if (address?.trim()) {
    mergedSource.formattedAddress = address.trim();
    mergedSource.address = address.trim();
  }
  if (detailAddress?.trim()) mergedSource.detailAddress = detailAddress.trim();
  if (googlePlaceId) mergedSource.googlePlaceId = googlePlaceId;
  if (typeof mapLat === 'number') mergedSource.mapLat = mapLat;
  if (typeof mapLng === 'number') mergedSource.mapLng = mapLng;
  if (naverPlaceId) mergedSource.naverPlaceId = naverPlaceId;
  if (naverMapUrl) mergedSource.naverMapUrl = naverMapUrl;

  const settings = getInvitationMapSettings(mergedSource);

  const invitationLocation: InvitationLocation = {
    venueName: settings.venueName || (title || '').trim(),
    formattedAddress: settings.formattedAddress || (address || '').trim(),
    detailAddress: settings.detailAddress || (detailAddress || '').trim() || undefined,
    googlePlaceId: settings.googlePlaceId,
    latitude: settings.latitude ?? mapLat,
    longitude: settings.longitude ?? mapLng,
  };

  const hasTransportInfo = Boolean(transportTitle && transportInfo && transportInfo.length > 0);
  const hasParkingInfo = Boolean(parkingTitle && parkingInfo && parkingInfo.length > 0);
  const provider = settings.provider;
  const canShowGoogleMap =
    provider === 'GOOGLE' &&
    hasGoogleMapsApiKey() &&
    (hasMapTarget(settings) || Boolean(title?.trim() || address?.trim()));
  const canShowNaverMap = provider === 'NAVER' && hasMapTarget(settings);
  const canShowProviderMap =
    (provider === 'GOOGLE' && (canShowGoogleMap || layoutMapPlaceholder)) ||
    (provider === 'NAVER' && (canShowNaverMap || layoutMapPlaceholder));

  const rootTone = tone === 'dark' ? styles.rootDark : styles.rootLight;
  const displayTitle = settings.venueName || title;
  const displayAddress = settings.formattedAddress || address;
  const displayDetail = settings.detailAddress || detailAddress;
  const surface = previewMode ? 'preview' : 'public';

  return (
    <div className={`${styles.root} ${rootTone}`} data-map-provider={provider}>
      <div className={styles.locationHeader}>
        {sectionTitle ? <div className={styles.sectionTitle}>{sectionTitle}</div> : null}
        <div className={styles.locationBlock}>
          {displayTitle ? <h2>{displayTitle}</h2> : null}
          {displayAddress ? <div>{displayAddress}</div> : null}
          {displayDetail?.trim() ? <div className={styles.detailAddress}>{displayDetail}</div> : null}
        </div>
      </div>

      <div className={styles.mapBleed} data-testid="public-map">
        {canShowProviderMap ? (
          <InvitationProviderMap
            settings={settings}
            location={invitationLocation}
            layoutPlaceholder={layoutMapPlaceholder}
            interactive={!previewMode}
            surface={surface}
          />
        ) : mapImage ? (
          <img className={styles.mapImage} src={cdnImageSrc(mapImage)} alt={mapImageAlt} loading="lazy" />
        ) : (
          <div
            className={styles.mapFallback}
            data-testid="map-provider-placeholder"
            data-qa-map-placeholder="1"
          >
            {provider === 'NAVER' && !hasNaverMapsClientId()
              ? '네이버 지도 설정이 필요합니다.'
              : '지도를 표시할 수 없습니다. 아래 링크로 위치를 확인해 주세요.'}
          </div>
        )}
      </div>

      <div className={styles.locationDetails} data-testid="map-provider-nav-links">
        {provider === 'NAVER' ? (
          <NaverMapsExternalLinks settings={settings} />
        ) : (
          <GoogleMapsExternalLinks location={invitationLocation} />
        )}

        {hasTransportInfo && (
          <div className={styles.infoList}>
            <strong>{transportTitle}</strong>
            {transportInfo?.map((line) => (
              <div key={line}>- {line}</div>
            ))}
          </div>
        )}
        {hasParkingInfo && (
          <div className={styles.infoList}>
            <strong>{parkingTitle}</strong>
            {parkingInfo?.map((line) => (
              <div key={line}>- {line}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
