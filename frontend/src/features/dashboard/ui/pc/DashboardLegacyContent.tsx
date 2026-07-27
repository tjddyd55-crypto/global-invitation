'use client';

/* eslint-disable i18next/no-literal-string */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listGuestInvitations, listMyInvitations, type InvitationSummary } from '@/src/lib/api';
import {
  clearStoredSession,
  ensureGuestToken,
  getStoredSession,
  requestMagicLink,
  type AuthSession,
} from '@/src/lib/auth';
import { buildPublicInvitationUrlPath } from '@/src/lib/publicInvitation';

/**
 * 기존 desktop dashboard 컨텐츠 (canonical /pc QA 공용).
 * 추후 Figma Desktop 대시보드 presentation 으로 교체.
 */
export default function DashboardLegacyContent() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [email, setEmail] = useState('');
  const [invites, setInvites] = useState<InvitationSummary[]>([]);
  const [guestInvites, setGuestInvites] = useState<InvitationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [previewLink, setPreviewLink] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredSession();
    setSession(stored);

    const guestToken = ensureGuestToken();
    const tasks: Promise<void>[] = [];

    if (stored) {
      tasks.push(
        listMyInvitations()
          .then((list) => setInvites(list))
          .catch(() => setNotice('초대장 목록을 불러오지 못했습니다.'))
      );
    } else {
      tasks.push(
        listGuestInvitations(guestToken)
          .then((list) => setGuestInvites(list))
          .catch(() => {
            // ignore guest failures
          })
      );
    }

    Promise.all(tasks).finally(() => setLoading(false));
  }, []);

  const handleRequestLink = async () => {
    setNotice(null);
    setPreviewLink(null);
    if (!email.trim()) {
      setNotice('이메일을 입력해 주세요.');
      return;
    }
    try {
      const response = await requestMagicLink(email.trim());
      setNotice('매직 링크를 전송했습니다.');
      if (response.previewLink) {
        setPreviewLink(response.previewLink);
      }
    } catch {
      setNotice('매직 링크 전송에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    clearStoredSession();
    setSession(null);
    setInvites([]);
    setNotice('로그아웃되었습니다.');
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ padding: '2rem', maxWidth: '720px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '1rem' }}>대시보드</h1>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>이메일로 매직 링크를 받아 로그인하세요.</p>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
            }}
          />
          <button
            type="button"
            onClick={() => void handleRequestLink()}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#2f6fed',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            링크 보내기
          </button>
        </div>

        {notice && <p style={{ color: '#d0653b', marginBottom: '1rem' }}>{notice}</p>}
        {previewLink && (
          <p style={{ marginBottom: '1.5rem' }}>
            개발용 링크: <a href={previewLink}>{previewLink}</a>
          </p>
        )}

        <section style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '0.75rem' }}>게스트 초대장</h2>
          {guestInvites.length === 0 ? (
            <p style={{ color: '#999' }}>저장된 초대장이 없습니다.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {guestInvites.map((item) => (
                <li
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 0',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <div>
                    <strong>{item.title || '제목 없음'}</strong>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>{item.slug}</div>
                  </div>
                  <Link href={`/editor/${item.slug}`} style={{ color: '#2f6fed' }}>
                    이어서 편집
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>내 초대장</h1>
          <p style={{ color: '#666' }}>{session.user.email}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            padding: '0.5rem 0.9rem',
            border: '1px solid #ddd',
            borderRadius: '6px',
            backgroundColor: '#fff',
            cursor: 'pointer',
          }}
        >
          로그아웃
        </button>
      </div>

      {notice && <p style={{ color: '#d0653b', marginBottom: '1rem' }}>{notice}</p>}

      {invites.length === 0 ? (
        <p style={{ color: '#999' }}>아직 만든 초대장이 없습니다.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {invites.map((item) => (
            <li
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 0',
                borderBottom: '1px solid #eee',
              }}
            >
              <div>
                <strong>{item.title || '제목 없음'}</strong>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  {item.status} · {new Date(item.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link href={`/editor/${item.id}`} style={{ color: '#2f6fed' }}>
                  편집
                </Link>
                <Link
                  href={
                    item.shareSlug?.trim()
                      ? buildPublicInvitationUrlPath(item.shareSlug.trim())
                      : `/invitation/${item.slug}`
                  }
                  style={{ color: '#2f6fed' }}
                >
                  보기
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section style={{ marginTop: '2.5rem' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>메시지 카드</h2>
        <p style={{ color: '#999' }}>메시지 제작/저장은 다음 단계에서 연결합니다.</p>
      </section>
    </div>
  );
}
