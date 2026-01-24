'use client';

import MessageThankYouCard from '@/src/templates/messageThankYou/MessageThankYouCard';
import type { MessageCardData } from '@/src/models/messageCard';
import styles from '../messageCardEditor.module.css';

type PreviewPanelProps = {
  data: MessageCardData;
  title?: string;
};

export default function PreviewPanel({ data, title }: PreviewPanelProps) {
  return (
    <div className={styles.previewPanel}>
      {title && <div className={styles.previewTitle}>{title}</div>}
      <div className={styles.previewFrame}>
        <MessageThankYouCard data={data} interactive={false} />
      </div>
    </div>
  );
}
