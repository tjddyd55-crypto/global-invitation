/** Admin UI display formatters — Korean labels for operators. Stored enums unchanged. */

export function formatConceptLabel(concept: string): string {
  switch (concept) {
    case 'WEDDING':
      return '웨딩';
    case 'FUNERAL':
      return '장례';
    case 'GENERAL':
      return '일반 행사';
    case 'ORGANIZATION':
      return '단체/조직';
    default:
      return concept;
  }
}

export function formatInvitationStatus(status: string): string {
  switch (String(status).toUpperCase()) {
    case 'DRAFT':
      return '작성 중';
    case 'PUBLISHED':
      return '공개 완료';
    default:
      return status;
  }
}

export function formatCatalogStatus(status: string): string {
  switch (String(status).toUpperCase()) {
    case 'DRAFT':
      return '초안';
    case 'QA_READY':
      return '검수 준비';
    case 'ACTIVE':
      return '활성';
    case 'HIDDEN':
      return '숨김';
    case 'ARCHIVED':
      return '보관';
    default:
      return status;
  }
}

export function formatPaymentStatus(status: string): string {
  switch (String(status).toUpperCase()) {
    case 'PAID':
    case 'APPROVED':
    case 'DONE':
      return '결제 완료';
    case 'FAILED':
      return '실패';
    case 'PENDING':
      return '결제 대기';
    case 'REFUNDED':
      return '환불 완료';
    case 'CANCELED':
    case 'CANCELLED':
      return '취소';
    default:
      return status;
  }
}

export function formatSourceType(source: string): string {
  switch (source) {
    case 'CODE':
      return '코드 템플릿';
    case 'FIGMA_DEFINITION':
      return 'Figma 템플릿';
    default:
      return source;
  }
}

export function formatPaymentChannel(channel: string): string {
  if (channel === 'INTERNATIONAL_USD') return '해외카드 USD 결제';
  return channel;
}

export function formatConfigured(value: boolean | string | null | undefined): string {
  if (value === true || value === 'true') return '설정됨';
  if (typeof value === 'string' && value.trim() && value !== '—') return '설정됨';
  return '미설정';
}

export function formatGiSection(id: string): string {
  const map: Record<string, string> = {
    HERO: '히어로',
    HOST_INFO: '주최자/신랑신부 정보',
    EVENT_INFO: '행사 정보',
    MESSAGE: '초대 문구',
    GALLERY: '갤러리',
    LOCATION: '오시는 길',
    ACCOUNT: '마음 전하기 / 계좌',
    RSVP: '참석 여부',
    COMMENTS: '방명록/댓글',
    MUSIC: '음악',
    FOOTER: '하단 영역',
  };
  return map[id] || id;
}

export function formatStyleTag(tag: string): string {
  const map: Record<string, string> = {
    Minimal: '미니멀',
    Elegant: '우아한',
    Luxury: '럭셔리',
    Modern: '모던',
    Romantic: '로맨틱',
    Garden: '가든',
    Editorial: '에디토리얼',
    Traditional: '전통',
    Custom: '직접 입력',
  };
  return map[tag] || tag;
}

export function formatAuditAction(action: string): string {
  const map: Record<string, string> = {
    visual_template_update: '비주얼 템플릿 수정',
    visual_template_reorder: '비주얼 템플릿 정렬',
    visual_template_archive: '비주얼 템플릿 보관',
    visual_template_activate: '비주얼 템플릿 활성화',
    figma_analyze: 'Figma 분석',
    figma_import_draft: 'Figma 초안 저장',
    figma_config_update: 'Figma 설정 변경',
    figma_config_clear: 'Figma 설정 삭제',
    pricing_update: '가격 설정 변경',
    provider_config_update: 'Toss 설정 변경',
    toss_test_config_update: 'Toss TEST 설정 변경',
    toss_live_config_update: 'Toss LIVE 설정 변경',
    system_settings_update: '시스템 설정 변경',
    invitation_archive: '초대장 보관(삭제)',
    invitation_status_update: '초대장 상태 변경',
    user_deactivate: '회원 비활성화',
  };
  return map[action] || action;
}

export function formatInvitationListTitle(title: unknown, id: unknown): string {
  const rawTitle = typeof title === 'string' ? title.trim() : '';
  if (rawTitle) return rawTitle;
  const idText = typeof id === 'string' ? id : '';
  if (!idText) return '제목 없음';
  return `초대장 ${idText.slice(0, 8)}…`;
}

export function parseUsdInput(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100);
}

export function formatRuntimeEnv(env: string | undefined): string {
  if (!env) return '—';
  if (env.toLowerCase() === 'development') return 'DEVELOPMENT';
  if (env.toLowerCase() === 'production') return 'PRODUCTION';
  return env.toUpperCase();
}

export function formatMoneyUsd(minor: number): string {
  return `$${(minor / 100).toFixed(2)} USD`;
}

export const ADMIN_QUICK_ACTIONS = [
  { href: '/admin/visual-templates/new', label: '새 템플릿 만들기' },
  { href: '/admin/visual-templates/import', label: 'Figma 가져오기' },
  { href: '/admin/payments?tab=pricing', label: '가격 설정' },
  { href: '/admin/payments?tab=toss', label: 'Toss Payments 설정' },
  { href: '/admin/music', label: '음악 관리' },
  { href: '/admin/invitations', label: '초대장 관리' },
] as const;
