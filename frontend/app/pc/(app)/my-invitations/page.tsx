'use client';

import MyInvitationsPage from '@/src/features/invitations/ui/pc/MyInvitationsPage';

/** QA: /pc/my-invitations — Desktop 셸 고정 */
export default function PcMyInvitationsPage() {
  return (
    <MyInvitationsPage
      nextPath="/pc/my-invitations"
      createHref="/pc/templates"
      editorHrefFor={(id) => `/pc/editor/${id}`}
    />
  );
}
