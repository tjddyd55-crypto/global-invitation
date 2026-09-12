'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getMusicByKey } from '@/src/constants/music';
import type { Invitation } from '@/src/lib/api';
import { buildApiUrl } from '@/src/lib/apiBase';
import { resolvePlayableInvitationMusic } from '@/src/invitation/invitationMusic';
import { resolveInvitationConceptType } from '@/src/invitation/schemas';
import { InvitationLocaleProvider } from '@/src/i18n/InvitationLocaleContext';
import { resolveInvitationProductLocale } from '@/src/i18n/productLocales';
import InvitationMusicPlayer from '@/src/features/invitation/ui/InvitationMusicPlayer';
import {
  fetchTemplateDefinitionById,
  getTemplateRegistryEntry,
  getTemplateRenderer,
} from '@/src/templates/registry';
import publicInvitationMobile from '@/src/styles/publicInvitationMobile.module.css';

export function OwnerPreviewEmbedContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!token) {
        setError('미리보기 토큰이 없습니다.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          buildApiUrl(`/api/public/owner-preview?token=${encodeURIComponent(token)}`),
          { cache: 'no-store' },
        );
        if (!response.ok) {
          throw new Error('PREVIEW_LOAD_FAILED');
        }
        const data = (await response.json()) as Invitation;
        if (!mounted) return;
        setInvitation(data);
      } catch {
        if (!mounted) return;
        setError('미리보기를 불러올 수 없습니다.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [token]);

  const invitationLocale = resolveInvitationProductLocale({
    language: invitation?.language,
    dataJson: invitation?.dataJson,
    data: invitation?.data,
  });

  const runtimeData = useMemo(() => {
    const raw = invitation?.dataJson ?? invitation?.data ?? null;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
    return { ...(raw as Record<string, unknown>), locale: invitationLocale, language: invitationLocale };
  }, [invitation, invitationLocale]);

  const playableMusic = useMemo(
    () =>
      resolvePlayableInvitationMusic(runtimeData, (key) => {
        const track = getMusicByKey(key);
        return track ? { src: track.src, title: track.title } : undefined;
      }),
    [runtimeData],
  );

  useEffect(() => {
    if (!invitation?.templateId) return;
    void fetchTemplateDefinitionById(invitation.templateId);
  }, [invitation?.templateId]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>불러오는 중...</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>{error ?? '미리보기를 표시할 수 없습니다.'}</p>
      </div>
    );
  }

  const Template = getTemplateRenderer(invitation.templateKey);
  if (!Template || !runtimeData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>템플릿을 표시할 수 없습니다.</p>
      </div>
    );
  }

  const conceptType = resolveInvitationConceptType(runtimeData, invitation.templateKey);
  const templateCategory =
    getTemplateRegistryEntry(invitation.templateKey)?.category || 'wedding';
  const fallbackTemplateKey =
    conceptType === 'FUNERAL' || templateCategory === 'funeral'
      ? 'funeral_classic'
      : 'invitation_full';

  return (
    <InvitationLocaleProvider locale={invitationLocale}>
      <div className={publicInvitationMobile.pageRoot} data-preview-mode="owner-embed">
        <Template
          data={runtimeData}
          templateKey={invitation.templateKey || fallbackTemplateKey}
          conceptType={conceptType}
          mode="preview"
        />
        {playableMusic ? (
          <InvitationMusicPlayer music={playableMusic} />
        ) : null}
      </div>
    </InvitationLocaleProvider>
  );
}
