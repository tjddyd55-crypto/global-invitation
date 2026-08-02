'use client';

import DateTimeLocalField from '@/src/editors/shared/DateTimeLocalField';
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

/**
 * 기본 정보 Step.
 * GENERAL/WEDDING 모두 title·subtitle·eventDateTime·venueName·venueDetail 동일 SSOT.
 */
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
    datetime: string;
    venue: string;
    detail: string;
    venuePlaceholder: string;
    detailPlaceholder: string;
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
            datetime: '행사 날짜/시간',
            venue: '장소명',
            detail: '홀 이름 (선택)',
            titlePlaceholder: '예: 초대합니다',
            subtitlePlaceholder: '예: 함께 만드는 미래',
            venuePlaceholder: '예: 코엑스 컨퍼런스홀',
            detailPlaceholder: '예: 3층 오디토리움',
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
        <p>컨셉에 맞는 기본 제목·일정·장소 정보를 입력하면 미리보기에 즉시 반영됩니다.</p>
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
        <DateTimeLocalField
          label={labels.datetime}
          value={value.eventDateTime}
          onChange={(next) => onChange({ eventDateTime: next })}
          required
          inputTestId="basic-datetime-input"
          buttonTestId="basic-datetime-picker-button"
        />
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{labels.venue}</span>
          <input
            type="text"
            value={value.venueName}
            onChange={(event) => onChange({ venueName: event.target.value })}
            placeholder={labels.venuePlaceholder}
            data-testid="basic-venue-input"
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{labels.detail}</span>
          <input
            type="text"
            value={value.venueDetail ?? ''}
            onChange={(event) => onChange({ venueDetail: event.target.value })}
            placeholder={labels.detailPlaceholder}
            data-testid="basic-venue-detail-input"
          />
        </label>
      </div>
    </section>
  );
}
