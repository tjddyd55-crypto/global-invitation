'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import type { Invitation } from '@/src/lib/api';
import {
  cloneTemplateInvitation,
  getInvitationForEditor,
  publishInvitationById,
  saveInvitationDraftById,
} from '@/src/lib/api';
import WeddingEditor from '@/src/editors/wedding/WeddingEditor';
import {
  createWeddingEditorState,
  createWeddingEditorStateFromDraft,
} from '@/src/editors/wedding/state/weddingEditor.initial';
import {
  buildWeddingClassicPreviewData,
  weddingEditorStateToInvitation,
} from '@/src/editors/wedding/state/weddingEditor.mapper';
import type { WeddingEditorState } from '@/src/editors/wedding/state/weddingEditor.types';
import FuneralEditor from '@/src/editors/funeral/FuneralEditor';
import { createFuneralEditorState } from '@/src/editors/funeral/state/funeralEditor.initial';
import type { FuneralEditorState } from '@/src/editors/funeral/state/funeralEditor.types';
import {
  getFuneralClassicDemoData,
  isFuneralClassicDemoSlug,
} from '@/src/templates/funeralClassic/data';
import type { FuneralInvitationData, WeddingInvitationData } from '@/src/invitation/schemas';
import { isFuneralInvitationData, isWeddingInvitationData } from '@/src/invitation/schemas';
import { useI18n } from '@/src/contexts/I18nContext';
import { logEvent } from '@/src/lib/events';
import { buildCanonicalUrl } from '@/src/lib/siteUrl';
import { ensureGuestToken, getStoredSession, setGuestToken, setLastDraftSlug } from '@/src/lib/auth';
import {
  fetchTemplateDefinitionById,
  getTemplateEditorPath,
  getTemplateEditorType,
} from '@/src/templates/registry';

type EditorError = {
  title: string;
  message: string;
};

const EVENT_TRACKING_ENABLED = false;
let didWarnEventTracking = false;

