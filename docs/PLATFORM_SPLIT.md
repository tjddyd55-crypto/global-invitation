# Platform Split — PWA(모바일) / PC Web

> 이 문서는 `global-invitation` 레포 안에서
> **하나의 Next.js 14 프로젝트**로 PWA(모바일 전용 UI) 와 PC 사이트를
> 동시에 운영하기 위한 **현재 구현된 아키텍처** 를 정의한다.

상위 브랜치: `refactor/platform-split` (merged 후 main 기준).

---

## 1. 아키텍처 원칙 (바뀌지 않는 부분)

1. **비즈니스 로직(도메인) 공유 / UI/UX 완전 분리**
   - 네트워크·인증·구독·모델은 `src/shared/*` 한 곳에서만 진입.
   - 각 기능은 `src/features/<name>/{model, ui/pc, ui/mobile}` 구조로 UI 를 완전히 두 벌로 갖는다.
2. **URL 이 플랫폼을 결정한다** (정적 분석 가능)
   - 관리·에디터·대시보드 같은 앱 성격의 라우트는 `app/m/*` · `app/pc/*` 로 쪼갠다.
   - 공개 초대장(`/i/[slug]`, `/invitation/[slug]`, `/preview/[slug]`, `/message/*`)은 단일 URL 을 유지한다 (SEO·공유·OG 깨짐 방지).
3. **리다이렉트는 middleware 한 곳**
   - UA + `ui_pref` 쿠키 기반으로 앱 라우트 진입 시 `/m/...` 또는 `/pc/...` 로 307.
   - 사용자는 "모바일/데스크톱 버전 보기" 토글로 쿠키를 덮어쓴다.
4. **shim 선행 → UI 이식** 순서로 점진 마이그레이션
   - middleware 가 `/dashboard` 를 `/pc/dashboard` 로 보낼 때 해당 라우트에 페이지가 없으면 404.
   - 각 라우트에 **레거시 페이지를 그대로 default export** 하는 한 줄 shim 을 먼저 깔고, 이후 `features/<name>/ui/(pc|mobile)` 이 준비되면 그 shim 만 교체한다.

---

## 2. 현재 폴더 구조 (구현 완료)

