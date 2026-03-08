import type { Invitation } from '@/src/models/invitation';
import {
  buildWeddingClassicData,
  getSampleWeddingInvitation,
} from '@/src/templates/weddingClassic/data';
import { getFuneralClassicDemoData } from '@/src/templates/funeralClassic/data';
import type { FuneralInvitationData, WeddingInvitationData } from '@/src/invitation/schemas';
import { isFuneralInvitationData, isWeddingInvitationData } from '@/src/invitation/schemas';
import { getInvitationDraft, getRuntimeDataFromDraft } from '@/src/lib/invitationStorage';
import { getTemplateRenderer } from '@/src/templates/registry';

export type ResolvedInvitationData = {
  invitation: Invitation;
  runtimeData: WeddingInvitationData | FuneralInvitationData;
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
      if (!getTemplateRenderer(draft.invitation.templateKey)) {
        return buildSampleFallback();
      }

      const runtimeDataFromDraft = getRuntimeDataFromDraft(slug);
      const runtimeData =
        draft.invitation.templateKey === 'funeral_classic'
          ? (isFuneralInvitationData(runtimeDataFromDraft)
              ? runtimeDataFromDraft
              : isFuneralInvitationData(draft.invitation.data)
                ? draft.invitation.data
                : getFuneralClassicDemoData())
          : isWeddingInvitationData(runtimeDataFromDraft)
            ? runtimeDataFromDraft
            : buildWeddingClassicData(draft.invitation);

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
