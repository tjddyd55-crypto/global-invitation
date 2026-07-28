'use client';

import ImageUploader from '../components/ImageUploader';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorPerson } from '../state/weddingEditor.types';

type Step4CoupleInfoProps = {
  groom: WeddingEditorPerson;
  bride: WeddingEditorPerson;
  onGroomChange: (value: Partial<WeddingEditorPerson>) => void;
  onBrideChange: (value: Partial<WeddingEditorPerson>) => void;
};

export default function Step4CoupleInfo({ groom, bride, onGroomChange, onBrideChange }: Step4CoupleInfoProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>신랑 · 신부</h2>
        <p>항상 2컬럼 대칭 구조로 유지됩니다.</p>
      </div>
      <div className={styles.coupleEditorGrid}>
        <div className={styles.coupleEditorColumn}>
          <h3 className={styles.subSectionTitle}>신랑</h3>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>이름</span>
            <input
              type="text"
              value={groom.name}
              onChange={(event) => onGroomChange({ name: event.target.value })}
              placeholder="신랑 이름"
              required
            />
          </label>
          <ImageUploader
            label="사진 (선택)"
            value={groom.photo}
            uploadAssetType="groom"
            thumbnailRole="couple"
            onChange={(photo) => onGroomChange({ photo })}
            onClear={() => onGroomChange({ photo: '' })}
          />
          <label className={styles.field}>
            <span className={styles.fieldLabel}>연락처 (선택)</span>
            <input
              type="text"
              value={groom.phone ?? ''}
              onChange={(event) => onGroomChange({ phone: event.target.value })}
              placeholder="010-0000-0000"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>부모 안내 문구 (선택)</span>
            <input
              type="text"
              value={groom.parentsText ?? ''}
              onChange={(event) => onGroomChange({ parentsText: event.target.value })}
              placeholder="예: 김영수 · 박미정 의 아들"
            />
          </label>
        </div>
        <div className={styles.coupleEditorColumn}>
          <h3 className={styles.subSectionTitle}>신부</h3>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>이름</span>
            <input
              type="text"
              value={bride.name}
              onChange={(event) => onBrideChange({ name: event.target.value })}
              placeholder="신부 이름"
              required
            />
          </label>
          <ImageUploader
            label="사진 (선택)"
            value={bride.photo}
            uploadAssetType="bride"
            thumbnailRole="couple"
            onChange={(photo) => onBrideChange({ photo })}
            onClear={() => onBrideChange({ photo: '' })}
          />
          <label className={styles.field}>
            <span className={styles.fieldLabel}>연락처 (선택)</span>
            <input
              type="text"
              value={bride.phone ?? ''}
              onChange={(event) => onBrideChange({ phone: event.target.value })}
              placeholder="010-0000-0000"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>부모 안내 문구 (선택)</span>
            <input
              type="text"
              value={bride.parentsText ?? ''}
              onChange={(event) => onBrideChange({ parentsText: event.target.value })}
              placeholder="예: 김영수 · 박미정 의 딸"
            />
          </label>
        </div>
      </div>
      <div className={styles.noticeBox}>모바일에서도 좌우 2컬럼을 유지합니다.</div>
    </section>
  );
}
