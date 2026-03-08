import type { Invitation } from '@/src/models/invitation';
import {
  buildWeddingClassicData,
  getSampleWeddingInvitation,
  type WeddingClassicData,
} from '@/src/templates/weddingClassic/data';
import { getInvitationDraft, getRuntimeDataFromDraft } from '@/src/lib/invitationStorage';
import { resolveRendererByTemplateKey } from '@/src/templates/registry';

export type ResolvedInvitationData = {
  invitation: Invitation;
  runtimeData: WeddingClassicData;
  source: 'draft' | 'sample';
  status: 'draft' | 'published';
};

function buildSampleFallback(): ResolvedInvitationData {
  const invitation = getSampleWeddingInvitation();
  return {
    invitation,
    runtimeData: buildWeddingClassicData(invitation),
    source: 'sample',
    status: 'draft',
  };
}

export function resolveInvitationBySlug(slug: string): ResolvedInvitationData {
  if (!slug) {
    return buildSampleFallback();
  }

  try {
    const draft = getInvitationDraft(slug);
    if (draft) {
      if (resolveRendererByTemplateKey(draft.invitation.templateKey) !== 'weddingClassic') {
        return buildSampleFallback();
      }
      const runtimeData = getRuntimeDataFromDraft(slug) ?? buildWeddingClassicData(draft.invitation);
      return {
        invitation: draft.invitation,
        runtimeData,
        source: 'draft',
        status: draft.status,
      };
    }

    return buildSampleFallback();
  } catch {
    return buildSampleFallback();
  }
}
