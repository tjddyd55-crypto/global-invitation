'use client';

import styles from './MessageBrandedJCI.module.css';
import type { BrandedMessageCard } from '@/src/models/messageBranded';

type MessageBrandedJCIProps = {
  data: BrandedMessageCard;
};

function buildMapSrc(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
}

export default function MessageBrandedJCI({ data }: MessageBrandedJCIProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <img className={styles.logo} src={data.brand.logo} alt={`${data.brand.name} logo`} />
      </header>

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.hero}>
            <img className={styles.heroImage} src={data.heroImage} alt="branded hero" />
          </div>
          <div>
            <div className={styles.title}>{data.title}</div>
            <div className={styles.message}>{data.message}</div>
          </div>
          <div className={styles.schedule}>
            <div>
              <span className={styles.scheduleLabel}>일정</span>
              {data.schedule.date} {data.schedule.time}
            </div>
            <div>
              <span className={styles.scheduleLabel}>장소</span>
              {data.schedule.place}
            </div>
          </div>
          <iframe
            className={styles.mapFrame}
            src={buildMapSrc(data.map.lat, data.map.lng)}
            title={data.map.label}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.brandName}>{data.brand.name}</div>
      </footer>
    </div>
  );
}
