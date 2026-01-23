# Project_History_20260123_1749.md

## Project Context
- 글로벌 모바일 초대장 SaaS. 사용자가 템플릿을 선택해 초대장을 생성/편집/공유하는 구조.
- 1차 글로벌 런칭 기준선 확정 단계: frontend/backend 분리 구조 확정 및 배포 스냅샷 커밋 완료.

## Tech Stack & Environment
- Frontend: Next.js 14 (App Router), React 18, TypeScript, ESLint (next/core-web-vitals)
- Backend: Node.js, Express, Prisma, PostgreSQL
- i18n: 커스텀 i18n 컨텍스트 + 키/로케일 파일 기반
- CI: GitHub Actions (`i18n-checks` 워크플로)
- Scripts: `scripts/check-i18n.ts` (키/로케일 정합성 검사)

## Accomplishments
- 루트 구조를 `frontend/` + `backend/`로 확정 및 기준선 커밋/푸시 완료.
- i18n 단일 기준 루트 (`frontend/src/i18n/`) 구축:
  - `keys.ts`, `locales/*.ts`, `types.ts`, `t.ts`, `language.ts`, `index.ts`
- 언어 초기화 로직 구현:
  - 사용자 저장값(로컬/쿠키) → 브라우저 언어 → `en` fallback
- UI 하드코딩 문자열 일부 제거 및 i18n 키로 치환:
  - `/create`, `/editor/[slug]`, `/invitation/[slug]`의 에러/알림/placeholder
  - 템플릿 미리보기 샘플 텍스트 및 날짜 포맷 언어 반영
- i18n 자동 검증 도구 추가:
  - ESLint: `eslint-plugin-i18next` (`i18next/no-literal-string`) 규칙 적용
  - `check:i18n` 스크립트로 키/로케일 불일치 검사
- CI 파이프라인 추가:
  - PR 시 `lint` + `check:i18n` 실행

## Key Logic/Structure
- i18n 구조:
  - 키 정의: `frontend/src/i18n/keys.ts` (단일 `I18N_KEYS`, `as const`)
  - 번역: `frontend/src/i18n/locales/{en,ko,mn}.ts` (flat key map)
  - 번역 함수: `frontend/src/i18n/t.ts` (`translate`)
  - 초기 언어 결정: `frontend/src/i18n/language.ts` (`getInitialLanguage`)
- 핵심 데이터 구조:
  - Template: `frontend/src/constants/templates.ts` (`TEMPLATES` 상수 + 태그/가격/추천)
  - Invitation API 타입: `frontend/src/lib/api.ts`
  - DB 스키마: `backend/prisma/schema.prisma`
    - `Invitation` 모델: slug, title, eventDate, locationText, message, templateKey, musicKey, language, canShare 등
- 주요 API 엔드포인트:
  - `POST /api/invitations` 생성
  - `GET /api/invitations/:slug` 조회
  - `PUT /api/invitations/:slug` 수정

## Pending Tasks
- QA 체크리스트 전체 실행 (언어 초기화/전환, create→editor→invitation 흐름, 공유 기능).
- ESLint 규칙 적용 범위 검토:
  - 현재 `app/**`가 제외되어 있어 페이지 하드코딩 문자열 차단이 제한됨.
  - 점진 적용 계획 수립 필요.
- 기존 컴포넌트의 `t('key')` 사용을 `I18N_KEYS` 기반으로 통일(점진 리팩터링).
- `.next/` 빌드 산출물은 계속 제외 유지 확인.
- 배포 환경 변수 확인:
  - Backend `DATABASE_URL`, Frontend `NEXT_PUBLIC_API_URL`

