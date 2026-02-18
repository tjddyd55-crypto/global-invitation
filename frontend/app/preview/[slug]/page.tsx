'use client';

/**
 * 저장된 초대장 미리보기. localStorage에서 로드. API 호출 없음.
 * WeddingClassicInvitation에 runtimeData 직접 전달.
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { resolveInvitationBySlug } from '@/src/lib/resolveInvitationData';
import { saveInvitationDraft } from '@/src/lib/invitationStorage';
import WeddingClassicInvitation from '@/src/templates/weddingClassic/WeddingClassicInvitation';
import { getShareContent, buildShareUrl, shareLink, type ShareTemplateType } from '@/src/lib/share';
import { useI18n } from '@/src/contexts/I18nContext';
import ShareFallbackNotice from '@/src/components/ShareFallbackNotice';
import type { WeddingClassicData } from '@/src/templates/weddingClassic/data';
import type { Invitation } from '@/src/lib/api';

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const slugParam = params.slug;
  const slug = typeof slugParam === 'string' ? slugParam : Array.isArray(slugParam) ? slugParam[0] : '';

  const [data, setData] = useState<WeddingClassicData | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [shared, setShared] = useState(false);
  const [shareFallbackUrl, setShareFallbackUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (!slug) {
      router.replace('/templates');
      return;
    }
    try {
      const resolved = resolveInvitationBySlug(slug);
      setInvitation(resolved.invitation);
      setData(resolved.runtimeData);
      setStatus(resolved.status);
    } catch {
      const fallback = resolveInvitationBySlug('');
      setInvitation(fallback.invitation);
      setData(fallback.runtimeData);
      setStatus('draft');
    }
  }, [slug, router]);

  const markShared = () => {
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    setShareFallbackUrl(null);
    try {
      const { title, description } = getShareContent('wedding' as ShareTemplateType, t);
      const url = buildShareUrl(`/invitation/${slug}`);
      const result = await shareLink({ url, title, text: description });
      if (result === 'shared' || result === 'copied') markShared();
      else if (result === 'manual') setShareFallbackUrl(url);
    } finally {
      setIsSharing(false);
    }
  };

  const handlePublish = async () => {
    if (!slug || !invitation || !data || isPublishing) return;
    setIsPublishing(true);
    try {
      saveInvitationDraft(slug, invitation, data, 'published');
      setStatus('published');
      router.push(`/invitation/${slug}`);
    } finally {
      setIsPublishing(false);
    }
  };

  if (!slug) return null;
  if (!data) return null;

  return (
    <>
      <div style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#f0f4ff', fontSize: '14px' }}>
        <span style={{ marginRight: '0.75rem', fontWeight: 600 }}>
          {status === 'published' ? '공개됨' : '미공개 상태'}
        </span>
        <Link href={`/editor/${slug}`} style={{ marginRight: '1rem', color: '#2f6fed' }}>편집</Link>
        <Link href={`/invitation/${slug}`} style={{ color: '#2f6fed' }}>공개 페이지 보기</Link>
        {status !== 'published' && (
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            style={{
              marginLeft: '1rem',
              border: 'none',
              background: '#2f6fed',
              color: 'white',
              borderRadius: '999px',
              padding: '0.35rem 0.8rem',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {isPublishing ? '공개 중...' : '공개하기'}
          </button>
        )}
      </div>
      <WeddingClassicInvitation
        data={data}
        invitationSlug={slug}
        onShare={handleShare}
        isShared={shared}
      />
      {shareFallbackUrl && (
        <ShareFallbackNotice url={shareFallbackUrl} onClose={() => setShareFallbackUrl(null)} />
      )}
    </>
  );
}
