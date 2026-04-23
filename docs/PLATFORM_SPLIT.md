# Platform Split Roadmap — PWA(모바일) / PC Web

> 이 문서는 `global-invitation` 레포 안에서
> **하나의 Next.js 14 프로젝트**로 PWA(모바일 전용 UI) 와 PC 사이트를
> 동시에 운영하기 위한 기준선을 정의한다.

---

## 1. 아키텍처 원칙

1. **비즈니스 로직(도메인) 공유** / **UI/UX 완전 분리**
   - 네트워크, 인증, 구독, 스키마, 모델은 `src/shared/*` 한 곳으로 모은다.
   - 화면은 `src/features/<name>/ui/pc` 와 `src/features/<name>/ui/mobile` 두 벌로 완전히 분리한다.
2. **URL 이 플랫폼을 결정한다** (정적 분석 가능)
   - 관리·에디터·대시보드 같은 **앱 성격의 라우트**는 `app/m/*` / `app/pc/*` 로 쪼갠다.
   - 공유되는 공개 URL(초대장 `/i/[slug]`, `/invitation/[slug]`, 메시지 등)은 **단일 URL**을 유지한다 (SEO·링크 공유·카톡 OG 깨지지 않게).
3. **리다이렉트는 middleware 한 곳**
   - UA + 쿠키(`ui_pref`) 기반으로 루트(`/`)·앱 라우트 진입 시 `/m/...` 또는 `/pc/...` 로 보낸다.
   - 사용자는 언제든 "모바일/데스크톱 버전 보기" 토글로 쿠키를 덮어쓸 수 있다.
4. **기존 반응형 페이지는 즉시 삭제하지 않는다**
   - 루트 `app/*` 의 현재 페이지들은 **PC 레거시**로 남겨둔 상태에서,
     새 `app/m/*` / `app/pc/*` 로 기능을 점진 이식한다.
   - 이식이 끝난 라우트부터 루트 레거시를 지운다.

---

## 2. 폴더 구조 (최종)

```
frontend/
├─ app/
│  ├─ layout.tsx                 # 전역 Provider (I18n, Subscription 등)
│  ├─ m/                         # 모바일 PWA 쉘
│  │  ├─ layout.tsx              # 바텀네비, 세이프에어리어, manifest 링크
│  │  ├─ page.tsx                # 모바일 홈
│  │  ├─ dashboard/
│  │  ├─ editor/[slug]/
│  │  └─ ...
│  ├─ pc/                        # PC 데스크톱 쉘
│  │  ├─ layout.tsx              # 사이드바, 헤더, 멀티컬럼
│  │  ├─ page.tsx                # PC 홈
│  │  ├─ dashboard/
│  │  ├─ editor/[slug]/
│  │  └─ admin/ (관리자)
│  └─ i/[slug]/ invitation/[slug]/ preview/[slug]/   # 공개 URL: 단일
│
├─ middleware.ts                 # /, /dashboard 등 앱 라우트 → /m | /pc 리다이렉트
│
├─ src/
│  ├─ shared/                    # ← 공통 도메인 (양쪽에서 import)
│  │  ├─ auth/                   # 세션/게스트 토큰/헤더 (lib/auth 재export + 래퍼)
│  │  ├─ billing/                # 구독 상태 FREE | TRIAL | PAID | EXPIRED
│  │  ├─ api/                    # 현 lib/api.ts 계열 재export
│  │  ├─ platform/               # detectPlatform(req), usePlatform()
│  │  ├─ hooks/                  # useAuth, useSubscription, useDevice
│  │  └─ models/                 # 타입/스키마 재export
│  │
│  ├─ features/                  # ← 기능 단위 (UI만 분리)
│  │  └─ <feature>/
│  │     ├─ model/               # 리듀서·매퍼·셀렉터 (공유)
│  │     ├─ api/                 # feature 전용 API 호출 (공유)
│  │     ├─ ui/pc/               # PC 전용 컴포넌트
│  │     └─ ui/mobile/           # 모바일 전용 컴포넌트
│  │
│  ├─ ui/
│  │  ├─ pc/                     # PC 디자인시스템 (Header, Sidebar 등)
│  │  └─ mobile/                 # 모바일 디자인시스템 (BottomNav, Sheet 등)
│  │
│  ├─ lib/        # 기존 파일은 유지 (shared/* 가 얇게 재export)
│  ├─ templates/  # 공개 초대장 렌더러 — 공유 (반응형 유지)
│  └─ editors/    # 향후 features/editor-* 로 이동 예정
│
└─ public/
   ├─ manifest.webmanifest       # PWA 매니페스트 (scope=/m/)
   └─ icons/                     # PWA 아이콘
```

### 왜 `src/pc`, `src/mobile` 가 아닌가