```
frontend/
├─ app/
│  ├─ layout.tsx                   # 전역 Provider (I18n, Subscription)
│  ├─ offline/page.tsx             # PWA 오프라인 폴백 (SW network-first fallback 대상)
│  │
│  ├─ m/                           # 모바일 PWA 루트
│  │  ├─ layout.tsx                # 얇음: metadata(manifest, appleWebApp, viewport)만
│  │  ├─ (app)/                    # 쉘(바텀네비) 적용 그룹
│  │  │  ├─ layout.tsx             # → MobileShell
│  │  │  ├─ page.tsx               # → MobileHomeContent (auth-aware)
│  │  │  ├─ templates/page.tsx     # → features/templates/ui/mobile/TemplatesScreen
│  │  │  ├─ my-invitations/page.tsx # → features/invitations/ui/mobile/MyInvitationsScreen
│  │  │  ├─ dashboard/page.tsx     # → features/dashboard/ui/mobile/DashboardScreen
│  │  │  └─ {editor,create,message/editor,my,templates/[templateKey]}/  # 레거시 재export shim
│  │  └─ (auth)/                   # 비로그인 풀스크린 그룹
│  │     ├─ layout.tsx
│  │     ├─ login/page.tsx         # → features/auth/ui/mobile/LoginScreen
│  │     └─ signup/page.tsx        # → features/auth/ui/mobile/SignupScreen
│  │
│  ├─ pc/                          # PC 데스크톱 루트 (구조 동일)
│  │  ├─ layout.tsx                # 얇음
│  │  ├─ (app)/                    # PcShell (사이드바) 적용
│  │  └─ (auth)/                   # 풀스크린 카드 인증
│  │
│  ├─ i/, invitation/, preview/, message/   # 공개 URL — 단일/반응형
│  ├─ admin/, creator/                       # 관리자·크리에이터 — 단일 (PC 성격)
│  └─ templates/, dashboard/, editor/, ...  # 레거시 (shim 이 재export)
│
├─ middleware.ts                   # UA + ui_pref 쿠키 → /m | /pc 자동 분기
│
└─ src/
   ├─ shared/                      # 공통 도메인 (PC·Mobile·공개 라우트에서 공용)
   │  ├─ auth/       → lib/auth 재export barrel (AuthUser, 세션, 매직링크)
   │  ├─ api/        → lib/api·apiBase·adminApi 재export barrel
   │  ├─ billing/    → SubscriptionState, SubscriptionProvider, useSubscription
   │  ├─ platform/   → detectPlatformFromUA, resolvePlatform, usePlatform,
   │  │               APP_ROUTE_PREFIXES, PUBLIC_PATH_PREFIXES, useServiceWorker
   │  └─ hooks/      → useAuth
   │
   ├─ features/                    # 기능 단위 (model 공유, UI 는 2벌)
   │  ├─ auth/        {model: useLoginForm, useSignupForm, adminFallback
   │  │                ui/pc: LoginCard, SignupCard
   │  │                ui/mobile: LoginScreen, SignupScreen}
   │  ├─ templates/   {model: useCreateInvitation, CONCEPT_OPTIONS
   │  │                ui/pc: TemplatesPage
   │  │                ui/mobile: TemplatesScreen}
   │  ├─ invitations/ {model: useMyInvitations
   │  │                ui/mobile: MyInvitationsScreen}
   │  └─ dashboard/   {ui/mobile: DashboardScreen}
   │
   ├─ ui/
   │  ├─ pc/        {PcShell, PcHomeContent}     # PC 디자인시스템 + 홈
   │  ├─ mobile/    {MobileShell, MobileHomeContent}
   │  └─ shared/    {PlatformSwitcher}            # PC ↔ Mobile 사용자 수동 전환
   │
   ├─ lib/           # 기존 API/auth 구현체 (shared 가 얇게 재export 함)
   ├─ templates/     # 공개 초대장 렌더러 — 공유 (반응형 유지)
   └─ editors/       # 레거시 에디터 — 이후 features/editor-* 로 분해 예정

public/
├─ manifest.webmanifest             # scope: /m/, start_url: /m
├─ sw.js                            # 오프라인 쉘 서비스워커
└─ icons/                           # PWA 아이콘 (현재 SVG 임시, PNG 교체 필요)
```

### 왜 `src/pc`, `src/mobile` 루트 분기가 아닌가

- 두 루트로 나누면 **도메인 로직이 UI 트리 안으로 중복·분산**된다.
- 기능 경계(=feature) 가 UI 분기보다 먼저다. `features/<name>/ui/{pc,mobile}` 로 갈라야 공유 모델이 항상 한 곳이고, **한쪽 UI 만 교체**할 수 있다.
- `src/ui/{pc,mobile}` 은 "디자인시스템·쉘" 수준의 공통 컴포넌트 전용.

---

## 3. 라우팅 전략 (구현된 결론)

| 경로 | 처리 | 이유 |
|---|---|---|
| `/`, `/login`, `/signup`, `/dashboard`, `/my`, `/my-invitations`, `/editor`, `/create`, `/templates`, `/settings`, `/message/editor` | middleware 307 → `/m` 또는 `/pc` 하위 경로 | "앱 라우트" — 같은 URL 공유 시 유지보수 최악 |
| `/i/[slug]`, `/invitation/[slug]`, `/preview/[slug]`, `/message/*` (editor 제외) | 통과 — 기존 반응형 페이지 | SEO·공유·OG |
| `/admin/*`, `/creator/*`, `/pricing`, `/about`, `/contact`, `/terms`, `/privacy`, `/payment-info`, `/pwa-settings`, `/auth/*` | 통과 — 단일 URL | 공개 마케팅 / 관리자 전용 |
| `/api/*`, `/_next/*`, `/assets/*`, `/icons/*`, `/manifest.webmanifest` 등 정적 | middleware matcher 에서 제외 | 성능 |

단일 진실 원천: `src/shared/platform/routing.ts`
- `APP_ROUTE_PREFIXES` · `PUBLIC_PATH_PREFIXES` · `pathSegmentMatches` 를 이 한 파일에서만 관리한다.
- 새 앱 라우트를 만들면 반드시 `APP_ROUTE_PREFIXES` 에 등록해야 자동 분기된다.

