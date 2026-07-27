'use client';

import styles from './LocationMapSection.module.css';
import { cdnImageSrc } from '@/src/lib/image';
import GoogleMapsExternalLinks from '@/src/maps/GoogleMapsExternalLinks';
import PublicGoogleMap from '@/src/maps/PublicGoogleMap';
import { hasGoogleMapsApiKey } from '@/src/maps/config';
import type { InvitationLocation } from '@/src/maps/types';

type LocationMapSectionProps = {
  sectionTitle?: string;
  title: string;
  address?: string;
  detailAddress?: string;
  googlePlaceId?: string;
  mapLat?: number;
  mapLng?: number;
  mapImage?: string;
  mapImageAlt?: string;
  /** @deprecated Google-only — ignored (네이버/카카오/티맵 제거) */
  navLabels?: unknown;
  transportTitle?: string;
  transportInfo?: string[];
  parkingTitle?: string;
  parkingInfo?: string[];
  /** 부고 등 어두운 배경에서 대비 유지 */
  tone?: 'light' | 'dark';
  /** pixel QA layout mode */
  layoutMapPlaceholder?: boolean;
};

/**
 * Public location section — Google Maps only (view + directions).
 */
export default function LocationMapSection({
  sectionTitle,
  title,
  address,
  detailAddress,
  googlePlaceId,
  mapLat,
  mapLng,
  mapImage,
  mapImageAlt = 'Map',
  transportTitle,
  transportInfo,
  parkingTitle,
  parkingInfo,
  tone = 'light',
  layoutMapPlaceholder = false,
}: LocationMapSectionProps) {
  const invitationLocation: InvitationLocation = {
    venueName: (title || '').trim(),
    formattedAddress: (address || '').trim(),
    detailAddress: (detailAddress || '').trim() || undefined,
    googlePlaceId,
    latitude: mapLat,
    longitude: mapLng,
  };

  const hasTransportInfo = Boolean(transportTitle && transportInfo && transportInfo.length > 0);
  const hasParkingInfo = Boolean(parkingTitle && parkingInfo && parkingInfo.length > 0);

  const canShowGoogleMap =
    hasGoogleMapsApiKey() &&
    Boolean(
      googlePlaceId?.trim() ||
        (typeof mapLat === 'number' && typeof mapLng === 'number') ||
        address?.trim() ||
        title?.trim()
    );

  const rootTone = tone === 'dark' ? styles.rootDark : styles.rootLight;

  return (
    <div className={`${styles.root} ${rootTone}`}>
      {sectionTitle ? <div className={styles.sectionTitle}>{sectionTitle}</div> : null}
      <div className={styles.locationBlock}>
        {title ? <h2>{title}</h2> : null}
        {address ? <div>{address}</div> : null}
        {detailAddress?.trim() ? <div className={styles.detailAddress}>{detailAddress}</div> : null}
      </div>

      {canShowGoogleMap || layoutMapPlaceholder ? (
        <PublicGoogleMap location={invitationLocation} layoutPlaceholder={layoutMapPlaceholder} />
      ) : mapImage ? (
        <img className={styles.mapImage} src={cdnImageSrc(mapImage)} alt={mapImageAlt} loading="lazy" />
      ) : (
        <div className={styles.mapFallback} data-testid="public-map-fallback" data-qa-map-placeholder="1">
          지도를 표시할 수 없습니다. 아래 링크로 위치를 확인해 주세요.
        </div>
      )}

      <GoogleMapsExternalLinks location={invitationLocation} />

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
  );
}
