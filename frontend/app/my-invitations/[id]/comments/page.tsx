'use client';
/* eslint-disable i18next/no-literal-string */

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import RequireAuth from '@/src/features/auth/ui/shared/RequireAuth';
import { buildApiUrl, buildRequestInit } from '@/src/lib/apiBase';

type OwnerComment = {
  id: string;
  authorName: string;
  message: string;
  isVisible: boolean;
  isPinned: boolean;
  deletedAt: string | null;
  createdAt: string;
};

export default function InvitationCommentsManagePage() {
  const params = useParams();
  const invitationId = typeof params?.id === 'string' ? params.id : '';

  return (
    <RequireAuth nextPath={`/my-invitations/${invitationId}/comments`}>
      <CommentsManager invitationId={invitationId} />
    </RequireAuth>
  );
}

function CommentsManager({ invitationId }: { invitationId: string }) {
  const [items, setItems] = useState<OwnerComment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!invitationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        buildApiUrl(`/api/invitations/${encodeURIComponent(invitationId)}/comments`),
        buildRequestInit({ credentials: 'include' })
      );
      if (!res.ok) throw new Error('댓글 목록을 불러오지 못했습니다.');
      const data = (await res.json()) as { items?: OwnerComment[] };
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [invitationId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const patch = async (commentId: string, body: { isVisible?: boolean; isPinned?: boolean }) => {
    const res = await fetch(
      buildApiUrl(`/api/invitations/${encodeURIComponent(invitationId)}/comments/${encodeURIComponent(commentId)}`),
      buildRequestInit({
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    );
    if (!res.ok) throw new Error('수정에 실패했습니다.');
    await reload();
  };

  const remove = async (commentId: string) => {
    const res = await fetch(
      buildApiUrl(`/api/invitations/${encodeURIComponent(invitationId)}/comments/${encodeURIComponent(commentId)}`),
      buildRequestInit({ method: 'DELETE', credentials: 'include' })
    );
    if (!res.ok && res.status !== 204) throw new Error('삭제에 실패했습니다.');
    await reload();
  };

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.25rem 3rem' }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>댓글·메시지 관리</h1>
      <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>
        공개 댓글은 RSVP 메시지와 별도입니다. 숨김·고정·삭제를 할 수 있습니다.
      </p>
      {loading ? <p>불러오는 중…</p> : null}
      {error ? <p style={{ color: '#b45309' }}>{error}</p> : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item) => (
          <article
            key={item.id}
            style={{
              border: '1px solid #e5e7eb',
              padding: 14,
              opacity: item.deletedAt || !item.isVisible ? 0.55 : 1,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
              <strong>{item.authorName}</strong>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{item.createdAt.slice(0, 10)}</span>
            </div>
            <p style={{ margin: '0 0 10px', whiteSpace: 'pre-wrap' }}>{item.message}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button type="button" onClick={() => void patch(item.id, { isVisible: !item.isVisible })}>
                {item.isVisible ? '숨김' : '다시 표시'}
              </button>
              <button type="button" onClick={() => void patch(item.id, { isPinned: !item.isPinned })}>
                {item.isPinned ? '고정 해제' : '고정'}
              </button>
              {!item.deletedAt ? (
                <button type="button" onClick={() => void remove(item.id)}>
                  삭제
                </button>
              ) : (
                <span style={{ fontSize: 12 }}>삭제됨</span>
              )}
            </div>
          </article>
        ))}
        {!loading && items.length === 0 ? <p>등록된 댓글이 없습니다.</p> : null}
      </div>
    </main>
  );
}
