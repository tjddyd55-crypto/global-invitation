/**
 * Future Extension (inactive) – 렌더링 위치만 예약.
 * 실제 구현 없음. v1.2 확장 시 활성화.
 */

type Props = { label: string; className?: string };

export default function DisabledPlaceholder({ label, className }: Props) {
  return (
    <section className={className} aria-hidden data-extension={label}>
      <span>Future: {label}</span>
    </section>
  );
}
