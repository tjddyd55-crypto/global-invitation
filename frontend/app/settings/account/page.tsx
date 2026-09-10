'use client';

import ResponsivePlatformBoundary from '@/src/shared/platform/ResponsivePlatformBoundary';
import RequireAuth from '@/src/features/auth/ui/shared/RequireAuth';
import AccountSecurityScreen from '@/src/features/auth/ui/shared/AccountSecurityScreen';

export default function AccountSecurityPage() {
  return (
    <RequireAuth nextPath="/settings/account">
      <ResponsivePlatformBoundary
        mobile={<AccountSecurityScreen />}
        desktop={<AccountSecurityScreen />}
      />
    </RequireAuth>
  );
}
