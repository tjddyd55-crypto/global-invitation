'use client';

/**
 * Integrity check dashboard (static only).
 * No API calls, no DB connection. Document-based expectations vs code constants.
 * See: INVITATION_RUNTIME_CONTRACT.md, INVITATION_BACKEND_STUB.md.
 */

import Link from 'next/link';

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
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: 8 }}>Integrity Check</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>
        정적 기준만 표시. API/DB 호출 없음. 기준: INVITATION_RUNTIME_CONTRACT.md, INVITATION_BACKEND_STUB.md
      </p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 12 }}>Quick links</h2>
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <li>
            <Link href="/invitation/sample-wedding" style={{ color: '#0066cc' }}>
              /invitation/sample-wedding
            </Link>
          </li>
          <li>
            <Link href="/editor/demo-wedding-classic" style={{ color: '#0066cc' }}>
              /editor/demo-wedding-classic
            </Link>
          </li>
          <li>
            <Link href="/editor/sample-wedding" style={{ color: '#0066cc' }}>
              /editor/sample-wedding
            </Link>
          </li>
          <li>
            <Link href="/" style={{ color: '#0066cc' }}>
              Home
            </Link>
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 12 }}>1. UI ↔ Contract</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: 8 }}>항목</th>
              <th style={{ padding: 8 }}>내용</th>
              <th style={{ padding: 8 }}>상태</th>
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

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 12 }}>2. UI ↔ API (Stub)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: 8 }}>항목</th>
              <th style={{ padding: 8 }}>비고</th>
              <th style={{ padding: 8 }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {STUB_CHECKS.map((row, i) => (
              <tr key={i}>
                <td style={{ padding: 8 }}>{row.item}</td>
                <td style={{ padding: 8 }}>{row.note}</td>
                <td style={{ padding: 8 }}>{STATUS_LABEL[row.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 12 }}>3. API ↔ Router</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: 8 }}>Backend route</th>
              <th style={{ padding: 8 }}>Frontend caller</th>
              <th style={{ padding: 8 }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {BACKEND_ROUTES.map((route) => {
              const call = FRONTEND_CALLS.find((c) => c.route === route);
              const status: Status = call ? 'OK' : (route.startsWith('GET /health') ? 'OK' : 'Missing');
              return (
                <tr key={route}>
                  <td style={{ padding: 8 }}>{route}</td>
                  <td style={{ padding: 8 }}>{call?.caller ?? '–'}</td>
                  <td style={{ padding: 8 }}>{STATUS_LABEL[status]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 12 }}>4. DB ↔ API (정적 기준)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: 8 }}>항목</th>
              <th style={{ padding: 8 }}>내용</th>
              <th style={{ padding: 8 }}>상태</th>
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

      <p style={{ fontSize: 12, color: '#888' }}>
        이 페이지는 네트워크 요청을 하지 않습니다. 기준 문서와 코드가 바뀌면 이 목록을 수동으로 맞춰 주세요.
      </p>
    </div>
  );
}
