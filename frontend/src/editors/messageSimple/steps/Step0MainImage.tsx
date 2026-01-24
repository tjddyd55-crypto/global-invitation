'use client';

import styles from '../messageSimpleEditor.module.css';

type Step0MainImageProps = {
  heroImage: string;
  onChange: (heroImage: string) => void;
};

function revokeIfObjectUrl(url?: string) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

export default function Step0MainImage({ heroImage, onChange }: Step0MainImageProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (heroImage) {
      revokeIfObjectUrl(heroImage);
    }
    onChange(URL.createObjectURL(file));
  };

  const handleClear = () => {
    if (!heroImage) return;
    revokeIfObjectUrl(heroImage);
    onChange('');
  };

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 0. 메인 이미지</h2>
        <p>카드 분위기를 결정하는 대표 이미지를 선택합니다.</p>
      </div>
      <div className={styles.uploader}>
        <div className={styles.uploaderBody}>
          {heroImage ? (
            <div className={styles.uploaderPreview}>
              <img src={heroImage} alt="main preview" />
            </div>
          ) : (
            <div className={styles.uploaderPlaceholder}>이미지를 선택하세요.</div>
          )}
          <div className={styles.uploaderActions}>
            <label className={styles.buttonGhost}>
              이미지 선택
              <input type="file" accept="image/*" className={styles.hiddenInput} onChange={handleFileChange} />
            </label>
            {heroImage && (
              <button type="button" className={styles.buttonSubtle} onClick={handleClear}>
                제거
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
