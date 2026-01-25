# Database Setup

## Migration Tool: Prisma

**선택 이유:**
- TypeScript/Node.js 프로젝트에 최적화
- 타입 안전성 제공 (Prisma Client 자동 생성)
- 스키마 변경 추적 및 마이그레이션 관리 용이
- 개발 환경과 프로덕션 환경 모두에서 일관된 사용 가능
- Next.js 생태계와 잘 통합됨

## Database: PostgreSQL

- **Provider:** PostgreSQL 14+
- **Connection:** `DATABASE_URL` 환경변수 사용
- **Local:** `postgresql://user:password@localhost:5432/global_invitation?schema=public`
- **Production:** Railway 등에서 제공하는 `DATABASE_URL` 사용

## Tables

### users

**Purpose:** 사용자 정보 저장 (인증 전 단계, email은 optional)

**Columns:**
- `id` (uuid, PK) - 사용자 고유 식별자
- `email` (varchar, unique, nullable) - 이메일 주소 (선택적)
- `created_at` (timestamp) - 생성 시각

**Notes:**
- email은 nullable 허용 (게스트 사용자 지원)
- 인증 로직은 현재 단계에서 구현하지 않음

### invitations

**Purpose:** 초대장 정보 저장

**Columns:**
- `id` (uuid, PK) - 초대장 고유 식별자
- `user_id` (uuid, FK to users.id, nullable) - 소유자 (게스트 초대장은 null)
- `slug` (varchar, unique) - URL 친화적 식별자 (예: "wedding-2024-john")
- `country_code` (varchar, default: 'GLOBAL') - 국가 코드
- `language` (varchar, default: 'en') - 언어 코드
- `status` (varchar, default: 'draft') - 상태: 'draft' | 'published'
- `is_paid` (boolean, default: false) - 결제 완료 여부
- `can_share` (boolean, default: false) - 공유 가능 여부
- `paid_at` (timestamp, nullable) - 결제 완료 시각
- `created_at` (timestamp) - 생성 시각
- `updated_at` (timestamp) - 수정 시각 (자동 업데이트)

**Indexes:**
- `slug` - unique index (필수)

**Notes:**
- `user_id`는 nullable (게스트 초대장 생성 가능)
- `is_paid`, `can_share`는 기본값 false (결제 로직은 추후 구현)
- 결제 관련 필드는 상태만 저장, 실제 결제 로직은 구현하지 않음

### event_logs

**Purpose:** 공유/뷰/에디터/미리보기 이벤트 로그 기록

**Columns:**
- `id` (uuid, PK) - 이벤트 로그 고유 식별자
- `event_type` (varchar) - 이벤트 타입 (예: invitation_view)
- `template_type` (varchar) - 템플릿 타입 (wedding/funeral/message/branded)
- `language` (varchar) - 언어 코드
- `page_url` (varchar) - canonical URL
- `metadata` (jsonb, nullable) - 확장 메타데이터
- `created_at` (timestamp) - 생성 시각

**Notes:**
- 운영 로깅 최소 목적이며, 비즈니스 로직과 분리

## Migration Commands

```bash
# 마이그레이션 생성 및 적용
npm run db:migrate

# Prisma Client 생성
npm run db:generate

# Prisma Studio (DB GUI)
npm run db:studio
```

## Connection Test

Backend 서버의 `/health` 엔드포인트에서 데이터베이스 연결 상태를 확인할 수 있습니다.
