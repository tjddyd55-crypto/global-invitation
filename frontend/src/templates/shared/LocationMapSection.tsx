'use client';

import styles from './LocationMapSection.module.css';
import { cdnImageSrc } from '@/src/lib/image';
import GoogleMapsExternalLinks from '@/src/maps/GoogleMapsExternalLinks';
import NaverMapsExternalLinks from '@/src/maps/NaverMapsExternalLinks';
import PublicGoogleMap from '@/src/maps/PublicGoogleMap';
import PublicNaverMap from '@/src/maps/PublicNaverMap';
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
  /** Prefer full invitation data when available — selector SSOT */
  invitationData?: unknown;
};

/**
 * Public/Preview location section — provider SSOT via getInvitationMapSettings.
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
  invitationData,
}: LocationMapSectionProps) {
  const settings = getInvitationMapSettings(
    invitationData ?? {
      mapProvider,
      venueName: title,
      formattedAddress: address,
      address,
      detailAddress,
      googlePlaceId,
      mapLat,
      mapLng,
      naverPlaceId,
      naverMapUrl,
    }
  );

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

  const rootTone = tone === 'dark' ? styles.rootDark : styles.rootLight;
  const displayTitle = settings.venueName || title;
  const displayAddress = settings.formattedAddress || address;
  const displayDetail = settings.detailAddress || detailAddress;

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
        {provider === 'GOOGLE' && (canShowGoogleMap || layoutMapPlaceholder) ? (
          <PublicGoogleMap location={invitationLocation} layoutPlaceholder={layoutMapPlaceholder} />
        ) : provider === 'NAVER' && (canShowNaverMap || layoutMapPlaceholder) ? (
          <PublicNaverMap settings={settings} layoutPlaceholder={layoutMapPlaceholder} />
        ) : mapImage ? (
          <img className={styles.mapImage} src={cdnImageSrc(mapImage)} alt={mapImageAlt} loading="lazy" />
        ) : (
          <div className={styles.mapFallback} data-testid="public-map-fallback" data-qa-map-placeholder="1">
            {provider === 'NAVER' && !hasNaverMapsClientId()
              ? '선택한 지도 서비스를 불러오지 못했습니다. 주소는 저장되며 외부 지도에서 확인할 수 있습니다.'
              : '지도를 표시할 수 없습니다. 아래 링크로 위치를 확인해 주세요.'}
          </div>
        )}
      </div>

      <div className={styles.locationDetails}>
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
