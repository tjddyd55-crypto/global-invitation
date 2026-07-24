'use client';

import styles from '../weddingEditor.module.css';
import type {
  WeddingEditorBasic,
  WeddingEditorSetup,
} from '../state/weddingEditor.types';

type Step1BasicInfoProps = {
  value: WeddingEditorBasic;
  conceptType: WeddingEditorSetup['conceptType'];
  onChange: (value: Partial<WeddingEditorBasic>) => void;
};

export default function Step1BasicInfo({
  value,
  conceptType,
  onChange,
}: Step1BasicInfoProps) {
  type BasicStepLabel = {
    title: string;
    subtitle: string;
    titlePlaceholder: string;
    subtitlePlaceholder: string;
    datetime?: string;
    venue?: string;
    detail?: string;
    venuePlaceholder?: string;
    detailPlaceholder?: string;
  };

  const labels: BasicStepLabel =
    conceptType === 'FUNERAL'
      ? {
          title: '고인 이름',
          subtitle: '상주 연락처 (선택)',
          datetime: '발인 날짜',
          venue: '빈소 위치',
          detail: '추가 안내 (선택)',
          titlePlaceholder: '예: 부고를 전합니다',
          subtitlePlaceholder: '예: 상주 홍길동 010-1234-5678',
          venuePlaceholder: '예: 서울아산병원장례식장 특실',
          detailPlaceholder: '예: 조문 시간: 오전 10시 - 오후 8시',
        }
      : conceptType === 'GENERAL'
        ? {
            title: '행사 제목',
            subtitle: '행사 부제 (선택)',
            titlePlaceholder: '예: 초대합니다',
            subtitlePlaceholder: '예: 함께 만드는 미래',
          }
        : {
            title: '제목',
            subtitle: '부제 (선택)',
            datetime: '예식 날짜/시간',
            venue: '장소명',
            detail: '홀 이름 (선택)',
            titlePlaceholder: '예: 결혼식에 초대합니다',
            subtitlePlaceholder: '예: 사랑의 약속',
            venuePlaceholder: '예: 더링크호텔 서울',
            detailPlaceholder: '예: 3층 베일리홀',
          };

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>기본 정보</h2>
        <p>컨셉에 맞는 기본 제목 정보를 입력하면 미리보기에 즉시 반영됩니다.</p>
      </div>
      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{labels.title}</span>
          <input
            type="text"
            value={value.title}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder={labels.titlePlaceholder}
            data-testid="basic-title-input"
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{labels.subtitle}</span>
          <input
            type="text"
            value={value.subtitle ?? ''}
            onChange={(event) => onChange({ subtitle: event.target.value })}
            placeholder={labels.subtitlePlaceholder}
          />
        </label>
        {conceptType !== 'GENERAL' && (
          <>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{labels.datetime ?? '일시'}</span>
              <input
                type="datetime-local"
                value={value.eventDateTime}
                onChange={(event) => onChange({ eventDateTime: event.target.value })}
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{labels.venue ?? '장소명'}</span>
              <input
                type="text"
                value={value.venueName}
                onChange={(event) => onChange({ venueName: event.target.value })}
                placeholder={labels.venuePlaceholder ?? '예: 행사 장소'}
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{labels.detail ?? '상세 장소'}</span>
              <input
                type="text"
                value={value.venueDetail ?? ''}
                onChange={(event) => onChange({ venueDetail: event.target.value })}
                placeholder={labels.detailPlaceholder ?? '예: 상세 안내'}
              />
            </label>
          </>
        )}
      </div>
    </section>
  );
}
