# AGENTS — global-invitation

이 문서는 **사람 엔지니어와 AI 에이전트가 공통으로 따르는** 최상위 규칙이다.
세부 내용은 `docs/` 하위 문서 링크로 위임한다.

## 반드시 먼저 읽을 것

1. [`docs/PLATFORM_SPLIT.md`](docs/PLATFORM_SPLIT.md) — PWA/PC 분리 아키텍처 (무엇을, 어디에)
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — 레이어·의존 방향
3. [`docs/CODING_RULES.md`](docs/CODING_RULES.md) — 파일·함수·스타일 규칙
4. [`docs/03_DEVELOPMENT_RULES.md`](docs/03_DEVELOPMENT_RULES.md) — 스코프 제어 (요청되지 않은 기능 추가 금지)

## 작업 시작 전 체크리스트

- [ ] 변경 대상이 **어느 레이어**인지 판별했는가 (`app` / `features` / `shared` / `lib`)?
- [ ] 플랫폼별 UI 가 필요한 기능이면 `features/<name>/ui/{pc,mobile}` 두 경로를 모두 고려했는가?
- [ ] 앱 라우트가 추가된다면 `src/shared/platform/routing.ts::APP_ROUTE_PREFIXES` 에 등록이 필요한가?
- [ ] 공개 URL(SEO·공유 대상)이라면 플랫폼 분기 없이 단일 반응형으로 유지되는가?
- [ ] 결제·구독·관리자 경로를 서비스워커가 캐시하지 않도록 유지되는가 (`public/sw.js`)?

## 절대 규칙 (위반 시 PR 거절)

1. **공개 초대장 URL**(`/i`, `/invitation`, `/preview`, `/message`) 을 `/m`, `/pc` 로 분기하지 않는다.
2. `src/shared/*` 는 `src/features/*`, `src/ui/*`, `app/*` 를 import 하지 않는다 (역방향 금지).
3. feature UI 에서 `src/lib/*` 를 직접 import 하지 않는다. 반드시 `src/shared/*` barrel 경유.
4. `/api/*`, `/admin/*` 응답을 서비스워커에서 캐시하지 않는다.
5. 한 파일 400줄, 한 함수 40줄, 중첩 2단계 초과 시 반드시 분리한다.
6. 사용자 가시 문자열 하드코딩 금지 (i18n 경유 또는 `eslint-disable` 명시).

## 새 기능 추가 절차

1. 모델 먼저: `src/features/<name>/model/useXxx.ts`.
2. UI 나중: `ui/pc` → `ui/mobile` 순 (또는 동시).
3. 라우트 진입점: `app/pc/(app)/<name>/page.tsx`, `app/m/(app)/<name>/page.tsx`.
4. 라우팅 규칙 등록: `src/shared/platform/routing.ts`.
5. 타입·빌드 확인: `npx tsc --noEmit` + `npx next build`.

## 변경하면 안 되는 것 (명시적 허가 없이)

- `src/templates/*` 의 공개 초대장 렌더러 출력 형식 (SEO·OG 영향).
- `manifest.webmanifest` 의 `scope` / `start_url`.
- middleware 의 `matcher` 범위 (정적 자산 누락 위험).
- Stripe·Lemon Squeezy 결제 관련 코드 (`docs/02_STRIPE_POLICY.md`, `docs/LEMON_SQUEEZY_PENDING_CHECKLIST.md`).

## 중단된 기능 (건드리지 말 것)

- **`app/creator/*`** — "템플릿 제작자가 템플릿을 만들어 공유" 기능. **중단된 프로젝트**.
  - 이식하지 않는다 (`app/pc/(app)/`, `app/m/(app)/` 아래 creator 경로 만들지 않음).
  - 레거시 정리·삭제 대상에서도 **제외** (당장 제거하지 않음).
  - middleware 에서는 `PUBLIC_PATH_PREFIXES` 로 통과만 시킨다. 분기 금지.
  - 재개 결정이 내려지기 전까지 신규 코드 연결·리팩터링 금지.

## 커뮤니케이션

- 구조적 변경은 먼저 `docs/PLATFORM_SPLIT.md` 또는 `docs/ARCHITECTURE.md` 를 **PR 과 같이 갱신**한다.
- 한국어로 답변하고, 커밋 메시지는 한국어 또는 영어 중 하나로 일관.
