'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listDraftSummaries, type DraftSummary } from '@/src/lib/invitationStorage';
import MarketingLayout from '@/src/components/MarketingLayout';

export default function MyInvitationsPage() {
  const [items, setItems] = useState<DraftSummary[]>([]);

  useEffect(() => {
    setItems(listDraftSummaries());
  }, []);

  return (
    <MarketingLayout>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1rem 2.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>내 초대장 관리</h1>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          저장된 초대장을 편집하거나 공개 페이지를 확인할 수 있습니다.
        </p>
        <div style={{ marginBottom: '1rem' }}>
          <Link
            href="/templates"
            style={{
              display: 'inline-block',
              borderRadius: '999px',
              padding: '0.55rem 1rem',
              background: '#2f6fed',
              color: 'white',
              textDecoration: 'none',
            }}
          >
            새 초대장 만들기
          </Link>
        </div>
        {items.length === 0 ? (
          <div
            style={{
              border: '1px solid #e5e5e5',
              borderRadius: '10px',
              padding: '1.2rem',
              background: '#fff',
              color: '#666',
            }}
          >
            아직 저장된 초대장이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {items.map((item) => (
              <article
                key={item.slug}
                style={{
                  border: '1px solid #e5e5e5',
                  borderRadius: '10px',
                  padding: '1rem',
                  background: '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.8rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: '1rem' }}>{item.title}</h2>
                  <div style={{ marginTop: '0.35rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        borderRadius: '999px',
                        padding: '0.18rem 0.55rem',
                        background: item.status === 'published' ? '#ecf7e8' : '#f3f3f3',
                        color: item.status === 'published' ? '#4e7d3a' : '#666',
                        border: item.status === 'published' ? '1px solid #b9d4ab' : '1px solid #dfdfdf',
                      }}
                    >
                      {item.status === 'published' ? 'published' : 'draft'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>
                      저장: {new Date(item.savedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link
                    href={`/editor/${item.slug}`}
                    style={{
                      border: '1px solid #d7d7d7',
                      borderRadius: '999px',
                      padding: '0.45rem 0.9rem',
                      color: '#333',
                      textDecoration: 'none',
                    }}
                  >
                    수정
                  </Link>
                  <Link
                    href={`/invitation/${item.slug}`}
                    style={{
                      border: '1px solid #2f6fed',
                      borderRadius: '999px',
                      padding: '0.45rem 0.9rem',
                      color: '#2f6fed',
                      textDecoration: 'none',
                    }}
                  >
                    공개 페이지 보기
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </MarketingLayout>
  );
}
