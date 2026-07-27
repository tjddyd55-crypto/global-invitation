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
  type FuneralInvitation,
  getFuneralClassicDemoData,
  isFuneralClassicDemoSlug,
} from '@/src/templates/funeralClassic/data';
import type {
  FuneralInvitationData,
  InvitationConceptType,
  WeddingInvitationData,
} from '@/src/invitation/schemas';
import {
  isFuneralInvitationData,
  isWeddingInvitationData,
  resolveInvitationConceptType,
} from '@/src/invitation/schemas';
import { useI18n } from '@/src/contexts/I18nContext';
import { logEvent } from '@/src/lib/events';
import { buildCanonicalUrl } from '@/src/lib/siteUrl';
import { ensureGuestToken, getStoredSession, setGuestToken, setLastDraftSlug } from '@/src/lib/auth';
import {
  getTemplateEditorPath,
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

function resolveConceptFromQuery(value: string | null): InvitationConceptType | null {
  if (value === 'WEDDING' || value === 'FUNERAL' || value === 'GENERAL') {
    return value;
  }
  return null;
}

type FullFuneralRuntimeData = {
  templateType?: 'FULL';
  conceptType?: 'FUNERAL';
  title?: string;
  content?: string | string[];
  eventDate?: string;
  locationText?: string;
  address?: string;
  venueName?: string;
  schedule?: string[];
  heroImage?: string;
  funeralHall?: string;
  funeralDate?: string;
  contactPerson?: string;
  mapImage?: string;
  mapLat?: number;
  mapLng?: number;
  introText?: string[];
  deceasedName?: string;
};

function normalizeMessageToString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string').join('\n');
  }
  return '';
}

function parseContactPerson(value?: string): { name: string; phone: string } | null {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;

  const phoneMatch = normalized.match(/(01[0-9][- ]?\d{3,4}[- ]?\d{4}|0\d{1,2}[- ]?\d{3,4}[- ]?\d{4})/);
  if (!phoneMatch) {
    return { name: normalized, phone: '' };
  }

  const phone = phoneMatch[0].replace(/\s+/g, '');
  const name = normalized.replace(phoneMatch[0], '').trim();
  return {
    name: name || normalized,
    phone,
  };
}

function toFuneralInvitationFromFullRuntime(data: FullFuneralRuntimeData): FuneralInvitation {
  const base = getFuneralClassicDemoData();
  const scheduleList = Array.isArray(data.schedule) ? data.schedule.filter(Boolean) : [];
  const funeralDate = data.funeralDate || scheduleList[1] || data.eventDate || base.schedule.funeralDate;
  const contact = parseContactPerson(data.contactPerson);

  return {
    ...base,
    templateType: 'FULL',
    conceptType: 'FUNERAL',
    templateKey: 'invitation_full',
    deceasedName: data.deceasedName || data.title || base.deceasedName,
    deathDate: funeralDate,
    chiefMourner: contact?.name || base.chiefMourner,
    familyMembers: Array.isArray(data.introText) && data.introText.length > 0 ? data.introText : base.familyMembers,
    message: normalizeMessageToString(data.content) || base.message,
    funeralHall: {
      name: data.funeralHall || data.venueName || data.locationText || base.funeralHall.name,
      address: data.locationText || data.address || base.funeralHall.address,
      mapImage: data.mapImage || base.funeralHall.mapImage,
      mapLat: data.mapLat ?? base.funeralHall.mapLat,
      mapLng: data.mapLng ?? base.funeralHall.mapLng,
    },
    schedule: {
      wakeStart: scheduleList[0] || base.schedule.wakeStart,
      funeralDate,
      burial: scheduleList[2] || base.schedule.burial,
    },
    contact: contact
      ? { name: contact.name, phone: contact.phone }
      : base.contact,
    heroImage: data.heroImage || base.heroImage,
  };
}

