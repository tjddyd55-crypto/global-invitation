/**
 * Future Extension (inactive) – 렌더링 위치만 예약.
 * 실제 구현 없음. v1.2 확장 시 활성화.
 * STEP H: 확장 가능 구조 유지 (data/reason/futureKey는 추후 활성화 시 사용).
 */

export type DisabledPlaceholderProps = {
  label: string;
  className?: string;
  /** 추후 확장 시 payload (현재 미사용) */
  data?: unknown;
  /** 추후 확장 시 비활성 사유 (현재 미사용) */
  reason?: string;
  /** 추후 확장 시 Contract 키 (현재 미사용) */
  futureKey?: string;
};

export default function DisabledPlaceholder({ label, className }: DisabledPlaceholderProps) {
  return (
    <section className={className} aria-hidden data-extension={label}>
      <span>Future: {label}</span>
    </section>
  );
}
