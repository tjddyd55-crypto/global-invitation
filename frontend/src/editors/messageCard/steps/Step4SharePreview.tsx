'use client';

import MessageThankYouCard from '@/src/templates/messageThankYou/MessageThankYouCard';
import styles from '../messageCardEditor.module.css';
import type { MessageCardData } from '@/src/models/messageCard';

type Step4SharePreviewProps = {
  data: MessageCardData;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
};

export default function Step4SharePreview({ data, ogTitle, ogDescription, ogImage }: Step4SharePreviewProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 4. 공유 미리보기</h2>
        <p>카드 전체와 OG 공유 미리보기를 확인합니다.</p>
      </div>
      <div className={styles.previewStack}>
        <div className={styles.previewFull}>
          <MessageThankYouCard data={data} interactive={false} />
        </div>
        <div className={styles.ogCard}>
          <div className={styles.ogImage}>
            {ogImage ? <img src={ogImage} alt="OG preview" /> : <span>이미지 없음</span>}
          </div>
          <div className={styles.ogBody}>
            <div className={styles.ogTitle}>{ogTitle || 'OG 제목 미입력'}</div>
            <div className={styles.ogDescription}>{ogDescription || 'OG 설명 미입력'}</div>
          </div>
        </div>
        <div className={styles.noticeBox}>
          OG 이미지가 없으면 coverImage가 사용됩니다.
        </div>
      </div>
    </section>
  );
}
