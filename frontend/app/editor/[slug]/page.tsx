'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import type { Invitation } from '@/src/lib/api';
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
import { ensureGuestToken, getStoredSession, setLastDraftSlug } from '@/src/lib/auth';
import { getInvitationDraft, getRuntimeDataFromDraft, saveInvitationDraft } from '@/src/lib/invitationStorage';
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
  const { language } = useI18n();
  const editorLoggedRef = useRef(false);
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
  const [funeralData, setFuneralData] = useState<ReturnType<typeof getFuneralClassicDemoData> | null>(null);
  const [hasSession, setHasSession] = useState(false);

  const isFuneralDemo = isFuneralClassicDemoSlug(slug);

  useEffect(() => {
    ensureGuestToken();
    const session = getStoredSession();
    setHasSession(Boolean(session));
  }, []);

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

      try {
        if (isFuneralDemo) {
          if (!isMounted) return;
          setFuneralData(getFuneralClassicDemoData());
          return;
        }

        const draft = getInvitationDraft(slug);
        if (draft) {
          const redirectPath = getTemplateEditorPath(draft.invitation.templateKey, slug);
          if (redirectPath && redirectPath !== `/editor/${slug}`) {
            router.replace(redirectPath);
            return;
          }
          if (!isMounted) return;
          setInvitation(draft.invitation);
          setDraftStatus(draft.status);
          setLastSavedAt(draft.savedAt);
          return;
        }

        if (!requestedTemplate) {
          router.replace('/templates');
          return;
        }

        const templateDefinition = await fetchTemplateDefinitionById(requestedTemplate);
        if (!templateDefinition) {
          router.replace('/templates');
          return;
        }

        const redirectPath = getTemplateEditorPath(templateDefinition.templateKey, slug);
        if (redirectPath && redirectPath !== `/editor/${slug}`) {
          router.replace(`${redirectPath}?template=${requestedTemplate}`);
          return;
        }

        const now = new Date().toISOString();
        const newDraft: Invitation = {
          id: slug,
          slug,
          title: null,
          eventDate: null,
          locationText: null,
          message: null,
          templateKey: templateDefinition.templateKey,
          musicKey: 'piano_wedding',
          countryCode: 'GLOBAL',
          language: 'ko',
          status: 'draft',
          isPaid: false,
          canShare: true,
          paidAt: null,
          isOwner: true,
          createdAt: now,
          updatedAt: now,
          data: templateDefinition.templateKey === 'funeral_classic' ? getFuneralClassicDemoData() : undefined,
        };
        if (!isMounted) return;
        setInvitation(newDraft);
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
  }, [slug, router, isFuneralDemo, requestedTemplate]);

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
    const runtimeData = getRuntimeDataFromDraft(slug);
    if (isWeddingInvitationData(runtimeData)) {
      return createWeddingEditorStateFromDraft(invitation, runtimeData);
    }
    return createWeddingEditorState(invitation);
  }, [editorType, invitation, slug]);
  const funeralInitialState = useMemo(() => {
    if (funeralData) {
      return createFuneralEditorState(funeralData);
    }
    if (!invitation || editorType !== 'funeral') {
      return null;
    }

    const runtimeData = getRuntimeDataFromDraft(slug);
    const invitationData = isFuneralInvitationData(invitation.data) ? invitation.data : undefined;
    return createFuneralEditorState(isFuneralInvitationData(runtimeData) ? runtimeData : invitationData ?? null);
  }, [editorType, funeralData, invitation, slug]);

  const handleSave = async (state: WeddingEditorState): Promise<void> => {
    if (!slug) return;

    setSaving(true);
    setError(null);
    setSaveError(null);
    setSaveNotice(null);

    try {
      const invitationPayload = weddingEditorStateToInvitation(state, slug);
      const runtimeData = buildWeddingClassicPreviewData(state);
      saveInvitationDraft(slug, invitationPayload, runtimeData, 'draft');
      setLastDraftSlug(slug);
      setInvitation({ ...invitationPayload, status: 'draft' });
      setDraftStatus('draft');
      setLastSavedAt(new Date().toISOString());
    } catch (err) {
      setSaveError('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.');
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
    router.push(`/preview/${slug}`);
  };

  const handlePublish = async (state: WeddingEditorState) => {
    if (!slug) return;
    setPublishing(true);
    setSaveError(null);
    setSaveNotice(null);
    try {
      const invitationPayload = weddingEditorStateToInvitation(state, slug);
      const runtimeData = buildWeddingClassicPreviewData(state);
      saveInvitationDraft(slug, invitationPayload, runtimeData, 'published');
      setLastDraftSlug(slug);
      setInvitation({ ...invitationPayload, status: 'published' });
      setDraftStatus('published');
      setLastSavedAt(new Date().toISOString());
      router.push(`/invitation/${slug}`);
    } catch {
      setSaveError('공개에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setPublishing(false);
    }
  };

  const handleFuneralSave = async (state: FuneralEditorState) => {
    if (!slug) return;

    setSaveError(null);

    const now = new Date().toISOString();
    const invitationPayload: Invitation = {
      ...(invitation ?? {
        id: slug,
        slug,
        templateKey: 'funeral_classic',
        countryCode: 'GLOBAL',
        language: 'ko',
        status: 'draft',
        isPaid: false,
        canShare: true,
        createdAt: now,
        updatedAt: now,
      }),
      templateKey: 'funeral_classic',
      title: `${state.deceasedName} 부고장`,
      eventDate: state.schedule.funeralDate,
      locationText: state.funeralHall.address || state.funeralHall.name,
      message: state.message,
      data: state,
      status: 'draft',
      updatedAt: now,
    };

    saveInvitationDraft(slug, invitationPayload, state, 'draft');
    setInvitation(invitationPayload);
    setDraftStatus('draft');
    setLastSavedAt(now);
    setSaveNotice('로컬 초안에 저장되었습니다.');
    setTimeout(() => setSaveNotice(null), 2000);
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
        draftStatus={draftStatus}
        lastSavedAt={lastSavedAt}
      />
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>지원하지 않는 템플릿입니다.</h1>
      <p>Registry에 연결된 editorType을 확인해 주세요.</p>
    </div>
  );
}
