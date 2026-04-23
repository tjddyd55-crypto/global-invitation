# Architecture Overview

이 문서는 `global-invitation` 프런트엔드(`frontend/`)의 **레이어 경계**와 **허용되는 의존 방향**을 한 장에 정리한다.
6개월 후 합류하는 주니어 개발자가 이 문서만 읽고도 파일을 어디에 둘지 판단할 수 있어야 한다.

---

## 1. 레이어 다이어그램

```
          ┌─────────────────────────────────────────────┐
          │ app/*  (Next.js route)                       │  ← 페이지·라우팅만. 로직 X
          │   app/m/(app|auth)/...  app/pc/(app|auth)/...│
          └──────────────────┬──────────────────────────┘
                             │ renders
          ┌──────────────────▼──────────────────────────┐
          │ features/<name>/ui/(pc|mobile)               │  ← 플랫폼별 화면
          │ ui/(pc|mobile|shared)                        │  ← 쉘·홈·공용 컴포넌트
          └──────────────────┬──────────────────────────┘
                             │ calls
          ┌──────────────────▼──────────────────────────┐
          │ features/<name>/model                        │  ← feature 전용 훅·매퍼
          └──────────────────┬──────────────────────────┘
                             │ imports
          ┌──────────────────▼──────────────────────────┐
          │ shared/  (auth · api · billing · platform    │  ← 도메인 공용 API (얇은 barrel)
          │           · hooks)                           │
          └──────────────────┬──────────────────────────┘
                             │ wraps
          ┌──────────────────▼──────────────────────────┐
          │ lib/*  (auth.ts, api.ts, apiBase.ts, ...)    │  ← 구현체. 직접 import 금지
          └─────────────────────────────────────────────┘
```

### 의존 방향은 아래로만 흐른다

- `app/` → `features/ui` → `features/model` → `shared` → `lib`
- **역방향 import 는 금지**. 특히 `shared → features`, `lib → shared` 는 절대 안 된다.
- 같은 레이어끼리의 교차 import 는 허용되지만 최소화한다. 특히 `features/A/ui` 가 `features/B/ui` 를 직접 import 하는 경우는 리팩터링 신호다.

---

## 2. 폴더별 책임

| 폴더 | 책임 | 금지 |
|---|---|---|
| `app/m/*`, `app/pc/*` | Next.js 라우팅, metadata, route groups(`(app)`, `(auth)`) | 비즈니스 로직, fetch, 매퍼 |
| `app/i`, `app/invitation`, `app/preview`, `app/message` | **공개 초대장** 단일 URL (반응형 유지) | `/m`, `/pc` 로 분기하지 말 것 |
| `src/features/<name>/model` | feature 전용 훅·셀렉터·매퍼. **UI import 불가** | `features/*/ui` 를 import 하지 말 것 |
| `src/features/<name>/ui/pc` | PC 컴포넌트. `model` + `shared` 만 import | 모바일 컴포넌트 import 금지 |
| `src/features/<name>/ui/mobile` | 모바일 컴포넌트. 위와 동일 | PC 컴포넌트 import 금지 |
| `src/ui/pc` | PC 쉘(사이드바, 홈, 디자인시스템) | feature 내부 참조 금지 (반대는 허용) |
| `src/ui/mobile` | 모바일 쉘(바텀네비, 홈) | 위와 동일 |
| `src/ui/shared` | 플랫폼 공용 UI (예: `PlatformSwitcher`) | 플랫폼 분기 로직 최소화 |
| `src/shared/*` | 도메인 공용 API — **얇은 barrel + 도메인 훅** | feature/UI import 금지 |
| `src/lib/*` | 네트워크·인증 구현체. 외부(브라우저 API, fetch) 와 직접 통신 | UI 컴포넌트 import 금지 |
| `src/templates` | 공개 초대장 렌더러 — 공유 (반응형 유지) | 플랫폼 분기 금지 |
| `middleware.ts` | `APP_ROUTE_PREFIXES` / `PUBLIC_PATH_PREFIXES` 기반 307 리다이렉트만 | fetch, 인증 검증 금지 |

---

## 3. 데이터 흐름 (대표 시나리오)

### 3-1. 로그인
```
LoginCard(ui/pc) ─▶ useLoginForm(features/auth/model)
                    ├─▶ shared/auth.loginWithPassword
                    │   └─▶ lib/auth.ts → POST /api/auth/login
                    └─▶ shared/auth.setStoredSession
   ↓ refresh()
useAuth(shared/hooks) ─▶ shared/auth.fetchNavbarUser
```

### 3-2. 플랫폼 리다이렉트
```
브라우저 ─▶ GET /dashboard
middleware.ts
  ├─ isAppRoute(pathname) === true  (shared/platform/routing)
  ├─ resolvePlatform({UA, cookie: ui_pref})  (shared/platform/detect)
  └─ 307 → /pc/dashboard  또는  /m/dashboard
```

### 3-3. 구독 상태
```
app/layout.tsx
 └─ <SubscriptionProvider> (shared/billing)
     └─ fetchSubscription (shared/billing/subscriptionApi)
         └─ lib/api
DashboardScreen ─▶ useSubscription() → { subscription: { state, ... } }
```

---

## 4. 명명 규칙

- 파일: UI 컴포넌트는 `PascalCase.tsx`, 훅은 `useXxx.ts`, 순수 로직은 `xxx.ts`.
- `*.module.css` 는 항상 동일 이름 컴포넌트에 1:1.
- feature 이름은 단수 또는 복수 일관성: `auth`, `templates`, `invitations`, `dashboard`.
- PC 컴포넌트 접미사 `Card`·`Page`, 모바일 `Screen`·`Sheet` 권장 (강제 아님, 현 관행 유지).

---

## 5. 테스트 전략 (개요)

- **model 레이어**에 단위테스트 우선. UI 는 smoke + 시각 회귀.
- 공개 초대장 렌더러(`src/templates/*`)는 테스트 고정. 플랫폼 분기 없음.
- middleware 는 `isAppRoute`, `isPublicPath` 표 기반 테스트.

---

## 6. 변경 가이드

새 기능 추가 순서:
1. `src/features/<name>/model` 에 훅/매퍼 먼저.
2. PC → `src/features/<name>/ui/pc`, Mobile → `src/features/<name>/ui/mobile`.
3. 라우트 진입점: `app/pc/(app)/<name>/page.tsx`, `app/m/(app)/<name>/page.tsx`.
4. 앱 라우트라면 `src/shared/platform/routing.ts::APP_ROUTE_PREFIXES` 에 등록 (`/xxx` 한 줄).
5. 공개 URL 이 추가되면 `PUBLIC_PATH_PREFIXES` 에 등록.

새 도메인 추가 (예: 쿠폰):
1. `src/lib/` 에 구현체.
2. `src/shared/<domain>/` 에 barrel + React 훅/Provider.
3. feature 에서는 반드시 `src/shared/<domain>` 만 import.
