/**
 * Resolve KakaoTalk share content from a persisted invitation (save response).
 * Editor local draft만으로 SDK를 호출하지 않는다.
 */
import { getInvitationOpenGraphSettings } from '../invitation/openGraphSettings';
import { buildAbsolutePublicInvitationUrl } from './publicInvitation';
import {
  KAKAO_SHARE_FALLBACK_NOTICE,
  shareViaKakaoTalk,
  type KakaoShareMode,
  type KakaoTalkSharePayloadInput,
} from './shareKakaoTalk';

export type PersistedInvitationShareSource = {
  title?: string | null;
  eventDate?: string | null;
  locationText?: string | null;
  shareSlug?: string | null;
  slug?: string | null;
  dataJson?: unknown;
  data?: unknown;
};

export function buildKakaoTalkShareContentFromPersistedInvitation(
  invitation: PersistedInvitationShareSource,
  siteOrigin: string
): KakaoTalkSharePayloadInput {
  const shareSlug = (invitation.shareSlug || '').trim();
  if (!shareSlug) {
    throw new Error('MISSING_SHARE_SLUG');
  }

  const canonicalUrl = buildAbsolutePublicInvitationUrl(siteOrigin, shareSlug);
  const og = getInvitationOpenGraphSettings(invitation, canonicalUrl, { siteOrigin });

  return {
    title: og.title,
    description: og.description,
    imageUrl: og.imageUrl,
    canonicalUrl: og.canonicalUrl || canonicalUrl,
  };
}

/**
 * 1) persist(PATCH) → 2) shareSlug 확인 → 3) OG settings → 4) Kakao share
 */
export async function shareKakaoTalkAfterPersist(params: {
  persist: () => Promise<PersistedInvitationShareSource>;
  siteOrigin: string;
}): Promise<{ mode: KakaoShareMode; content: KakaoTalkSharePayloadInput }> {
  const saved = await params.persist();
  const content = buildKakaoTalkShareContentFromPersistedInvitation(saved, params.siteOrigin);
  const mode = await shareViaKakaoTalk(content);
  return { mode, content };
}

export { KAKAO_SHARE_FALLBACK_NOTICE };
