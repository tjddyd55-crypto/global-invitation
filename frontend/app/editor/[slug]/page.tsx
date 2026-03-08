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
  isWeddingClassicTemplate,
} from '@/src/templates/weddingClassic/data';
import {
  getFuneralClassicDemoData,
  isFuneralClassicDemoSlug,
  isFuneralClassicTemplate,
} from '@/src/templates/funeralClassic/data';
import { useI18n } from '@/src/contexts/I18nContext';
import { logEvent } from '@/src/lib/events';
import { buildCanonicalUrl } from '@/src/lib/siteUrl';
import { ensureGuestToken, getStoredSession, setLastDraftSlug } from '@/src/lib/auth';
import { getInvitationDraft, getRuntimeDataFromDraft, saveInvitationDraft } from '@/src/lib/invitationStorage';

type EditorError = {
  title: string;
  message: string;
};

const EVENT_TRACKING_ENABLED = false;
let didWarnEventTracking = false;

type EditorTemplateParam = 'FULL' | 'SIMPLE';

function normalizeTemplateParam(template: string | null): EditorTemplateParam | null {
  if (template === 'FULL' || template === 'SIMPLE') {
    return template;
  }
  return null;
}

function resolveTemplateKeyFromParam(template: EditorTemplateParam): Invitation['templateKey'] {
  if (template === 'FULL') {
    return 'wedding_classic';
  }
  return 'classic';
}

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
  const normalizedTemplate = normalizeTemplateParam(requestedTemplate);
  const { language } = useI18n();
  const editorLoggedRef = useRef(false);
  const pageUrl = buildCanonicalUrl(`/invitation/${slug}`);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<EditorError | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
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

    setLoading(true);
    setError(null);
    setInvitation(null);
    setFuneralData(null);
    setDraftStatus('draft');
    setLastSavedAt(null);

    try {
      if (isFuneralDemo) {
        setFuneralData(getFuneralClassicDemoData());
        setLoading(false);
        return;
      }

      const draft = getInvitationDraft(slug);
      if (draft) {
        setInvitation(draft.invitation);
        setDraftStatus(draft.status);
        setLastSavedAt(draft.savedAt);
        setLoading(false);
        return;
      }

      if (!normalizedTemplate) {
        router.replace('/templates');
        setLoading(false);
        return;
      }

      const now = new Date().toISOString();
      const templateKey = resolveTemplateKeyFromParam(normalizedTemplate);
      const newDraft: Invitation = {
        id: slug,
        slug,
        title: null,
        eventDate: null,
        locationText: null,
        message: null,
        templateKey,
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
      };
      setInvitation(newDraft);
    } catch {
      setError({
        title: '일시적인 오류입니다.',
        message: '다시 시도해 주세요.',
      });
    } finally {
      setLoading(false);
    }
  }, [slug, router, isFuneralDemo, normalizedTemplate]);

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
      const templateType = isFuneralClassicTemplate(invitation.templateKey) ? 'funeral' : 'wedding';
      trackEvent({ eventType: 'editor_open', templateType, language, pageUrl });
      editorLoggedRef.current = true;
    }
  }, [funeralData, invitation, language, pageUrl]);

  const initialState = useMemo(() => {
    if (!invitation) return null;
    const runtimeData = getRuntimeDataFromDraft(slug);
    if (runtimeData) {
      return createWeddingEditorStateFromDraft(invitation, runtimeData);
    }
    return createWeddingEditorState(invitation);
  }, [invitation, slug]);
  const funeralInitialState = useMemo(
    () => (funeralData ? createFuneralEditorState(funeralData) : null),
    [funeralData]
  );

  const handleSave = async (state: WeddingEditorState): Promise<void> => {
    if (!slug) return;

    setSaving(true);
    setError(null);
    setSaveError(null);

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

  const handleFuneralSave = async (_state: FuneralEditorState) => {
    setSaveError(null);
    alert('데모에서는 저장되지 않습니다.');
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
    return <FuneralEditor initialState={funeralInitialState} onSave={handleFuneralSave} />;
  }

  if (!invitation || !initialState) {
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

  if (!isWeddingClassicTemplate(invitation.templateKey)) {
    if (isFuneralClassicTemplate(invitation.templateKey)) {
      return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
          <h1>부고장 에디터는 demo-funeral-classic에서 확인할 수 있습니다.</h1>
          <p>실제 데이터 연동은 다음 단계에서 진행됩니다.</p>
        </div>
      );
    }
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h1>지원하지 않는 템플릿입니다.</h1>
        <p>현재는 wedding_classic 템플릿만 결혼식 에디터를 지원합니다.</p>
      </div>
    );
  }

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
