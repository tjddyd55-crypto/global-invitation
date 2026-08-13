'use client';

import { usePathname } from 'next/navigation';
import RequireAuth from '@/src/features/auth/ui/shared/RequireAuth';
import MyInvitationsWorkspace from '@/src/features/invitations/ui/shared/MyInvitationsWorkspace';
import { appPath, resolveAppNavPrefix } from '@/src/shared/platform/appNavPrefix';

export default function MyInvitationsScreen() {
  const pathname = usePathname() ?? '';
  const prefix = resolveAppNavPrefix(pathname);
  const createHref = appPath(prefix, '/create/concept');
  const myInvitationsHref = appPath(prefix, '/my-invitations');

  return (
    <RequireAuth nextPath={myInvitationsHref}>
      <MyInvitationsWorkspace layout="mobile" createHref={createHref} />
    </RequireAuth>
  );
}
