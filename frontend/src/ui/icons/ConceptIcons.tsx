import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

function BaseIcon({ size = 24, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Wedding concept — Heart */
export function HeartIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M19.5 12.57 12 20 4.5 12.57A5 5 0 0 1 12 5.2a5 5 0 0 1 7.5 7.37Z" />
    </BaseIcon>
  );
}

/** Funeral concept — BookOpen */
export function BookOpenIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 7v13" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H12" />
      <path d="M20 19.5A2.5 2.5 0 0 0 17.5 17H12" />
      <path d="M6.5 17V5.5A2.5 2.5 0 0 1 9 3h3v14H6.5Z" />
      <path d="M17.5 17V5.5A2.5 2.5 0 0 0 15 3h-3v14h5.5Z" />
    </BaseIcon>
  );
}

/** General concept — CalendarDays */
export function CalendarDaysIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M3 11h18" />
      <path d="M8 15h.01" />
      <path d="M12 15h.01" />
      <path d="M16 15h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
    </BaseIcon>
  );
}
