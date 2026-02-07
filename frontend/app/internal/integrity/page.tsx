'use client';

/**
 * Integrity check dashboard (static only).
 * No API calls, no DB connection. Document-based expectations vs code constants.
 * See: INVITATION_RUNTIME_CONTRACT.md, INVITATION_BACKEND_STUB.md.
 */

import React from 'react';
import Link from 'next/link';

// 스타일을 모듈 레벨에 두어 JSX 내 숫자 리터럴로 인한 파서 오류 방지
const ROOT_STYLE: React.CSSProperties = { maxWidth: '960px', margin: '0 auto', padding: '24px', fontFamily: 'system-ui, sans-serif' };
const H1_STYLE: React.CSSProperties = { marginBottom: '8px' };
const INTRO_P_STYLE: React.CSSProperties = { color: '#666', marginBottom: '24px' };
const SECTION_STYLE: React.CSSProperties = { marginBottom: '32px' };
const H2_STYLE: React.CSSProperties = { marginBottom: '12px' };
const QUICK_LINKS_UL: React.CSSProperties = { listStyle: 'none', padding: '0', display: 'flex', gap: '16px', flexWrap: 'wrap' };
const LINK_STYLE: React.CSSProperties = { color: '#0066cc' };
const TABLE_STYLE: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '14px' };
const TH_ROW_STYLE: React.CSSProperties = { borderBottom: '2px solid #ddd', textAlign: 'left' };
const CELL_STYLE: React.CSSProperties = { padding: '8px' };
const FOOTER_P_STYLE: React.CSSProperties = { fontSize: '12px', color: '#888' };

type Status = 'OK' | 'Mismatch' | 'Missing' | 'Stub';

const STATUS_LABEL: Record<Status, string> = {
  OK: '✅ OK',
  Mismatch: '⚠️ Mismatch',
  Missing: '❌ Missing',
  Stub: '⏸️ Stub / Disabled',
};

// §1b Contract fields (INVITATION_RUNTIME_CONTRACT.md)
const CONTRACT_FIELDS = [
  'heroImage', 'heroTitle', 'heroOverlayText', 'heroSubtitle',
  'weddingDateTime', 'venueName', 'address', 'mapImage', 'transportInfo', 'parkingInfo',
  'weddingDate', 'calendarTitle', 'galleryImages', 'introText', 'introQuote',
  'rsvp.enabled', 'rsvpTitle', 'rsvpDescription', 'rsvpButton',
  'coupleNames', 'groom', 'bride', 'accountsTitle', 'accounts', 'messagesTitle', 'messages',
];

// WeddingClassicData + template usage (code)
const UI_FIELDS = [
  'heroImage', 'heroOverlayText', 'heroTitle', 'heroSubtitle', 'coupleNames',
  'weddingDateTime', 'venueName', 'introQuote', 'introText', 'groom', 'bride',
  'weddingDate', 'calendarTitle', 'galleryImages', 'address', 'mapImage',
  'transportInfo', 'parkingInfo', 'rsvp', 'rsvpTitle', 'rsvpDescription', 'rsvpButton',
  'accountsTitle', 'accounts', 'messagesTitle', 'messages',
];

// Contract에 있으나 FULL v1.x 미사용 (문서 명시)
const CONTRACT_NOT_IN_UI = ['program'];

// Stub: invitation/editor flow에서 fetch 사용 여부 (정적 기준)
const STUB_CHECKS = [
  { item: 'Invitation page: GET /api/invitations/:slug', status: 'Stub' as Status, note: 'Not called; local data only' },
  { item: 'Invitation layout: metadata fetch', status: 'Stub' as Status, note: 'Static demo metadata only' },
  { item: 'POST /api/rsvp/:slug', status: 'Stub' as Status, note: 'Not implemented; localStorage only' },
  { item: 'api.ts getInvitation()', status: 'OK' as Status, note: 'Exists but not used in invitation/editor flow' },
];

