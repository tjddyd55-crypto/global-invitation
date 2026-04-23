# Coding Rules — global-invitation

> 이 문서는 **레이어·의존 방향**(`ARCHITECTURE.md`) 다음으로, 실제 코드를 작성할 때 지켜야 하는 **코드 스타일과 안전 원칙**을 정리한 것이다.
> 기존 `03_DEVELOPMENT_RULES.md` (범위 제어) 와 짝을 이룬다.

---

## 1. 파일·함수 크기

- 하나의 컴포넌트 파일은 **400줄을 넘지 않는다**. 초과 시 model 로 훅 분리 또는 하위 컴포넌트로 쪼갠다.
- 하나의 함수/훅은 **40줄**, 중첩 **2단계**를 넘지 않는다.
- 하나의 함수/훅은 하나의 책임만 갖는다. "저장 + 유효성 + 리다이렉트" 를 한 훅에 몰지 않는다.

## 2. 네이밍

- 의도가 드러나는 이름. `data`, `info`, `temp`, `handle1` 같은 뜻 없는 이름 금지.
- 불리언은 `is*`, `has*`, `can*`, `should*`.
- 훅 이름은 반환값이 아니라 **무엇을 하는지**로: `useCreateInvitation` ✅, `useInvitationResult` ❌.

## 3. 하드코딩 금지

- 사용자에게 보이는 문자열은 i18n 시스템을 경유한다. 임시 텍스트에만 `/* eslint-disable i18next/no-literal-string */` 허용.
- URL 경로·스토리지 키·쿠키 이름·이벤트 이름 등은 `const` 로 이름을 붙여 상수로 관리.
  - 예: `UI_PREF_COOKIE`, `APP_ROUTE_PREFIXES`, `CACHE_VERSION` (`public/sw.js`).
- 매직 넘버는 이름을 붙인다: `const HERO_HEIGHT = 520;`.

## 4. 에러 처리

- `catch` 블록을 비워두지 않는다. 최소한 `console.error` + 사용자 피드백 상태 갱신.
- 외부 API 는 반드시 실패 경로를 분기한다. 성공만 가정한 코드는 PR 에서 리뷰 거절한다.
- try/catch 는 **경계(네트워크·파싱·파일 IO)** 에서만 쓴다. UI 렌더러 안에서 try/catch 로 버그를 숨기지 않는다.

## 5. 플랫폼 분기

- 컴포넌트 안에서 `if (isMobile) ...` 형태로 분기하지 않는다. 반드시 **라우트 + 폴더**로 분기:
  - `app/pc/(app)/templates/page.tsx` ↔ `app/m/(app)/templates/page.tsx`
  - `features/templates/ui/pc/TemplatesPage.tsx` ↔ `features/templates/ui/mobile/TemplatesScreen.tsx`
- 공통 로직은 `features/<name>/model/*` 또는 `src/shared/*` 로 먼저 추출한 뒤 양쪽에서 import.
- 공개 URL(`/i`, `/invitation`, `/preview`, `/message`) 은 **플랫폼 분기 금지**. 단일 반응형 렌더러 유지.

## 6. 상태와 데이터

- 서버 상태는 `src/shared/*` 의 훅을 거쳐서만 읽는다 (`useAuth`, `useSubscription`).
- feature UI 가 직접 `lib/api`, `lib/auth` 를 import 하지 않는다 → barrel(`src/shared/api` 등)을 통한다.
- 데이터는 읽기 → 변환(매퍼) → 렌더 순. 렌더 중에 `Date.now()` / `Math.random()` 로 값을 만들지 않는다 (SSR hydration mismatch).

## 7. 라우팅·리다이렉트

- 새 앱 라우트(`/setting` 같이 로그인 후 화면) 는 반드시
  1. `src/shared/platform/routing.ts::APP_ROUTE_PREFIXES` 에 prefix 등록
  2. `app/pc/(app)/<name>/page.tsx` + `app/m/(app)/<name>/page.tsx` 생성
- 공개 URL 은 `PUBLIC_PATH_PREFIXES` 에 등록. middleware 가 통과시켜야 한다.
- 로그인 후 돌아갈 경로(`redirect` 쿼리)는 `src/lib/loginRedirect.ts::sanitizeReturnPath` 통과분만 허용. 새 인증 라우트가 생기면 blocklist 추가.

## 8. 스타일

- CSS 는 **CSS Modules** (`*.module.css`) 원칙. 글로벌 스타일은 `app/globals.css` 한정.
- 공용 토큰은 CSS 변수로만. 색상/간격 하드코딩은 같은 프로젝트 내 3회 이상 반복되면 변수화.
- 이미지: 공개 URL 에서는 가능하면 `next/image`, 에디터 내 미리보기처럼 동적 외부 URL 은 `<img>` 허용.

## 9. 서비스워커/PWA

- `/api/*`, `/admin/*` 은 **절대 캐시하지 않는다**. 결제·구독 stale 사고 원천 차단.
- 새 정적 경로 추가 시 `public/sw.js::CACHE_VERSION` 을 올려 무효화한다.
- 네비게이션(HTML) 응답은 network-first + `/offline` 폴백을 유지한다.

## 10. 커밋·PR

- 한 커밋은 한 의도. "feat: ~" + "fix: ~" 를 섞지 않는다.
- PR 설명에 **왜** 이 구조를 선택했는지 한 문단 포함.
- `next build` 녹색 + `npx tsc --noEmit` 녹색을 로컬에서 확인 후 push.
- 주요 리팩터링은 `refactor/<topic>` 브랜치에서 작업, main 직커밋 금지.

## 11. 금지 목록

- 이해하지 못한 코드 복사.
- "편의를 위해" 라는 이유로 shared 에서 feature 를 import.
- 숨겨진 부작용(모듈 로드 시 side effect, 전역 mutable 싱글턴).
- `any` 남용 — 외부 SDK 타입 없는 경우에만 한정적으로.
- 테스트 없는 결제/구독 분기 변경.
