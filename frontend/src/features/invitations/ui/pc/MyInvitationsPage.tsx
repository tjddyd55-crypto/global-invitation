'use client';

import RequireAuth from '@/src/features/auth/ui/shared/RequireAuth';
import MyInvitationsWorkspace from '@/src/features/invitations/ui/shared/MyInvitationsWorkspace';

type MyInvitationsPageProps = {
  nextPath?: string;
  createHref?: string;
  editorHrefFor?: (id: string) => string;
};

export default function MyInvitationsPage({
  nextPath = '/my-invitations',
  createHref = '/create/concept',
  editorHrefFor,
}: MyInvitationsPageProps) {
  return (
    <RequireAuth nextPath={nextPath}>
      <MyInvitationsWorkspace layout="desktop" createHref={createHref} editorHrefFor={editorHrefFor} />
    </RequireAuth>
  );
}
