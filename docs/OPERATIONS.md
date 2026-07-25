# 운영 안정화 체크리스트

Railway **development** 토폴로지·빈 DB bootstrap·SMTP/R2 분리 규칙은  
[`docs/RAILWAY_DEVELOPMENT.md`](./RAILWAY_DEVELOPMENT.md) 를 본다.  
production 에 development bootstrap(`db push` + resolve)을 적용하지 않는다.

## 환경 변수 (운영 필수)
- `NEXT_PUBLIC_SITE_URL`: canonical/OG/공유/이벤트 로그 `page_url`의 단일 기준 URL
- `NEXT_PUBLIC_API_BASE_URL` (권장) 또는 `NEXT_PUBLIC_BACKEND_URL`: 백엔드 공개 URL (프론트 API base)
- `NEXT_PUBLIC_API_URL` (레거시): 사용 중이면 `NEXT_PUBLIC_API_BASE_URL`로 이동 권장
- `DATABASE_URL`: 백엔드 DB 연결 문자열
- `PORT`: 백엔드 포트 (기본 3001)

## URL 기준 규칙
- canonical/OG/공유/로그 URL은 모두 `NEXT_PUBLIC_SITE_URL` 기반으로 생성한다.
- `window.location.origin` 직접 사용 금지.
- URL 생성은 `frontend/src/lib/siteUrl.ts` 유틸만 사용한다.

## 이벤트 로그 구조
- 테이블: `event_logs`
- 컬럼: `id`, `event_type`, `template_type`, `language`, `page_url`, `metadata`, `created_at`
- 허용 이벤트 타입: `invitation_view`, `share_click`, `editor_open`, `preview_open`
- `metadata`는 optional이며 서버에서는 해석하지 않는다.

## 공유 UX 규칙
- Web Share API 실패 시 자동으로 링크 복사 fallback.
- 클립보드 실패 시 수동 복사 UI 노출.
- 공유 버튼 연타 방지(단발성 실행).
- editor/preview URL은 공유하지 않고 canonical URL만 사용.

## 날짜 포맷 규칙
- 날짜/시간 출력은 `formatDate`/`formatTime`/`formatDateTime`만 사용.
- 직접 `Intl.DateTimeFormat` 사용 금지.

## i18n 키 네이밍 규칙
- `share.*`
- `invitation.*`
- `message.*`
- `relationship.*`

## Postgres UUID 확장 확인
- Prisma schema에서 `gen_random_uuid()`를 기본키 생성 함수로 사용하므로, 운영 DB에 `pgcrypto` 확장이 설치되어 있어야 한다.
- 배포 전에 다음 SQL을 실행해 기능을 검증한다:
  ```
  SELECT gen_random_uuid();
  ```
- 실행 시 `function gen_random_uuid() does not exist` 에러가 발생하면, `pgcrypto` 확장을 설치하거나 DBA에 요청해야 한다.

## 새 템플릿 추가 체크리스트
- 템플릿 데이터/프리뷰 구성 추가
- 공유 문구용 `share.*` i18n 키 추가
- 템플릿 타입을 이벤트 로깅에 반영
- canonical/OG/공유 URL은 `NEXT_PUBLIC_SITE_URL` 기준 유지
- 날짜 출력은 포맷 유틸만 사용
