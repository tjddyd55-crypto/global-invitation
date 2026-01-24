'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MessageCardEditor from '@/src/editors/messageCard/MessageCardEditor';
import { createMessageCardEditorState } from '@/src/editors/messageCard/state/messageCardEditor.initial';
import type { MessageCardEditorState } from '@/src/editors/messageCard/state/messageCardEditor.types';
import {
  getMessageCardDemoData,
  isMessageCardDemoSlug,
} from '@/src/templates/messageThankYou/data';
import type { MessageCardData } from '@/src/models/messageCard';
import MessageSimpleEditor from '@/src/editors/messageSimple/MessageSimpleEditor';
import { getMessageSimpleDemoData, isMessageSimpleDemoSlug } from '@/src/templates/messageSimple/data';
import type { MessageCardSimple } from '@/src/models/messageSimple';

type EditorError = {
  title: string;
  message: string;
};

export default function MessageCardEditorPage() {
  const params = useParams();
  const router = useRouter();
  const slugParam = params.slug;
  const slug = typeof slugParam === 'string' ? slugParam : Array.isArray(slugParam) ? slugParam[0] : '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<EditorError | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [data, setData] = useState<MessageCardData | null>(null);
  const [simpleData, setSimpleData] = useState<MessageCardSimple | null>(null);

  const isDemo = isMessageCardDemoSlug(slug);
  const isSimpleDemo = isMessageSimpleDemoSlug(slug);

  useEffect(() => {
    if (!slug) {
      router.replace('/create');
      return;
    }
    setData(null);
    setSimpleData(null);
    setError(null);

    if (isSimpleDemo) {
      setSimpleData(getMessageSimpleDemoData());
      setLoading(false);
      return;
    }

    if (isDemo) {
      setData(getMessageCardDemoData());
      setLoading(false);
      return;
    }

    setError({
      title: '메시지카드를 찾을 수 없습니다.',
      message: '현재는 demo-thank-you만 지원합니다.',
    });
    setLoading(false);
  }, [slug, router, isDemo, isSimpleDemo]);

  const initialState = useMemo(() => (data ? createMessageCardEditorState(data) : null), [data]);
  const simpleInitialState = useMemo(() => (simpleData ? simpleData : null), [simpleData]);

  const handleSave = async (_state: MessageCardEditorState) => {
    setSaveNotice('로컬 상태에 저장되었습니다. (v1은 서버 저장 없음)');
    setTimeout(() => setSaveNotice(null), 2000);
  };

  const handleSimpleSave = async (_state: MessageCardSimple) => {
    setSaveNotice('로컬 상태에 저장되었습니다. (v1은 서버 저장 없음)');
    setTimeout(() => setSaveNotice(null), 2000);
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (error && !data && !simpleData) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h1>{error.title}</h1>
        <p style={{ color: '#d0653b' }}>{error.message}</p>
      </div>
    );
  }

  if (simpleInitialState) {
    return (
      <MessageSimpleEditor
        initialState={simpleInitialState}
        onSave={handleSimpleSave}
        saveNotice={saveNotice}
      />
    );
  }

  if (!initialState) {
    return null;
  }

  return (
    <MessageCardEditor
      initialState={initialState}
      onSave={handleSave}
      saveNotice={saveNotice}
    />
  );
}
