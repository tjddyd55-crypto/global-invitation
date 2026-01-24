# Project_History_20260123_2303.md

## Project Context
- 글로벌 모바일 초대장 SaaS. 템플릿 선택 → 초대장 생성/편집/공유 흐름을 제공.
- 1차 글로벌 런칭 기준선 이후, **wedding_classic** 템플릿을 실사용 가능한 “기준 완성본”으로 확정하는 단계.
- 현재 목표는 디자이너에게 전달 가능한 구조/데이터/슬롯을 고정하고, 공유(OG) 미리보기까지 정상화하는 것.

## Tech Stack & Environment
- Frontend: Next.js 14 (App Router), React 18, TypeScript
- Backend: Node.js, Express, Prisma, PostgreSQL
- i18n: 커스텀 I18nContext + keys/locales 기반
- CI: GitHub Actions (lint + i18n check)
- Deploy: Railway (Frontend/Backend 분리 서비스)

## Accomplishments
- **API 연결**: Frontend는 `NEXT_PUBLIC_API_URL`만 사용하도록 고정 (fallback 제거).
- **Routing Guard**: slug 없는 editor/invitation 접근 시 create로 리다이렉트.
- **템플릿 필터**: 그룹 내 OR / 그룹 간 AND로 정확히 동작하도록 수정.
- **태그 표시**: 카드에서 선택된 태그 우선 표시(최대 3개 유지).
- **정적 자산 임시 배치**: `/public/music` 테스트 mp3 추가, `/public/templates` 및 `favicon.ico` 임시 추가.
- **wedding_classic 템플릿 구현**:
  - `frontend/src/templates/weddingClassic`에 데이터/스타일/레이아웃 구성.
  - hero, intro, couple, gallery, calendar, location, RSVP, accounts, messages 섹션 구성 완료.
  - 네비 버튼/복사 버튼 UI 포함(동작은 미구현).
- **OG 메타 동적 처리**:
  - `app/invitation/[slug]/layout.tsx`에서 slug 기반 `og:title/description/image` 생성.
  - demo slug는 DB 없이도 메타 생성 가능.
- **Demo Invitation**:
  - `/invitation/demo-wedding-classic`에서 실제 초대장처럼 동작하는 기준 완성본 제공.

## Key Logic/Structure
- 템플릿 데이터: `frontend/src/constants/templates.ts`
  - `Template.tags`는 `country/mood/event`로 분리.
  - `classic` 키는 `wedding_classic`으로 정규화하여 호환 유지.
- wedding_classic 데이터 구조:
  - `frontend/src/templates/weddingClassic/data.ts`에 **콘텐츠 슬롯 정의** 및 샘플 데이터 생성.
  - `DEMO_WEDDING_CLASSIC_SLUG = demo-wedding-classic` 고정.
- OG 메타 처리:
  - `app/invitation/[slug]/layout.tsx`에서 slug 기반 fetch → 메타 생성.
  - demo slug는 mock 데이터로 메타 생성.
- Invitation 렌더링:
  - `app/invitation/[slug]/page.tsx`에서 `templateKey` 확인 후 wedding_classic 레이아웃 렌더.

## Pending Tasks
- **Railway 배포 확인**:
  - Frontend env: `NEXT_PUBLIC_API_URL`만 유지 (중복 키 제거).
  - Frontend 재배포 후 OG/템플릿/UI 반영 확인.
- **Backend 설정**:
  - Railway Backend `DATABASE_URL` 누락 시 설정 필요.
- **임시 자산 교체**:
  - `/public/images/wedding/classic/*` → 실제 웨딩 사진/지도 이미지로 교체.
  - `/public/music/*` → 실제 음원으로 교체 또는 경량화.
- **버튼 실제 동작**:
  - 지도 네비 버튼 실제 링크 연결.
  - 계좌 복사 버튼 Clipboard 동작 구현.
- **Lint 경고 처리**:
  - `<img>` 관련 Next.js 경고 해결 필요 시 `next/image`로 전환.
- **문서화 정리**:
  - README에 demo slug 안내/OG 메타 설명 추가(선택).
