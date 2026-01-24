'use client';

import styles from '../funeralEditor.module.css';
import ImageUploader from '../components/ImageUploader';
import type { FuneralInvitation } from '@/src/templates/funeralClassic/data';

type Step4HallProps = {
  funeralHall: FuneralInvitation['funeralHall'];
  contact?: FuneralInvitation['contact'];
  onHallChange: (hall: FuneralInvitation['funeralHall']) => void;
  onContactChange: (contact?: FuneralInvitation['contact']) => void;
};

export default function Step4Hall({ funeralHall, contact, onHallChange, onContactChange }: Step4HallProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 4. 장례식장/지도</h2>
        <p>장례식장 정보와 대표 연락처를 입력합니다.</p>
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>장례식장 이름</span>
        <input
          type="text"
          value={funeralHall.name}
          onChange={(event) => onHallChange({ ...funeralHall, name: event.target.value })}
          placeholder="예: 서울아산병원장례식장 특실"
          required
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>주소</span>
        <input
          type="text"
          value={funeralHall.address}
          onChange={(event) => onHallChange({ ...funeralHall, address: event.target.value })}
          placeholder="예: 서울특별시 송파구 올림픽로 43길 88"
          required
        />
      </label>
      <ImageUploader
        label="지도 이미지 (선택)"
        description="지도 이미지가 없으면 지도 영역이 숨겨집니다."
        value={funeralHall.mapImage}
        onChange={(mapImage) => onHallChange({ ...funeralHall, mapImage })}
        onClear={() => onHallChange({ ...funeralHall, mapImage: '' })}
      />
      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>연락처 이름 (선택)</span>
          <input
            type="text"
            value={contact?.name ?? ''}
            onChange={(event) => onContactChange({ ...(contact ?? { name: '', phone: '' }), name: event.target.value })}
            placeholder="예: 상주 대표"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>연락처 번호 (선택)</span>
          <input
            type="text"
            value={contact?.phone ?? ''}
            onChange={(event) => onContactChange({ ...(contact ?? { name: '', phone: '' }), phone: event.target.value })}
            placeholder="예: 02-3010-2000"
          />
        </label>
      </div>
    </section>
  );
}
