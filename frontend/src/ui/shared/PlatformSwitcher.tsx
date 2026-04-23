'use client';

import { useRouter } from 'next/navigation';
import { usePlatform } from '@/src/shared/platform';
import type { Platform } from '@/src/shared/platform';

interface PlatformSwitcherProps {
  target: Platform;
  redirectTo: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * 쿠키(ui_pref)를 뒤집어서 반대 플랫폼으로 이동하는 링크.
 * - middleware 가 이후 내비게이션부터 올바른 쪽으로 보낸다.
 * - 공개 URL에서 직접 끼워 넣어 사용할 수 있다.
 */
export default function PlatformSwitcher({ target, redirectTo, className, children }: PlatformSwitcherProps) {
  const { setPreferredPlatform } = usePlatform();
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        setPreferredPlatform(target);
        router.push(redirectTo);
      }}
    >
      {children}
    </button>
  );
}
