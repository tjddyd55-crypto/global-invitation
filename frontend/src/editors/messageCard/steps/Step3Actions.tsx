'use client';

import ToggleRow from '../components/ToggleRow';
import styles from '../messageCardEditor.module.css';
import type { MessageCardActions, MessageCardTheme } from '@/src/models/messageCard';

type Step3ActionsProps = {
  actions: MessageCardActions;
  theme?: MessageCardTheme;
  onActionsChange: (payload: Partial<MessageCardActions>) => void;
  onThemeChange: (theme: MessageCardTheme | undefined) => void;
};

export default function Step3Actions({
  actions,
  theme,
  onActionsChange,
  onThemeChange,
}: Step3ActionsProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>STEP 3. 액션 버튼</h2>
        <p>공유 버튼 노출 여부와 테마를 설정합니다.</p>
      </div>
      <div className={styles.toggleGroup}>
        <ToggleRow
          label="일정 등록"
          description="캘린더 파일(ICS) 다운로드 버튼"
          checked={actions.calendar}
          onChange={(checked) => onActionsChange({ calendar: checked })}
        />
        <ToggleRow
          label="링크 복사"
          description="현재 페이지 링크 복사"
          checked={actions.copyLink}
          onChange={(checked) => onActionsChange({ copyLink: checked })}
        />
        <ToggleRow
          label="카카오 공유"
          description="카카오 공유 버튼 노출"
          checked={actions.kakaoShare}
          onChange={(checked) => onActionsChange({ kakaoShare: checked })}
        />
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>테마</span>
        <select value={theme ?? 'light'} onChange={(event) => onThemeChange(event.target.value as MessageCardTheme)}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
    </section>
  );
}
