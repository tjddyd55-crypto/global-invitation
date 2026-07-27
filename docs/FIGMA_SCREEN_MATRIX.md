# Figma Screen Matrix — Entry / Auth Presentation

Figma Make 파일 `GwuOKQ8rH3R547iFVrojvv` 소스 화면과 실제 라우트 매핑 현황.
`Before` = 이번 작업 시작 시점 상태, `After` = 이번 작업 반영 후 상태(수동 QA 대기).

## 셸 SSOT

`src/shared/platform/platformShell.ts::getPlatformShellForPath()` 가 라우트별 셸을 결정한다.

| 라우트 | Shell |
| --- | --- |
| `/`, `/create`, `/create/concept`, `/templates` | `marketing` |
| `/auth/email`, `/auth/verify` | `auth` |
| `/editor/*` | `editor` |
| `/i/*` | `public` |
| `/publish*` | `publish` |
| 그 외 (`/my-invitations`, `/dashboard`, ...) | `app` |

`marketing` / `auth` 셸은 `PcShell` / `MobileShell` (사이드바·바텀내비)을 사용하지 않는다.

## 라우트 매트릭스

| 라우트 | Figma 소스 (Desktop / Mobile) | Before | After |
| --- | --- | --- | --- |
| `/` | `DesktopMainScreen` / `MainScreen` | ❌ FAIL — `PcShell`/`MobileShell` 로 감싸 사이드바·바텀내비 노출, 내부는 레거시 `PcHomeContent`/`MobileHomeContent` alias | ⏳ PASS(수동 QA 대기) — `MarketingDesktopHeader` 단일 헤더, 히어로(2단·폰목업 280×520)·베네핏·컨셉 카드·최종 CTA 직접 구현 |
| `/create/concept` (`/templates` 호환) | `DesktopConceptSelectionScreen` / `ConceptSelectionScreen` | ❌ FAIL — `PcShell`/`MobileShell` 로 감싸짐, 컨셉 카드에 기능 목록 없음 | ⏳ PASS(수동 QA 대기) — `MarketingDesktopHeader showNav={false}`, 컨셉별 기능 목록(WEDDING/FUNERAL/GENERAL) 노출, `RequireAuth` 유지 |
| `/auth/email` | `DesktopEmailStartScreen` / `EmailStartScreen` | ❌ FAIL — 단일 `EmailAuthForm` 이 이메일+OTP 를 한 화면에서 처리, "Global Invitation" eyebrow | ⏳ PASS(수동 QA 대기) — 이메일 입력 전용 화면으로 분리, 성공 시 `/auth/verify` 로 이동(이메일은 `sessionStorage:gi_auth_email`), Invite 브랜드 헤더 + (Desktop) 장식 카드 4장 |
| `/auth/verify` | `DesktopEmailVerifyScreen` / `EmailVerifyScreen` | ❌ FAIL — 전용 화면 없음(`/auth/email` 내부 2단계로 처리), 매직링크 전용 페이지만 존재 | ⏳ PASS(수동 QA 대기) — `?token=` 이면 매직링크 유지, 아니면 6칸 OTP + 10분 타이머 + 재발송 + 이메일 변경 UI |

## 컨셉별 기능 목록 (`useCreateInvitation.ts::CONCEPT_OPTIONS`)

| 컨셉 | 기능 목록 |
| --- | --- |
| WEDDING | 신랑·신부 소개 / 예식 일정 안내 / 갤러리 / Google 지도 위치 / 마음 전하실 곳(계좌) / 참석 여부 확인 / 방명록 |
| FUNERAL | 故人 소개 / 발인 일정 안내 / 빈소 위치 안내 / Google 지도 위치 / 조의금 계좌 안내 / 조문 여부 확인 / 삼가 조의 메시지 |
| GENERAL | 행사 소개 / 일정 안내 / 갤러리 / Google 지도 위치 / 참가비 · 계좌 정보 / 참석 여부 확인 / 댓글 · 방명록 |

## 신규/변경 파일 요약

- `src/shared/platform/platformShell.ts` (기존 파일 확인, `index.ts` 배럴에 export 추가)
- `src/ui/icons/MarketingIcons.tsx` (신규)
- `src/features/marketing/tokens/marketingTokens.css` (신규, `app/globals.css` 에서 1회 import)
- `src/features/marketing/ui/MarketingDesktopHeader.tsx`, `AuthBrandHeader.tsx`, `InvitationDecorativeCards.tsx` (+ css)
- `src/features/main/ui/pc/DesktopMainScreen.tsx`, `ui/mobile/MainScreen.tsx` (+ css) — 실제 구현으로 교체
- `src/features/concept/ui/pc/DesktopConceptSelectionScreen.tsx`, `ui/mobile/ConceptSelectionScreen.tsx` (+ css) — 실제 구현으로 교체
- `src/features/templates/ui/{pc,mobile}/*` — `/templates` 호환용 re-export 로 축소 (`@shim:` 태그)
- `src/features/templates/model/useCreateInvitation.ts` — 컨셉별 `features` 목록 + `--mk-*` accent 추가, next 경로 `/create/concept`
- `src/features/auth/model/authNextPath.ts`, `authEmailStorage.ts`, `useEmailStartForm.ts`, `useEmailVerifyForm.ts` (신규)
- `src/features/auth/ui/shared/OtpCodeInputGroup.tsx` (+ css, 신규)
- `src/features/auth/ui/pc/DesktopEmailStartScreen.tsx`, `DesktopEmailVerifyScreen.tsx` (신규)
- `src/features/auth/ui/mobile/EmailStartScreen.tsx`, `EmailVerifyScreen.tsx` (신규)
- `app/page.tsx`, `app/create/concept/page.tsx` — `PcShell`/`MobileShell` 제거, `ResponsivePlatformBoundary` 만 사용
- `app/auth/email/page.tsx`, `app/auth/verify/page.tsx` — start/verify 분리 + token 분기
- `scripts/assert-no-legacy-ui.mjs` — `PcShell`/`MobileShell`/`PcHomeContent`/레거시 카피 forbidden 목록 확장
- `scripts/assert-no-dev-home-ui.mjs` (신규) — Main 화면이 `PcHomeContent`/`MobileHomeContent` 를 참조하지 않는지 검사

## 의도적으로 그대로 둔 것

- `src/ui/pc/PcHomeContent.tsx`, `src/ui/mobile/MobileHomeContent.tsx` — `/pc`, `/m` QA 라우트(`app/pc/(app)/page.tsx`, `app/m/(app)/page.tsx`)에서만 계속 사용된다. 삭제 요청이 없어 보존.
- `src/features/auth/ui/shared/EmailAuthForm.tsx`, `useEmailAuthFlow.ts` — `/m/(auth)/email`, `/pc/(auth)/email` QA 라우트 호환용으로 유지. `resolveNextPath` 기본값만 `/create/concept` 로 갱신.
