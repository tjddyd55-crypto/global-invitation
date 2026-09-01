export type AdminNavItem = {
  href: string;
  label: string;
  tab?: string;
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    items: [{ href: '/admin/dashboard', label: '대시보드' }],
  },
  {
    id: 'invitations',
    label: '초대장 관리',
    items: [{ href: '/admin/invitations', label: '초대장 목록' }],
  },
  {
    id: 'users',
    label: '회원 관리',
    items: [{ href: '/admin/users', label: '회원 목록' }],
  },
  {
    id: 'payments',
    label: '결제 관리',
    items: [
      { href: '/admin/payments?tab=transactions', label: '결제 내역', tab: 'transactions' },
      { href: '/admin/payments?tab=pricing', label: '가격 설정', tab: 'pricing' },
      { href: '/admin/payments?tab=toss', label: 'Toss Payments 설정', tab: 'toss' },
    ],
  },
  {
    id: 'music',
    label: '음악 관리',
    items: [{ href: '/admin/music', label: '음악 목록' }],
  },
  {
    id: 'visual-templates',
    label: '비주얼 템플릿',
    items: [
      { href: '/admin/visual-templates', label: '템플릿 목록' },
      { href: '/admin/visual-templates/new', label: '새 템플릿 만들기' },
      { href: '/admin/visual-templates/import', label: 'Figma 가져오기' },
    ],
  },
  {
    id: 'marketplace',
    label: '마켓플레이스',
    items: [
      { href: '/admin/templates', label: '마켓플레이스 템플릿 관리' },
      { href: '/admin/template-submissions', label: '크리에이터 템플릿 신청' },
    ],
  },
  {
    id: 'system',
    label: '시스템 설정',
    items: [
      { href: '/admin/system?tab=runtime', label: '운영 설정', tab: 'runtime' },
      { href: '/admin/system?tab=figma', label: 'Figma 연동', tab: 'figma' },
      { href: '/admin/system?tab=audit', label: '관리자 변경 이력', tab: 'audit' },
    ],
  },
];

export const SUPER_ADMIN_NAV_ITEM = {
  href: '/admin/super/credit-policies',
  label: 'Super Admin',
} as const;

export function isAdminNavItemActive(pathname: string, tab: string | null, item: AdminNavItem): boolean {
  if (item.href.startsWith('/admin/payments')) {
    return pathname.startsWith('/admin/payments') && (item.tab ? tab === item.tab : true);
  }
  if (item.href.startsWith('/admin/system')) {
    return pathname.startsWith('/admin/system') && (item.tab ? tab === item.tab : true);
  }
  if (item.href === '/admin/visual-templates') {
    return (
      pathname === '/admin/visual-templates' ||
      (pathname.startsWith('/admin/visual-templates/') &&
        !pathname.startsWith('/admin/visual-templates/new') &&
        !pathname.startsWith('/admin/visual-templates/import'))
    );
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function isAdminNavGroupActive(pathname: string, tab: string | null, group: AdminNavGroup): boolean {
  return group.items.some((item) => isAdminNavItemActive(pathname, tab, item));
}

/** Pathname-only group highlight when query tab is not yet resolved. */
export function isAdminNavGroupActiveByPathname(pathname: string, group: AdminNavGroup): boolean {
  if (group.id === 'payments') return pathname.startsWith('/admin/payments');
  if (group.id === 'system') return pathname.startsWith('/admin/system');
  return group.items.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href.split('?')[0]}/`)
  );
}
