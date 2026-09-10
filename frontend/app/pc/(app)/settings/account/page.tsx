import RequireAuth from '@/src/features/auth/ui/shared/RequireAuth';
import AccountSecurityScreen from '@/src/features/auth/ui/shared/AccountSecurityScreen';

export default function PcAccountSecurityPage() {
  return (
    <RequireAuth nextPath="/settings/account">
      <AccountSecurityScreen />
    </RequireAuth>
  );
}