- `src/pc`, `src/mobile` 두 루트로 나누면 **도메인 로직이 UI 트리 안으로 중복·분산**된다.
- 기능 경계(=feature)가 UI 분기보다 먼저다. `features/<name>` 안에서만 `ui/pc`, `ui/mobile` 로 갈라야
  공유 로직이 항상 한 곳에 있고, **한쪽 UI만 교체**하기 쉽다.
- `src/ui/{pc,mobile}` 은 "디자인시스템" 수준의 공통 컴포넌트 전용.

---

## 3. 라우팅 전략 (결론)

| 경로 | 방식 | 이유 |
|---|---|---|
| `/` | middleware 가 `/m` 또는 `/pc` 로 **307 redirect** | 홈은 UA + 쿠키로 확정 분기 |
| `/dashboard`, `/my`, `/editor/*`, `/admin/*` (앱 라우트) | middleware 가 `/m/*` 또는 `/pc/*` 로 **307 redirect** | 같은 URL로 두면 CSS·컴포넌트가 양쪽을 동시에 알아야 함. 유지보수 최악 |
| `/i/[slug]`, `/invitation/[slug]`, `/message/*`, `/preview/*` | 단일 URL 유지 (반응형 + 템플릿 렌더러 공용) | SEO, 카톡/iMessage 프리뷰, 공유 링크 |
| `/api/*`, `/_next/*`, `/assets/*`, 정적 파일 | 미들웨어 제외 | 성능 |

- 쿠키 `ui_pref=mobile|desktop` 은 유저가 "모바일 버전 보기/PC 버전 보기" 토글 시에만 세팅. 초기값은 UA 판정.
- 쿠키가 있으면 **UA를 덮어쓴다**.
- 모바일 사파리가 PWA로 실행된 경우(`?pwa=1` 또는 manifest scope) `/m` 으로 강제.

### 동일 URL 에서 컴포넌트 스왑이 아닌 이유

- CSS/JS 번들 크기가 양쪽을 모두 포함해 무거워짐.
- SSR 시 UA 분기로 캐시 키 폭발 (CDN 캐시 불친화).
- `features/<name>/ui/*` 가 양쪽을 다 알아야 해서 결합도↑.

---

## 4. 비즈니스 로직 공유 (상세)

### 4-1. 인증
- 파일: `src/shared/auth/*` (현재 `src/lib/auth.ts` 를 얇게 재export).
- Hook: `useAuth()` — `fetchNavbarUser` 캐시를 React state 로 감싼다.

### 4-2. 구독 상태 (신규)
- 타입:
  ```ts
  type SubscriptionState = 'FREE' | 'TRIAL' | 'PAID' | 'EXPIRED';
  type Subscription = {
    state: SubscriptionState;
    trialEndsAt?: string | null;
    paidUntil?: string | null;
    source: 'default' | 'server' | 'override';
  };
  ```
- 서버 응답 normalization 은 `src/shared/billing/subscription.ts` 하나에서만.
- Provider: `<SubscriptionProvider>` (루트 `app/layout.tsx` 장착).
- Hook: `useSubscription()`.
- Guard: `requireActivePlan(state)` / `canAccessPaidAction(state)`.

### 4-3. 네트워크
- 현 `src/lib/api.ts`, `adminApi.ts`, `creatorApi.ts` 유지.
- `src/shared/api/index.ts` 에서 barrel 로 묶는다.

### 4-4. 플랫폼 감지
- 서버: `src/shared/platform/detect.ts` — `detectPlatform(request)`.
- 클라: `src/shared/platform/usePlatform.ts` — 클라이언트 hint (폴백).

---

## 5. 이식 순서 (1 → N)

1. [x] 공유 모듈 뼈대 + middleware + `app/m|pc` 뼈대 + PWA manifest
2. [ ] 홈(`/`) → `/m`, `/pc` 에 각각 완성형 추가 후 루트 레거시 삭제
3. [ ] 로그인/가입 플로우 분리
4. [ ] 대시보드(`/dashboard`, `/my-invitations`)
5. [ ] 에디터(`/editor/[slug]`) — 가장 크므로 `features/editor-wedding` 로 분할 후 UI 만 양쪽으로
6. [ ] 템플릿 브라우저(`/templates`)
7. [ ] 결제/구독 UI (PC 는 풀테이블, 모바일은 시트)
8. [ ] 관리자(`/admin/*`) — **PC 전용**, 모바일 진입 시 PC 강제

---

## 6. 테스트/배포

- `ui_pref` 쿠키 토글 E2E 1건 (Playwright 이미 있음).
- Vercel 에서 `Cache-Control: Vary: Cookie, User-Agent` 를 `/` 와 앱 라우트에만 제한.
- PWA 설치 테스트: `/m` scope 로 manifest·아이콘·theme-color 세팅 후 Lighthouse PWA ≥ 90.
