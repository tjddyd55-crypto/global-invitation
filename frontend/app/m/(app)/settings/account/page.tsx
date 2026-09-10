import RequireAuth from '@/src/features/auth/ui/shared/RequireAuth';
import AccountSecurityScreen from '@/src/features/auth/ui/shared/AccountSecurityScreen';

export default function MobileAccountSecurityPage() {
  return (
    <RequireAuth nextPath="/settings/account">
      <AccountSecurityScreen />
    </RequireAuth>
  );
}