// Backend routes (backend/src/index.ts + routes)
const BACKEND_ROUTES = [
  'GET /health',
  'GET /api/invitations',
  'POST /api/invitations',
  'GET /api/invitations/:slug',
  'PUT /api/invitations/:slug',
  'POST /api/events',
  'POST /api/auth/magic-link',
  'POST /api/auth/verify',
  'GET /api/auth/me',
  'POST /api/auth/transfer-guest',
];

// Frontend callers (api.ts, auth, events) – which routes are called
const FRONTEND_CALLS = [
  { route: 'POST /api/invitations', caller: 'api.createInvitation (e.g. create page)' },
  { route: 'GET /api/invitations/:slug', caller: 'api.getInvitation (not used in invitation/editor in stub)' },
  { route: 'PUT /api/invitations/:slug', caller: 'api.updateInvitation (editor save – disabled in stub)' },
  { route: 'GET /api/invitations?owner=me', caller: 'api.listMyInvitations' },
  { route: 'GET /api/invitations?guestToken=...', caller: 'api.listGuestInvitations' },
  { route: 'POST /api/auth/magic-link', caller: 'auth.requestMagicLink' },
  { route: 'POST /api/auth/verify', caller: 'auth.verifyMagicLink' },
  { route: 'POST /api/events', caller: 'events.logEvent (disabled in stub)' },
];

// DB Invitation model vs Stub doc response fields (정적 비교만)
const SCHEMA_INVITATION_FIELDS = [
  'id', 'ownerType', 'ownerId', 'userId', 'guestToken', 'slug', 'title', 'eventDate',
  'locationText', 'message', 'templateKey', 'musicKey', 'countryCode', 'language',
  'status', 'isPaid', 'canShare', 'paidAt', 'createdAt', 'updatedAt',
];
const STUB_RESPONSE_FIELDS = [
  'id', 'slug', 'title', 'eventDate', 'locationText', 'message', 'templateKey', 'status',
  'musicKey', 'countryCode', 'language', 'isPaid', 'canShare', 'paidAt', 'createdAt', 'updatedAt', 'isOwner',
];

function TableRow({
  left,
  right,
  status,
}: {
  left: string;
  right: string;
  status?: Status;
}) {
  return (
    <tr>
      <td>{left}</td>
      <td>{right}</td>
      {status != null && <td>{STATUS_LABEL[status]}</td>}
    </tr>
  );
}