### 쿠키 `ui_pref=mobile|desktop`

- 초기값 없음 → UA 기반 판정.
- `PlatformSwitcher` 로 사용자가 수동 오버라이드 시 세팅. 이후 **UA 를 덮어쓴다**.

---

## 4. 비즈니스 로직 공유 (현재 구현)

### 4-1. 인증 — `src/shared/auth`
- `lib/auth` 를 얇게 재export (세션/게스트 토큰/매직링크).
- React 훅: `src/shared/hooks/useAuth` → `{ user, status, refresh, signOut }`.
- **UI 는 이 훅만 본다**. `lib/auth` 직접 import 금지.

### 4-2. 구독 — `src/shared/billing`
- `SubscriptionState = 'FREE' | 'TRIAL' | 'PAID' | 'EXPIRED'`.
- `SubscriptionProvider` 가 `app/layout.tsx` 에서 주입됨 → 앱 어디서든 `useSubscription()` 가능.
- 가드: `canAccessPaidAction(sub)` / `isActive(sub)`.

### 4-3. 네트워크 — `src/shared/api`
- `lib/api`, `apiBase`, `adminApi` 재export barrel.
- feature UI 는 반드시 `@/src/shared/api` 또는 feature 의 `model/` 을 통해서만 API 호출.

### 4-4. 플랫폼 감지 — `src/shared/platform`
- 서버: `resolvePlatform({ userAgent, uiPrefCookie })`.
- 클라: `usePlatform()` → `{ platform, setPreferredPlatform }`.
- PWA: `useServiceWorker()` (production 빌드에서만 등록).

---

## 5. PWA

- `manifest.webmanifest`: `scope: /m/`, `start_url: /m`, `display: standalone`, SVG 아이콘 우선 + PNG 폴백.
- `sw.js`:
  - 네비게이션(HTML) → **network-first**, 실패 시 `/offline` 폴백.
  - 정적 자산(`/_next/static`, `/icons`, `/images`, manifest) → **cache-first**.
  - **`/api` · `/admin` 은 캐시 절대 금지** (결제·구독 stale 오류 원천 차단).
- `MobileShell` 이 `useServiceWorker()` 를 호출하여 `/m/*` 접속 시 등록.

---

## 6. 이식 상태 (2026-04-23)

| 기능 | Mobile UI | PC UI | 비고 |
|---|---|---|---|
| 홈 (`/`) | ✅ `MobileHomeContent` (auth-aware) | ✅ `PcHomeContent` (auth-aware) | |
| 로그인/회원가입 | ✅ 풀스크린 스크린 | ✅ 카드 | adminFallback 공유 |
| 템플릿 (`/templates`) | ✅ 컨셉 카드 스택 | ✅ 라이브 프리뷰 + 카드 | `useCreateInvitation` 공유 |
| 내 초대장 (`/my-invitations`) | ✅ 상태배지 카드 리스트 | ⚠️ shim | PC 는 기존 복잡 관리 UI 유지 방침 |
| 대시보드 (`/dashboard`) | ✅ 구독배너 + 통계 | ⚠️ shim | |
| 에디터 (`/editor/[slug]`) | ⚠️ shim | ⚠️ shim | 668줄 분해는 별도 티켓 |
| 관리자 (`/admin/*`) | — (PC 강제) | ⚠️ 단일 레거시 | PC 전용 정책 |
| 크리에이터 (`/creator/*`) | — | ⚠️ 레거시 (동결) | **중단된 기능**. 이식·삭제 모두 금지. 자세한 규칙은 `AGENTS.md` 참고 |
| PWA (manifest/SW/offline) | ✅ | — | PNG 아이콘은 디자인 확정 후 교체 |

---

## 7. 테스트/배포 체크리스트

- [ ] `ui_pref` 쿠키 토글 E2E (PlatformSwitcher).
- [ ] `next build` 녹색 (현재 ✅).
- [ ] Vercel `Cache-Control: Vary: Cookie, User-Agent` 를 앱 라우트에만 제한.
- [ ] PWA Lighthouse ≥ 90 (PNG 아이콘 업로드 후 재측정).
- [ ] 공개 초대장 URL (`/i/[slug]`) 은 리다이렉트되지 않음을 확인.
