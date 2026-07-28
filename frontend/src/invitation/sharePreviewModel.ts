/**
 * Editor/Public/Kakao 공통 — 공유 카드 미리보기 모델.
 * 내부 데이터는 getInvitationOpenGraphSettings SSOT만 사용한다.
 */
import {
  getInvitationOpenGraphSettings,
  type InvitationOpenGraphInput,
  type OpenGraphImageMode,
} from './openGraphSettings';
import { buildAbsolutePublicInvitationUrl } from '../lib/publicInvitation';

export type InvitationSharePreviewModel = {
  title: string;
  description: string;
  imageUrl?: string;
  imageMode: OpenGraphImageMode | 'LEGACY';
  /** 전체 canonical URL. 미공개면 빈 문자열 (루트 fallback 금지). */
  canonicalUrl: string;
  /** 표시용 host + /i/{slug}. 미공개면 빈 문자열. */
  displayUrl: string;
  hasPublicUrl: boolean;
};

export function formatShareCardDisplayUrl(canonicalUrl: string): string {
  const trimmed = canonicalUrl.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    return `${parsed.host}${parsed.pathname}`.replace(/\/+$/, '');
  } catch {
    return trimmed.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  }
}

/**
 * Editor draft / persisted invitation → 메신저 공유 카드 preview model.
 * purpose=editor-preview: NONE/빈 입력 시 Hero 자동 표시 금지.
 */
export function buildInvitationSharePreviewModel(params: {
  invitationLike: InvitationOpenGraphInput;
  shareSlug?: string | null;
  siteOrigin: string;
}): InvitationSharePreviewModel {
  const shareSlug = (params.shareSlug || params.invitationLike.shareSlug || '').trim();
  const hasPublicUrl = Boolean(shareSlug);
  const siteOrigin = (params.siteOrigin || '').trim().replace(/\/+$/, '');

  const canonicalUrl = hasPublicUrl && siteOrigin
    ? buildAbsolutePublicInvitationUrl(siteOrigin, shareSlug)
    : '';

  const og = getInvitationOpenGraphSettings(
    {
      ...params.invitationLike,
      shareSlug: shareSlug || null,
    },
    canonicalUrl,
    { siteOrigin, purpose: 'editor-preview' }
  );

  return {
    title: og.title,
    description: og.description,
    imageUrl: og.imageUrl,
    imageMode: og.imageMode,
    canonicalUrl,
    displayUrl: hasPublicUrl ? formatShareCardDisplayUrl(canonicalUrl) : '',
    hasPublicUrl,
  };
}
