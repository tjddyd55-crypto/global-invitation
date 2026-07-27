'use client';
/* eslint-disable i18next/no-literal-string */

import { useMemo } from 'react';
import { getGoogleMapsApiKey, hasGoogleMapsApiKey, PUBLIC_MAP_HEIGHT_PX } from './config';
import { buildEmbedPlaceQuery } from './googleMapsUrls';
import type { InvitationLocation } from './types';
import { hasValidCoordinates } from './types';
import styles from './PublicGoogleMap.module.css';

type PublicGoogleMapProps = {
  location: InvitationLocation;
  height?: number;
  /** layout/pixel QA: 단색 placeholder */
  layoutPlaceholder?: boolean;
  className?: string;
};

/**
 * Public invitation map — Maps Embed API (place mode).
 * query 우선순위: placeId → lat,lng → formattedAddress
 * 좌표/placeId는 사용자에게 노출하지 않음.
 */
export default function PublicGoogleMap({
  location,
  height = PUBLIC_MAP_HEIGHT_PX,
  layoutPlaceholder = false,
  className,
}: PublicGoogleMapProps) {
  const apiKey = getGoogleMapsApiKey();
  const query = useMemo(() => buildEmbedPlaceQuery(location), [location]);
  const canEmbed =
    hasGoogleMapsApiKey() &&
    Boolean(query) &&
    (Boolean(location.googlePlaceId?.trim()) ||
      hasValidCoordinates(location.latitude, location.longitude) ||
      Boolean(location.formattedAddress?.trim()) ||
      Boolean(location.venueName?.trim()));

  if (layoutPlaceholder || !canEmbed) {
    return (
      <div
        className={`${styles.map} ${styles.placeholder} ${className || ''}`.trim()}
        style={{ height }}
        data-testid="public-google-map"
        data-qa-map-placeholder="1"
        aria-label="지도"
      />
    );
  }

  const language =
    typeof document !== 'undefined'
      ? (document.documentElement.lang || 'en').slice(0, 2)
      : 'en';

  const src = `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}&zoom=16&language=${encodeURIComponent(language)}`;

  return (
    <iframe
      className={`${styles.map} ${className || ''}`.trim()}
      style={{ height }}
      src={src}
      title="위치 지도"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
      data-testid="public-google-map"
      data-embed-query={query.startsWith('place_id:') ? 'place_id' : 'geo-or-address'}
    />
  );
}
