'use client';

import { useEffect, useRef } from 'react';
import styles from './MessageBrandedJCIEditor.module.css';
import type { BrandedMessageCard } from '@/src/models/messageBranded';
import MessageBrandedJCI from '@/src/templates/messageBranded/jci/MessageBrandedJCI';
import { useI18n } from '@/src/contexts/I18nContext';
import { logEvent } from '@/src/lib/events';

type MessageBrandedJCIEditorProps = {
  data: BrandedMessageCard;
  pageUrl: string;
};

export default function MessageBrandedJCIEditor({ data, pageUrl }: MessageBrandedJCIEditorProps) {
  const { language } = useI18n();
  const previewLoggedRef = useRef(false);

  useEffect(() => {
    if (previewLoggedRef.current) return;
    logEvent({ eventType: 'preview_open', templateType: 'branded', language, pageUrl });
    previewLoggedRef.current = true;
  }, [language, pageUrl]);

  return (
    <div className={styles.editorPage}>
      <header className={styles.editorHeader}>
        <div>
          <h1 className={styles.editorTitle}>Branded Message Card (JCI) 에디터</h1>
          <p className={styles.editorSubtitle}>STEP 0 확인용 · 읽기 전용</p>
        </div>
      </header>

      <div className={styles.editorLayout}>
        <aside className={styles.navColumn}>
          <div className={styles.stepperNav}>
            <div className={`${styles.stepperItem} ${styles.stepperItemActive}`}>
              <span className={styles.stepperIndex}>0</span>
              <span className={styles.stepperTitle}>확인용 에디터</span>
            </div>
          </div>
        </aside>

        <main className={styles.formColumn}>
          <section className={styles.stepSection}>
            <div className={styles.sectionHeader}>
              <h2>STEP 0. 확인용 에디터</h2>
              <p>브랜드 카드 구조를 확인하기 위한 읽기 전용 화면입니다.</p>
            </div>
            <div className={styles.readOnlyList}>
              <div className={styles.readOnlyRow}>
                <span className={styles.rowLabel}>브랜드</span>
                <span>{data.brand.name}</span>
              </div>
              <div className={styles.readOnlyRow}>
                <span className={styles.rowLabel}>타이틀</span>
                <span>{data.title}</span>
              </div>
              <div className={styles.readOnlyRow}>
                <span className={styles.rowLabel}>메시지</span>
                <span>{data.message}</span>
              </div>
              <div className={styles.readOnlyRow}>
                <span className={styles.rowLabel}>일정</span>
                <span>{data.schedule.date} {data.schedule.time}</span>
              </div>
              <div className={styles.readOnlyRow}>
                <span className={styles.rowLabel}>장소</span>
                <span>{data.schedule.place}</span>
              </div>
              <div className={styles.readOnlyRow}>
                <span className={styles.rowLabel}>지도 좌표</span>
                <span>{data.map.lat}, {data.map.lng}</span>
              </div>
            </div>
          </section>
        </main>

        <aside className={styles.previewColumn}>
          <div className={styles.previewPanel}>
            <div className={styles.previewTitle}>미리보기</div>
            <div className={styles.previewFrame}>
              <MessageBrandedJCI data={data} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
