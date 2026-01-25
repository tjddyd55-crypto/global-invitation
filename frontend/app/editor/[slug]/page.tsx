'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getInvitation, updateInvitation } from '@/src/lib/api';
import type { Invitation } from '@/src/lib/api';
import WeddingEditor from '@/src/editors/wedding/WeddingEditor';
import { createWeddingEditorState } from '@/src/editors/wedding/state/weddingEditor.initial';
import type { WeddingEditorState } from '@/src/editors/wedding/state/weddingEditor.types';
import FuneralEditor from '@/src/editors/funeral/FuneralEditor';
import { createFuneralEditorState } from '@/src/editors/funeral/state/funeralEditor.initial';
import type { FuneralEditorState } from '@/src/editors/funeral/state/funeralEditor.types';
import {
  getWeddingClassicDemoInvitation,
  isWeddingClassicDemoSlug,
  isWeddingClassicTemplate,
} from '@/src/templates/weddingClassic/data';
import {
  getFuneralClassicDemoData,
  isFuneralClassicDemoSlug,
  isFuneralClassicTemplate,
} from '@/src/templates/funeralClassic/data';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';
import { logEvent } from '@/src/lib/events';
import { buildCanonicalUrl } from '@/src/lib/siteUrl';
import { canAccessPaidAction, notifyPaymentRequired } from '@/src/lib/payments';

type EditorError = {
  title: string;
  message: string;
};

function buildLocationText(state: WeddingEditorState): string | undefined {
  const venueName = state.basic.venueName.trim();
  const venueDetail = state.basic.venueDetail?.trim();
  if (!venueName && !venueDetail) return undefined;
  if (!venueName) return venueDetail;
  return venueDetail ? `${venueName} ${venueDetail}` : venueName;
}

function buildMessageText(state: WeddingEditorState): string | undefined {
  const body = state.invitationMessage.body.filter(Boolean);
  if (body.length === 0) return undefined;
  return body.join('\n');
}

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const slugParam = params.slug;
  const slug = typeof slugParam === 'string' ? slugParam : Array.isArray(slugParam) ? slugParam[0] : '';
  const { language, t } = useI18n();
  const editorLoggedRef = useRef(false);
  const pageUrl = buildCanonicalUrl(`/invitation/${slug}`);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<EditorError | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [funeralData, setFuneralData] = useState<ReturnType<typeof getFuneralClassicDemoData> | null>(null);

  const isDemo = isWeddingClassicDemoSlug(slug);
  const isFuneralDemo = isFuneralClassicDemoSlug(slug);

  useEffect(() => {
    if (!slug) {
      router.replace('/create');
      return;
    }

    if (isFuneralDemo) {
      setFuneralData(getFuneralClassicDemoData());
      setLoading(false);
      return;
    }

    if (isDemo) {
      setInvitation(getWeddingClassicDemoInvitation());
      setLoading(false);
      return;
    }

    async function loadInvitation() {
      try {
        const data = await getInvitation(slug);
        setInvitation(data);
      } catch (err) {
        const isNotFound = err instanceof Error && err.message === 'Invitation not found';
        setError({
          title: isNotFound ? '초대장을 찾을 수 없습니다.' : '초대장을 불러오지 못했습니다.',
          message: isNotFound ? 'slug가 올바른지 확인해 주세요.' : '네트워크 상태를 확인해 주세요.',
        });
      } finally {
        setLoading(false);
      }
    }

    loadInvitation();
  }, [slug, router, isDemo, isFuneralDemo]);

  useEffect(() => {
    if (editorLoggedRef.current) return;

    if (funeralData) {
      logEvent({ eventType: 'editor_open', templateType: 'funeral', language, pageUrl });
      editorLoggedRef.current = true;
      return;
    }

    if (invitation) {
      const templateType = isFuneralClassicTemplate(invitation.templateKey) ? 'funeral' : 'wedding';
      logEvent({ eventType: 'editor_open', templateType, language, pageUrl });
      editorLoggedRef.current = true;
    }
  }, [funeralData, invitation, language, pageUrl]);

  const initialState = useMemo(() => (invitation ? createWeddingEditorState(invitation) : null), [invitation]);
  const funeralInitialState = useMemo(
    () => (funeralData ? createFuneralEditorState(funeralData) : null),
    [funeralData]
  );

  const handleSave = async (state: WeddingEditorState) => {
    if (!slug || isDemo) {
      alert('데모에서는 저장되지 않습니다.');
      return;
    }
    if (!canAccessPaidAction({ product: 'invitation', isPaid: invitation?.isPaid, canShare: invitation?.canShare })) {
      notifyPaymentRequired(t);
      return;
    }

    setSaving(true);
    setError(null);
    setSaveError(null);

    try {
      const updated = await updateInvitation(slug, {
        title: state.basic.title || undefined,
        eventDate: state.basic.eventDateTime || undefined,
        locationText: buildLocationText(state),
        message: buildMessageText(state),
      });
      setInvitation(updated);
    } catch (err) {
      setSaveError('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
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
          onClick={() => router.push('/create')}
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
      saving={saving}
      isDemo={isDemo}
      saveError={saveError}
    />
  );
}
