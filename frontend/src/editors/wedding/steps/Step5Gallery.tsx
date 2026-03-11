'use client';

import MultiImageUploader from '../components/MultiImageUploader';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorGallery, WeddingEditorImage } from '../state/weddingEditor.types';

type Step5GalleryProps = {
  value: WeddingEditorGallery;
  onChange: (images: WeddingEditorImage[]) => void;
  onUploadStateChange?: (state: { isUploading: boolean; hasError: boolean }) => void;
};

export default function Step5Gallery({ value, onChange, onUploadStateChange }: Step5GalleryProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 5. 갤러리</h2>
        <p>다중 이미지 업로드, 순서 변경, 삭제가 가능합니다.</p>
      </div>
      <MultiImageUploader
        label="갤러리 이미지"
        description="초대장 표시 순서가 입력 순서를 그대로 따릅니다."
        images={value.images}
        onChange={onChange}
        inputTestId="gallery-upload-input"
        onUploadStateChange={onUploadStateChange}
      />
    </section>
  );
}