export default function IntegrityPage() {
  const contractOnly = CONTRACT_NOT_IN_UI;
  const inContractNotInUi = CONTRACT_FIELDS.filter((f) => !UI_FIELDS.includes(f) && !UI_FIELDS.includes(f.split('.')[0]));
  const inUiNotInContract = UI_FIELDS.filter((f) => !CONTRACT_FIELDS.includes(f) && !CONTRACT_FIELDS.some((c) => c.startsWith(f)));

  return (
    <div style={ROOT_STYLE}>
      <h1 style={H1_STYLE}>Integrity Check</h1>
      <p style={INTRO_P_STYLE}>
        정적 기준만 표시. API/DB 호출 없음. 기준: INVITATION_RUNTIME_CONTRACT.md, INVITATION_BACKEND_STUB.md
      </p>

      <section style={SECTION_STYLE}>
        <h2 style={H2_STYLE}>Quick links</h2>
        <ul style={QUICK_LINKS_UL}>
          <li>
            <Link href="/invitation/sample-wedding" style={LINK_STYLE}>
              /invitation/sample-wedding
            </Link>
          </li>
          <li>
            <Link href="/editor/demo-wedding-classic" style={LINK_STYLE}>
              /editor/demo-wedding-classic
            </Link>
          </li>
          <li>
            <Link href="/editor/sample-wedding" style={LINK_STYLE}>
              /editor/sample-wedding
            </Link>
          </li>
          <li>
            <Link href="/" style={LINK_STYLE}>
              Home
            </Link>
          </li>
        </ul>
      </section>

      <section style={SECTION_STYLE}>
        <h2 style={H2_STYLE}>1. UI ↔ Contract</h2>
        <table style={TABLE_STYLE}>
          <thead>
            <tr style={TH_ROW_STYLE}>
              <th style={CELL_STYLE}>항목</th>
              <th style={CELL_STYLE}>내용</th>
              <th style={CELL_STYLE}>상태</th>
            </tr>
          </thead>
          <tbody>
            <TableRow
              left="Contract §1b 필드 수"
              right={`${CONTRACT_FIELDS.length} (FULL Wedding Classic)`}
              status="OK"
            />
            <TableRow
              left="UI(WeddingClassicData) 사용 필드"
              right={UI_FIELDS.length + ' 필드'}
              status={inUiNotInContract.length === 0 ? 'OK' : 'Mismatch'}
            />
            {contractOnly.length > 0 && (
              <TableRow
                left="Contract에 있으나 UI 미사용 (문서 명시)"
                right={contractOnly.join(', ')}
                status="OK"
              />
            )}
            {inContractNotInUi.length > 0 && (
              <TableRow
                left="Contract에는 있는데 UI 목록에 없음"
                right={inContractNotInUi.join(', ')}
                status="Mismatch"
              />
            )}
            {inUiNotInContract.length > 0 && (
              <TableRow
                left="UI에는 있는데 Contract 목록에 없음"
                right={inUiNotInContract.join(', ')}
                status="Mismatch"
              />
            )}
          </tbody>
        </table>
      </section>

      <section style={SECTION_STYLE}>
        <h2 style={H2_STYLE}>2. UI ↔ API (Stub)</h2>
        <table style={TABLE_STYLE}>
          <thead>
            <tr style={TH_ROW_STYLE}>
              <th style={CELL_STYLE}>항목</th>
              <th style={CELL_STYLE}>비고</th>
              <th style={CELL_STYLE}>상태</th>
            </tr>
          </thead>
          <tbody>
            {STUB_CHECKS.map((row, i) => (
              <tr key={i}>
                <td style={CELL_STYLE}>{row.item}</td>
                <td style={CELL_STYLE}>{row.note}</td>
                <td style={CELL_STYLE}>{STATUS_LABEL[row.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={SECTION_STYLE}>
        <h2 style={H2_STYLE}>3. API ↔ Router</h2>
        <table style={TABLE_STYLE}>
          <thead>
            <tr style={TH_ROW_STYLE}>
              <th style={CELL_STYLE}>Backend route</th>
              <th style={CELL_STYLE}>Frontend caller</th>
              <th style={CELL_STYLE}>상태</th>
            </tr>
          </thead>
          <tbody>
            {BACKEND_ROUTES.map((route) => {
              const call = FRONTEND_CALLS.find((c) => c.route === route);
              const status: Status = call ? 'OK' : (route.startsWith('GET /health') ? 'OK' : 'Missing');
              return (
                <tr key={route}>
                  <td style={CELL_STYLE}>{route}</td>
                  <td style={CELL_STYLE}>{call?.caller ?? '–'}</td>
                  <td style={CELL_STYLE}>{STATUS_LABEL[status]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section style={SECTION_STYLE}>
        <h2 style={H2_STYLE}>4. DB ↔ API (정적 기준)</h2>
        <table style={TABLE_STYLE}>
          <thead>
            <tr style={TH_ROW_STYLE}>
              <th style={CELL_STYLE}>항목</th>
              <th style={CELL_STYLE}>내용</th>
              <th style={CELL_STYLE}>상태</th>
            </tr>
          </thead>
          <tbody>
            <TableRow
              left="Prisma Invitation 필드 수"
              right={SCHEMA_INVITATION_FIELDS.length + ''}
              status="OK"
            />
            <TableRow
              left="Stub 응답 필드 (문서 기준)"
              right={STUB_RESPONSE_FIELDS.length + ''}
              status="OK"
            />
            <TableRow
              left="실제 DB 연결"
              right="사용 안 함 (정적 비교만)"
              status="Stub"
            />
          </tbody>
        </table>
      </section>

      <p style={FOOTER_P_STYLE}>
        이 페이지는 네트워크 요청을 하지 않습니다. 기준 문서와 코드가 바뀌면 이 목록을 수동으로 맞춰 주세요.
      </p>
    </div>
  );
}