function buildFullDataFromFuneralState(state: FuneralEditorState): WeddingInvitationData {
  const funeralDate = new Date(state.schedule.funeralDate);
  const normalizedDate = Number.isNaN(funeralDate.getTime()) ? new Date() : funeralDate;
  const eventDateIso = normalizedDate.toISOString();
  return {
    templateType: 'FULL',
    conceptType: 'FUNERAL',
    title: state.deceasedName ? `${state.deceasedName} 추모 초대` : '추모 초대',
    content: state.message || '',
    eventDate: eventDateIso,
    locationText: state.funeralHall.address || state.funeralHall.name || '',
    schedule: [
      state.schedule.wakeStart || '',
      state.schedule.funeralDate || '',
      state.schedule.burial || '',
    ].filter(Boolean),
    rsvpEnabled: true,
    guestbookEnabled: true,
    musicKey: 'piano_wedding',
    heroImage: state.heroImage || '/images/wedding/classic/hero.jpg',
    heroTitle: state.deceasedName ? `${state.deceasedName} 추모 초대` : '추모 초대',
    heroSubtitle: state.schedule.funeralDate || '',
    weddingDate: normalizedDate,
    weddingDateTime: state.schedule.funeralDate || eventDateIso,
    venueName: state.funeralHall.name || '',
    introQuote: state.message || '',
    introText: state.familyMembers ?? [],
    galleryImages: [],
    accounts: [],
    address: state.funeralHall.address || '',
    mapImage: state.funeralHall.mapImage,
    mapLat: state.funeralHall.mapLat,
    mapLng: state.funeralHall.mapLng,
    deceasedName: state.deceasedName,
    funeralHall: state.funeralHall.name,
    funeralDate: state.schedule.funeralDate,
    contactPerson: state.contact ? `${state.contact.name} ${state.contact.phone}`.trim() : '',
    funeral: {
      deceased: state.deceasedName,
      funeralHall: state.funeralHall.name,
      schedule: state.schedule.funeralDate,
    },
  };
}

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slugParam = params.slug;
  const slug = typeof slugParam === 'string' ? slugParam : Array.isArray(slugParam) ? slugParam[0] : '';
  const requestedTemplate = searchParams.get('template');
  const requestedToken = searchParams.get('token');
  const requestedConcept = resolveConceptFromQuery(searchParams.get('concept'));
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
  const [funeralData, setFuneralData] = useState<ReturnType<typeof getFuneralClassicDemoData> | null>(null);
  const [hasSession, setHasSession] = useState(false);
  /** 초대장당 최초 로드 시 한 번만 설정; 에디터·프리뷰 단일 기준 */
  const [initialConceptType, setInitialConceptType] = useState<InvitationConceptType | null>(null);
  const conceptType = initialConceptType;

  const isFuneralDemo = isFuneralClassicDemoSlug(slug);

  /**
   * Canonical `/editor/{slug}` 유지.
   * Mobile/Desktop 셸은 WeddingEditor → useEditorShell(viewport 1024) 로만 전환.
   * /m/editor · /pc/editor 는 QA용 고정 셸.
   */
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
      setInitialConceptType(null);

      try {
        if (isFuneralDemo) {
          if (!isMounted) return;
          setFuneralData(getFuneralClassicDemoData());
          setInitialConceptType('FUNERAL');
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
        const runtimeData = editorInvitation.dataJson ?? editorInvitation.data;
        setInitialConceptType(
          requestedConcept || resolveInvitationConceptType(runtimeData, editorInvitation.templateKey)
        );
        setLastSavedAt(editorInvitation.updatedAt ?? null);
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
  }, [slug, router, isFuneralDemo, requestedTemplate, requestedToken, requestedConcept]);

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
      const templateType = conceptType === 'FUNERAL' ? 'funeral' : 'wedding';
      trackEvent({ eventType: 'editor_open', templateType, language, pageUrl });
      editorLoggedRef.current = true;
    }
  }, [funeralData, invitation, language, pageUrl, conceptType]);

  const editorType = conceptType;

  const initialState = useMemo(() => {
    if (!invitation || !editorType || editorType === 'FUNERAL') return null;
    const runtimeData = (invitation.dataJson ?? invitation.data) as WeddingInvitationData | undefined;
    if (isWeddingInvitationData(runtimeData)) {
      const draft = createWeddingEditorStateFromDraft(invitation, runtimeData);
      return {
        ...draft,
        setup: {
          ...draft.setup,
          conceptType: editorType,
        },
      };
    }
    const created = createWeddingEditorState(invitation, { conceptType: editorType });
    return {
      ...created,
      setup: {
        ...created.setup,
        conceptType: editorType,
      },
    };
  }, [editorType, invitation]);
  const funeralInitialState = useMemo(() => {
    if (funeralData) {
      return createFuneralEditorState(funeralData);
    }
    if (!invitation || editorType !== 'FUNERAL') {
      return null;
    }

    const runtimeData = invitation.dataJson ?? invitation.data;
    if (!isFuneralInvitationData(runtimeData)) {
      return createFuneralEditorState(null);
    }

    const hasFuneralClassicShape =
      typeof (runtimeData as { templateKey?: unknown }).templateKey === 'string' &&
      typeof (runtimeData as { funeralHall?: unknown }).funeralHall === 'object';

    const normalizedData = hasFuneralClassicShape
      ? (runtimeData as FuneralInvitationData)
      : toFuneralInvitationFromFullRuntime(runtimeData as unknown as FullFuneralRuntimeData);

    return createFuneralEditorState(normalizedData);
  }, [editorType, funeralData, invitation]);

  const handleSave = async (state: WeddingEditorState): Promise<void> => {
    if (!invitation?.id) return;

    setSaving(true);
    setError(null);
    setSaveError(null);
    setSaveNotice(null);

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
    try {
      await handleSave(state);
      await publishInvitationById(invitation.id, requestedToken);
      const updated = await getInvitationForEditor(invitation.id, requestedToken);
      setInvitation(updated);
      setLastDraftSlug(updated.slug);
      setDraftStatus('published');
      setLastSavedAt(updated.updatedAt ?? new Date().toISOString());
      setSaveNotice('공개가 완료되었습니다. 공유 링크를 복사해 전달해 보세요.');
      router.push(`/my-invitations/${invitation.id}/complete`);
    } catch {
      setSaveError('공개에 실패했습니다. 권한 또는 저장 상태를 확인해 주세요.');
    } finally {
      setPublishing(false);
    }
  };

  const saveFuneralDraft = async (state: FuneralEditorState): Promise<boolean> => {
    if (!invitation?.id) return false;

    setSaving(true);
    setSaveError(null);

    const runtimeData = buildFullDataFromFuneralState(state);
    const invitationPayload: Invitation = {
      ...(invitation as Invitation),
      templateKey: 'invitation_full',
      templateType: 'FULL',
      conceptType: 'FUNERAL',
      title: `${state.deceasedName} 부고장`,
      eventDate: state.schedule.funeralDate,
      locationText: state.funeralHall.address || state.funeralHall.name,
      message: state.message,
      data: runtimeData,
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
          data_json: runtimeData,
        },
        requestedToken
      );
      setInvitation(saved);
      setDraftStatus('draft');
      setLastSavedAt(saved.updatedAt ?? new Date().toISOString());
      setSaveNotice('초안이 저장되었습니다.');
      scheduleSaveNoticeClear();
      return true;
    } catch {
      setSaveError('저장에 실패했습니다. 권한 또는 네트워크 상태를 확인해 주세요.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleFuneralSave = async (state: FuneralEditorState): Promise<void> => {
    await saveFuneralDraft(state);
  };

  const handleFuneralSaveAndExit = async (state: FuneralEditorState) => {
    const saved = await saveFuneralDraft(state);
    if (!saved) return;
    router.push('/my-invitations');
  };

  const handleFuneralPublish = async (state: FuneralEditorState) => {
    if (!invitation?.id) return;
    setPublishing(true);
    setSaveError(null);
    setSaveNotice(null);
    try {
      const saved = await saveFuneralDraft(state);
      if (!saved) return;
      await publishInvitationById(invitation.id, requestedToken);
      const updated = await getInvitationForEditor(invitation.id, requestedToken);
      setInvitation(updated);
      setLastDraftSlug(updated.slug);
      setDraftStatus('published');
      setLastSavedAt(updated.updatedAt ?? new Date().toISOString());
      setSaveNotice('공개가 완료되었습니다.');
      router.push(`/my-invitations/${invitation.id}/complete`);
    } catch {
      setSaveError('공개에 실패했습니다. 권한 또는 저장 상태를 확인해 주세요.');
    } finally {
      setPublishing(false);
    }
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
    return (
      <FuneralEditor
        initialState={funeralInitialState}
        onSave={handleFuneralSave}
        saveNotice={saveNotice}
        saveError={saveError}
        saving={saving}
        publishing={publishing}
        draftStatus={draftStatus}
        lastSavedAt={lastSavedAt}
      />
    );
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

  if (editorType === 'FUNERAL' && funeralInitialState) {
    return (
      <FuneralEditor
        initialState={funeralInitialState}
        onSave={handleFuneralSave}
        onSaveAndExit={handleFuneralSaveAndExit}
        onPublish={handleFuneralPublish}
        saving={saving}
        publishing={publishing}
        saveNotice={saveNotice}
        saveError={saveError}
        draftStatus={draftStatus}
        lastSavedAt={lastSavedAt}
      />
    );
  }

  if (editorType !== 'FUNERAL' && initialState) {
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
        saveNotice={saveNotice}
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
