# Global Invitation Native App

Expo + React Native + TypeScript 네이티브 앱 (제작자용).

## 요구 사항

- Node.js 20+
- Android Studio (Android Dev Client / 실기기)
- EAS CLI (`npm i -g eas-cli`) — 클라우드 빌드 시

## 환경 분리

| | Development | Production |
|---|---|---|
| 앱 이름 | Global Invitation DEV | Global Invitation |
| Android package / iOS bundle | `com.globalinvitation.app.dev` | `com.globalinvitation.app` |
| Scheme | `globalinvitation-dev://` | `globalinvitation://` |
| API | `backend-development-c9a4.up.railway.app` | `backend-production-f6f3.up.railway.app` |
| Web | `frontend-development-1b8a.up.railway.app` | `frontend-production-54bf.up.railway.app` |

URL SSOT: `src/config/environment.ts`

## 설치

```bash
cd apps/native
npm install
```

## 실행 (루트에서)

```bash
npm run native:start
npm run native:android
```

## Development Dev Client

Expo Go 대신 Dev Client 사용을 권장합니다.

```bash
cd apps/native
APP_VARIANT=development npx expo run:android
# 또는
eas build --profile development --platform android
```

## Production 빌드 설정

```bash
cd apps/native
APP_VARIANT=production eas build --profile production --platform android
```

iOS는 Apple Developer 계정·서명이 필요합니다 (Windows에서는 EAS cloud build).

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run native:start` | Metro (development) |
| `npm run native:android` | Android 에뮬레이터/연결 기기 |
| `npm run native:typecheck` | `tsc --noEmit` |
| `npm run native:test` | Jest unit tests |

## 인증

- Web과 동일 `AuthSession` + `Authorization: Bearer` (쿠키 없음)
- 토큰 저장: `expo-secure-store` only (`src/stores/authStore.ts`)

## 결제

`NATIVE_PAYMENT_MODE=DISABLED_PENDING_POLICY` — UI·쿠폰 검증까지, 실제 앱 내 결제 CTA 비활성.

## 알려진 블로커

1. **Preview token API** — `POST /api/invitations/:id/owner-preview-token` 백엔드 미배포 시 WebView 미리보기 불가
2. **Native Maps SDK** — Location은 MVP 폼 입력; Google/Naver native SDK 키·WebView picker 후속
3. **Store 결제 정책** — IAP / 외부 결제 정책 검토 후 `src/config/payment.ts` 갱신
4. **Toss 해외 승인** — live charge 대기

## 구조

```
app/           Expo Router 화면
src/api/       API client
src/components/ 공통 UI
src/config/    environment, payment
src/stores/    auth (zustand + SecureStore)
src/theme/     design tokens
```
