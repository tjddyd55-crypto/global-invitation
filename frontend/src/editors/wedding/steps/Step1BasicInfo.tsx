'use client';

import styles from '../weddingEditor.module.css';
import type {
  WeddingEditorBasic,
  WeddingEditorInvitationMessage,
  WeddingEditorSetup,
} from '../state/weddingEditor.types';

type Step1BasicInfoProps = {
  value: WeddingEditorBasic;
  invitationMessage: WeddingEditorInvitationMessage;
  conceptType: WeddingEditorSetup['conceptType'];
  onChange: (value: Partial<WeddingEditorBasic>) => void;
  onInvitationMessageChange: (value: Partial<WeddingEditorInvitationMessage>) => void;
};

export default function Step1BasicInfo({
  value,
  invitationMessage,
  conceptType,
  onChange,
  onInvitationMessageChange,
}: Step1BasicInfoProps) {
  const labels =
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
          message: '부고 메시지',
          messagePlaceholder: '삼가 고인의 명복을 빕니다.',
        }
      : conceptType === 'GENERAL'
        ? {
            title: '행사 제목',
            subtitle: '행사 부제 (선택)',
            datetime: '행사 날짜/시간',
            venue: '장소명',
            detail: '상세 장소 (선택)',
            titlePlaceholder: '예: 초대합니다',
            subtitlePlaceholder: '예: 함께 만드는 미래',
            venuePlaceholder: '예: 코엑스 컨퍼런스홀',
            detailPlaceholder: '예: 3층 오디토리움',
            message: '행사 메시지',
            messagePlaceholder: '행사에 초대드립니다.',
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
            message: '초대 메시지',
            messagePlaceholder: '소중한 분들을 모시고\n결혼식을 올리게 되었습니다.',
          };

  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 1. 대표 정보</h2>
        <p>컨셉에 맞는 기본 정보(제목/일시/장소)를 입력하면 미리보기에 즉시 반영됩니다.</p>
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
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{labels.datetime}</span>
          <input
            type="datetime-local"
            value={value.eventDateTime}
            onChange={(event) => onChange({ eventDateTime: event.target.value })}
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{labels.venue}</span>
          <input
            type="text"
            value={value.venueName}
            onChange={(event) => onChange({ venueName: event.target.value })}
            placeholder={labels.venuePlaceholder}
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
          />
        </label>
        <label className={styles.field} style={{ gridColumn: '1 / -1' }}>
          <span className={styles.fieldLabel}>{labels.message}</span>
          <textarea
            rows={5}
            value={invitationMessage.body}
            onChange={(event) => onInvitationMessageChange({ body: event.target.value })}
            placeholder={labels.messagePlaceholder}
          />
        </label>
      </div>
    </section>
  );
}