function trackEvent(payload: Parameters<typeof logEvent>[0]) {
  if (!EVENT_TRACKING_ENABLED) {
    if (!didWarnEventTracking) {
      console.warn('[editor] Event tracking disabled. See docs/INVITATION_BACKEND_STUB.md');
      didWarnEventTracking = true;
    }
    return;
  }
  void logEvent(payload);
}

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slugParam = params.slug;
  const slug = typeof slugParam === 'string' ? slugParam : Array.isArray(slugParam) ? slugParam[0] : '';
  const requestedTemplate = searchParams.get('template');
  const requestedToken = searchParams.get('token');
  const { language } = useI18n();
  const editorLoggedRef = useRef(false);
  const saveNoticeTimerRef = useRef<number | null>(null);
  const pageUrl = buildCanonicalUrl(`/invitation/${slug}`);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<EditorError | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<'draft' | 'published'>('draft');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareUiNotice, setShareUiNotice] = useState<string | null>(null);
  const [funeralData, setFuneralData] = useState<ReturnType<typeof getFuneralClassicDemoData> | null>(null);
  const [hasSession, setHasSession] = useState(false);

  const isFuneralDemo = isFuneralClassicDemoSlug(slug);

  useEffect(() => {
    ensureGuestToken();
    const session = getStoredSession();
    setHasSession(Boolean(session));
  }, []);

  useEffect(() => {
    return () => {
      if (saveNoticeTimerRef.current) {
        window.clearTimeout(saveNoticeTimerRef.current);
      }
    };
  }, []);

  const scheduleSaveNoticeClear = () => {
    if (saveNoticeTimerRef.current) {
      window.clearTimeout(saveNoticeTimerRef.current);
    }
    saveNoticeTimerRef.current = window.setTimeout(() => {
      setSaveNotice(null);
    }, 2000);
  };

  useEffect(() => {
    if (!slug) {
      router.replace('/templates');
      return;
    }

    let isMounted = true;

    async function initializeEditor() {
      setLoading(true);
      setError(null);
      setInvitation(null);
      setFuneralData(null);
      setDraftStatus('draft');
      setLastSavedAt(null);
      setSaveNotice(null);
      setShareUrl(null);
      setShareUiNotice(null);

      try {
        if (isFuneralDemo) {
          if (!isMounted) return;
          setFuneralData(getFuneralClassicDemoData());
          return;
        }

        if (requestedToken) {
          setGuestToken(requestedToken);
        }

        let editorInvitation: Invitation | null = null;
        try {
          editorInvitation = await getInvitationForEditor(slug, requestedToken);
        } catch {
          editorInvitation = null;
        }

        if (!editorInvitation && requestedTemplate) {
          const cloned = await cloneTemplateInvitation(requestedTemplate);
          if (cloned.guest_token) {
            setGuestToken(cloned.guest_token);
          }
          if (cloned.editor_url && cloned.editor_url !== `/editor/${slug}`) {
            router.replace(cloned.editor_url);
            return;
          }
          editorInvitation = await getInvitationForEditor(cloned.invitation_id || slug, cloned.guest_token || requestedToken);
        }

        if (!editorInvitation) {
          router.replace('/templates');
          return;
        }

        const redirectPath = getTemplateEditorPath(editorInvitation.templateKey, editorInvitation.id);
        if (redirectPath && redirectPath !== `/editor/${editorInvitation.id}`) {
          router.replace(redirectPath);
          return;
        }

        if (!isMounted) return;
        setInvitation(editorInvitation);
        const normalizedStatus = editorInvitation.status === 'published' ? 'published' : 'draft';
        setDraftStatus(normalizedStatus);
        setLastSavedAt(editorInvitation.updatedAt ?? null);
        if (editorInvitation.shareSlug) {
          setShareUrl(`/i/${editorInvitation.shareSlug}`);
        }
      } catch {
        if (!isMounted) return;
        setError({
          title: '일시적인 오류입니다.',
          message: '다시 시도해 주세요.',
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void initializeEditor();

    return () => {
      isMounted = false;
    };
  }, [slug, router, isFuneralDemo, requestedTemplate, requestedToken]);

  useEffect(() => {
    if (!invitation || hasSession) return;
    if (invitation.isOwner) {
      setLastDraftSlug(invitation.slug);
    }
  }, [invitation, hasSession]);

  useEffect(() => {
    if (editorLoggedRef.current) return;

    if (funeralData) {
      trackEvent({ eventType: 'editor_open', templateType: 'funeral', language, pageUrl });
      editorLoggedRef.current = true;
      return;
    }

    if (invitation) {
      const templateType = getTemplateEditorType(invitation.templateKey) === 'funeral' ? 'funeral' : 'wedding';
      trackEvent({ eventType: 'editor_open', templateType, language, pageUrl });
      editorLoggedRef.current = true;
    }
  }, [funeralData, invitation, language, pageUrl]);

  const editorType = useMemo(
    () => getTemplateEditorType(invitation?.templateKey ?? (isFuneralDemo ? 'funeral_classic' : null)),
    [invitation?.templateKey, isFuneralDemo]
  );

  const initialState = useMemo(() => {
    if (!invitation || editorType !== 'wedding') return null;
    const runtimeData = (invitation.dataJson ?? invitation.data) as WeddingInvitationData | undefined;
    if (isWeddingInvitationData(runtimeData)) {
      return createWeddingEditorStateFromDraft(invitation, runtimeData);
    }
    return createWeddingEditorState(invitation);
  }, [editorType, invitation]);
  const funeralInitialState = useMemo(() => {
    if (funeralData) {
      return createFuneralEditorState(funeralData);
    }
    if (!invitation || editorType !== 'funeral') {
      return null;
    }

    const runtimeData = invitation.dataJson ?? invitation.data;
    const invitationData = isFuneralInvitationData(runtimeData) ? runtimeData : undefined;
    return createFuneralEditorState(isFuneralInvitationData(runtimeData) ? runtimeData : invitationData ?? null);
  }, [editorType, funeralData, invitation]);

  const handleSave = async (state: WeddingEditorState): Promise<void> => {
    if (!invitation?.id) return;

    setSaving(true);
    setError(null);
    setSaveError(null);
    setSaveNotice(null);
    setShareUiNotice(null);

    try {
      const runtimeData = buildWeddingClassicPreviewData(state);
      const invitationPayload = weddingEditorStateToInvitation(state, invitation.slug || invitation.id);
      const saved = await saveInvitationDraftById(
        invitation.id,
        {
          title: invitationPayload.title,
          eventDate: invitationPayload.eventDate,
          locationText: invitationPayload.locationText,
          message: invitationPayload.message,
          templateKey: invitationPayload.templateKey,
          musicKey: invitationPayload.musicKey,
          data_json: runtimeData,
        },
        requestedToken
      );
      setLastDraftSlug(saved.slug);
      setInvitation(saved);
      setDraftStatus('draft');
      setLastSavedAt(saved.updatedAt ?? new Date().toISOString());
      setSaveNotice('초안이 저장되었습니다.');
      scheduleSaveNoticeClear();
    } catch (err) {
      setSaveError('저장에 실패했습니다. 권한 또는 네트워크 상태를 확인해 주세요.');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndExit = async (state: WeddingEditorState) => {
    try {
      await handleSave(state);
    } catch {
      return;
    }
    router.push('/my-invitations');
  };

  const handlePublish = async (state: WeddingEditorState) => {
    if (!invitation?.id) return;
    setPublishing(true);
    setSaveError(null);
    setSaveNotice(null);
    setShareUiNotice(null);
    try {
      await handleSave(state);
      const published = await publishInvitationById(invitation.id, requestedToken);
      const updated = await getInvitationForEditor(invitation.id, requestedToken);
      setInvitation(updated);
      setLastDraftSlug(updated.slug);
      setDraftStatus('published');
      setLastSavedAt(updated.updatedAt ?? new Date().toISOString());
      setShareUrl(published.share_url);
      setSaveNotice('공개가 완료되었습니다. 공유 링크를 복사해 전달해 보세요.');
    } catch {
      setSaveError('공개에 실패했습니다. 권한 또는 저장 상태를 확인해 주세요.');
    } finally {
      setPublishing(false);
    }
  };

  const handleFuneralSave = async (state: FuneralEditorState) => {
    if (!invitation?.id) return;

    setSaveError(null);
    setShareUiNotice(null);

    const invitationPayload: Invitation = {
      ...(invitation as Invitation),
      templateKey: 'funeral_classic',
      title: `${state.deceasedName} 부고장`,
      eventDate: state.schedule.funeralDate,
      locationText: state.funeralHall.address || state.funeralHall.name,
      message: state.message,
      data: state,
      status: 'draft',
    };

    try {
      const saved = await saveInvitationDraftById(
        invitation.id,
        {
          title: invitationPayload.title,
          eventDate: invitationPayload.eventDate,
          locationText: invitationPayload.locationText,
          message: invitationPayload.message,
          templateKey: invitationPayload.templateKey,
          data_json: state,
        },
        requestedToken
      );
      setInvitation(saved);
      setDraftStatus('draft');
      setLastSavedAt(saved.updatedAt ?? new Date().toISOString());
      setSaveNotice('초안이 저장되었습니다.');
      scheduleSaveNoticeClear();
    } catch {
      setSaveError('저장에 실패했습니다. 권한 또는 네트워크 상태를 확인해 주세요.');
      return;
    }
  };

  const shareAbsoluteUrl = useMemo(() => {
    if (!shareUrl) return '';
    if (typeof window === 'undefined') return shareUrl;
    return shareUrl.startsWith('http') ? shareUrl : `${window.location.origin}${shareUrl}`;
  }, [shareUrl]);

  const handleCopyShareUrl = async () => {
    if (!shareAbsoluteUrl || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      setShareUiNotice('공유 URL 복사 기능을 사용할 수 없습니다.');
      return;
    }
    await navigator.clipboard.writeText(shareAbsoluteUrl);
    setShareUiNotice('공유 URL이 복사되었습니다.');
  };

  const handleKakaoShare = () => {
    if (!shareAbsoluteUrl || typeof window === 'undefined') return;
    const url = `https://story.kakao.com/share?url=${encodeURIComponent(shareAbsoluteUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleFacebookShare = () => {
    if (!shareAbsoluteUrl || typeof window === 'undefined') return;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareAbsoluteUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleImageDownload = async () => {
    if (typeof window === 'undefined' || !invitation) return;
    const runtimeData = invitation.dataJson ?? invitation.data;
    if (!isWeddingInvitationData(runtimeData) || !runtimeData.heroImage) {
      setShareUiNotice('다운로드할 대표 이미지가 없습니다.');
      return;
    }
    const anchor = document.createElement('a');
    anchor.href = runtimeData.heroImage;
    anchor.download = `invitation-${invitation.id}.jpg`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const handlePdfDownload = () => {
    if (typeof window === 'undefined') return;
    window.print();
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h1>{error.title}</h1>
        <p style={{ color: '#d0653b' }}>{error.message}</p>
        <button
          onClick={() => router.push('/templates')}
          style={{
            padding: '0.5rem 1rem',
            marginTop: '1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          처음으로
        </button>
      </div>
    );
  }

  if (isFuneralDemo && funeralInitialState) {
    return <FuneralEditor initialState={funeralInitialState} onSave={handleFuneralSave} saveNotice={saveNotice} />;
  }

  if (!invitation) {
    return null;
  }

  if (!isFuneralDemo && !invitation.isOwner) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h1>소유자만 편집할 수 있습니다.</h1>
        <p>이 초대장은 다른 계정의 초대장입니다.</p>
      </div>
    );
  }

  if (editorType === 'funeral' && funeralInitialState) {
    return (
      <FuneralEditor
        initialState={funeralInitialState}
        onSave={handleFuneralSave}
        saveNotice={saveNotice}
        saveError={saveError}
      />
    );
  }

  if (editorType === 'wedding' && initialState) {
    return (
      <>
        {shareUrl && (
          <section
            style={{
              margin: '1rem auto 0',
              maxWidth: '1200px',
              border: '1px solid #d6e2ff',
              background: '#f7faff',
              borderRadius: '12px',
              padding: '0.9rem 1rem',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1rem' }}>공유</h2>
            <p style={{ margin: '0.45rem 0 0.75rem', color: '#496093' }}>
              공개가 완료되었습니다. 공유 URL: <strong>{shareAbsoluteUrl}</strong>
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button type="button" onClick={handleCopyShareUrl}>URL 복사</button>
              <button type="button" onClick={handleKakaoShare}>카카오 공유</button>
              <button type="button" onClick={handleFacebookShare}>페이스북 공유</button>
              <button type="button" onClick={handleImageDownload}>이미지 다운로드</button>
              <button type="button" onClick={handlePdfDownload}>PDF 다운로드</button>
            </div>
            {shareUiNotice && <p style={{ margin: '0.5rem 0 0', color: '#315aa3' }}>{shareUiNotice}</p>}
          </section>
        )}
        <WeddingEditor
          key={invitation.id}
          initialState={initialState}
          pageUrl={pageUrl}
          onSave={handleSave}
          onSaveAndExit={handleSaveAndExit}
          onPublish={handlePublish}
          saving={saving}
          publishing={publishing}
          isDemo={false}
          saveError={saveError}
          saveNotice={saveNotice}
          draftStatus={draftStatus}
          lastSavedAt={lastSavedAt}
        />
      </>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>지원하지 않는 템플릿입니다.</h1>
      <p>Registry에 연결된 editorType을 확인해 주세요.</p>
    </div>
  );
}
