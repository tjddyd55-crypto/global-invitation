import styles from './LocationMapSection.module.css';
import { cdnImageSrc } from '@/src/lib/image';

type LocationNavLabels = {
  tmap?: string;
  kakao?: string;
  naver?: string;
};

type LocationMapSectionProps = {
  sectionTitle?: string;
  title: string;
  address?: string;
  mapImage?: string;
  mapImageAlt?: string;
  navLabels?: LocationNavLabels;
  transportTitle?: string;
  transportInfo?: string[];
  parkingTitle?: string;
  parkingInfo?: string[];
};

export default function LocationMapSection({
  sectionTitle,
  title,
  address,
  mapImage,
  mapImageAlt = 'Map',
  navLabels,
  transportTitle,
  transportInfo,
  parkingTitle,
  parkingInfo,
}: LocationMapSectionProps) {
  const navItems = navLabels
    ? [
        { key: 'tmap', label: navLabels.tmap },
        { key: 'kakao', label: navLabels.kakao },
        { key: 'naver', label: navLabels.naver },
      ].filter((item) => Boolean(item.label))
    : [];
  const hasNavButtons = navItems.length > 0;
  const hasTransportInfo = Boolean(transportTitle && transportInfo && transportInfo.length > 0);
  const hasParkingInfo = Boolean(parkingTitle && parkingInfo && parkingInfo.length > 0);

  return (
    <>
      {sectionTitle && <div className={styles.sectionTitle}>{sectionTitle}</div>}
      <div className={styles.locationBlock}>
        <h2>{title}</h2>
        {address && <div>{address}</div>}
      </div>
      {mapImage && <img className={styles.mapImage} src={cdnImageSrc(mapImage)} alt={mapImageAlt} loading="lazy" />}
      {hasNavButtons && (
        <div className={styles.navButtons}>
          {navItems.map((item) => (
            <button key={item.key} className={styles.navButton} type="button">
              {item.label}
            </button>
          ))}
        </div>
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
    </>
  );
}
