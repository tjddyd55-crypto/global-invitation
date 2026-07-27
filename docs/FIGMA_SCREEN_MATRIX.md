# Figma Screen Matrix — Entry / Auth Presentation

Figma Make 파일 `GwuOKQ8rH3R547iFVrojvv` (`get_design_context` MCP, node `0:1`) 소스 화면과 실제 라우트 매핑.
완료 판정은 Railway development Frontend 캡처 + Figma MCP 소스 비교로 한다.

## 셸 SSOT

`src/shared/platform/platformShell.ts::getPlatformShellForPath()`

| 라우트 | Shell |
| --- | --- |
| `/`, `/create`, `/create/concept`, `/templates` | `marketing` |
| `/auth/email`, `/auth/verify` | `auth` |
| `/editor/*` | `editor` |
| `/i/*` | `public` |
| `/publish*` | `publish` |
| 그 외 (`/my-invitations`, `/dashboard`, ...) | `app` |

`marketing` / `auth` 셸은 `PcShell` / `MobileShell` 사이드바·바텀내비를 사용하지 않는다.

## 라우트 / 컴포넌트 매트릭스

| Route | Viewport | Figma Component | Project Component | Before | After | Result |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | Desktop ≥1024 | `DesktopMainScreen` | `features/main/ui/pc/DesktopMainScreen` | PcShell + PcHomeContent | Invite header + hero 2col + phone 280×520 + concept 3 | STRUCT PASS* |
| `/` | Mobile <1024 | `MainScreen` | `features/main/ui/mobile/MainScreen` | MobileShell + MobileHomeContent | Invite nav + hero card + concept list | STRUCT PASS* |
| `/create/concept` | Desktop | `DesktopConceptSelectionScreen` | `features/concept/ui/pc/DesktopConceptSelectionScreen` | PcShell low cards | Header + progress + 3 accent cards + centered CTA | STRUCT PASS* |
| `/create/concept` | Mobile | `ConceptSelectionScreen` | `features/concept/ui/mobile/ConceptSelectionScreen` | MobileShell | Back+Invite + horizontal cards + bottom CTA | STRUCT PASS* |
| `/auth/email` | Desktop | `DesktopEmailStartScreen` | `features/auth/ui/pc/DesktopEmailStartScreen` | EmailAuthForm eyebrow | Corner logo + decor cards + policy + home link | STRUCT PASS* |
| `/auth/email` | Mobile | `EmailStartScreen` | `features/auth/ui/mobile/EmailStartScreen` | EmailAuthForm | Back+Invite + card + policy | STRUCT PASS* |
| `/auth/verify` | Desktop | `DesktopEmailVerifyScreen` | `features/auth/ui/pc/DesktopEmailVerifyScreen` | absent | Corner logo + OTP 56×64 + timer + resend | STRUCT PASS* |
| `/auth/verify` | Mobile | `EmailVerifyScreen` | `features/auth/ui/mobile/EmailVerifyScreen` | absent | Back+Invite + OTP 44×56 + timer | STRUCT PASS* |

\*STRUCT PASS = MCP 소스 DOM/카피/수치 반영. Pixel High/Medium=0 은 Railway overlay 재검증 후 최종 확정.

## Figma MCP에서 확인한 핵심 수치

| Token | Figma 값 |
| --- | --- |
| Breakpoint | `width >= 1024` Desktop |
| Page bg | `#F7F3EC` |
| Primary | `#4F46E5` |
| Header height (Desktop) | 72 |
| Auth card width | 500 / radius 24 |
| Input/Button height | 52 / radius 14 |
| Phone preview | 280×520 |
| Concept selected | concept accent border (not single indigo) |
| OTP desktop | 56×64 / gap 10 / radius 14 |
| OTP mobile | 44×56 / gap 8 / radius 12 |

## 컨셉 기능 목록 (MCP + GENERAL 최신 기능)

| 컨셉 | features |
| --- | --- |
| WEDDING | 신랑 · 신부 정보 / 예식장 · 위치 안내 / 갤러리 / 계좌 정보 / 참석 여부 RSVP / 방명록/댓글 |
| FUNERAL | 고인 정보 / 빈소 · 발인 일정 / 장례식장 위치 안내 / 조의금 계좌 / 추모 메시지 / 방명록/댓글 |
| GENERAL | 행사 소개 · 설명 / 세부 일정 / 장소 · 위치 안내 / 갤러리 / 참가비 · 계좌 정보 / 참석 여부 RSVP / 댓글/방명록 |

## 의도적으로 유지

- `/pc`, `/m` QA 라우트의 `PcHomeContent` / `MobileHomeContent` / `EmailAuthForm`
- OTP/session/createInvitation API 및 `RequireAuth`
- GENERAL 갤러리·계좌·RSVP·댓글 기능
