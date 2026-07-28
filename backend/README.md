# Backend API Server

Express.js + TypeScript + Prisma backend server for Global Invitation.

## Operating mode (현재)

1. **Local** — 주 개발 환경 (UI, OTP mock, migration 검증)
2. **Railway dev** — 로컬 QA 통과 후 URL/공유/실이메일 테스트
3. **Railway production** — 지금은 켜지 않음. migrate 금지.

Production DB에 바로 `migrate deploy` 하지 마세요.

## Prerequisites

- Node.js 20
- PostgreSQL 14+ (로컬 설치 또는 Docker)

## Setup (local-first)

### 1. Install Dependencies

```bash
npm install
```

### 2. Database (권장: Docker)

저장소 루트에서:

```bash
docker compose up -d
```

`backend/.env` 예시:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/global_invitation?schema=public"
PORT=3001
NODE_ENV=development
EMAIL_PROVIDER=mock
FRONTEND_URL=http://localhost:3000
```

로컬에 이미 PostgreSQL이 있다면:

1. `postgres` 사용자 비밀번호를 알고 있는 값으로 `DATABASE_URL`을 맞춥니다.
2. DB를 만듭니다: `CREATE DATABASE global_invitation;`
3. Railway URL은 `.env`에 주석으로만 남겨 두고 사용하지 않습니다.

### 3. Run Migrations (local only)

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Start Development Server

```bash
npm run dev
```

Server: http://localhost:3001  
Health: `GET /health` → `{ "status": "ok" }`

Frontend (별도 터미널):

```bash
cd ../frontend
npm run dev
```

## Email OTP (개발)

- `EMAIL_PROVIDER=mock` + `EMAIL_ENABLED=false`: 실발송 없음
- `ALLOW_EMAIL_PREVIEW_CODE=true` 이고 위 mock 조건일 때만 `POST /api/auth/email/request-code` 응답에 `previewCode` 포함
- 차단 조건(하나라도 해당 시 미반환): `NODE_ENV=production`, `EMAIL_PROVIDER≠mock`, `EMAIL_ENABLED=true`, `ALLOW_EMAIL_PREVIEW_CODE≠true`
- DB에는 해시만 저장. URL·로그·health 에 원문 코드를 넣지 않음
- Railway development: `ALLOW_EMAIL_PREVIEW_CODE=true` / production: 설정하지 않음

## Railway 전환 시점

로컬에서 아래가 통과된 뒤에만 Railway **dev**를 켭니다.

1. 이메일 입력 → 인증번호 확인 → 세션
2. 컨셉 선택 → 초대장 생성 → 에디터 저장 → 공개
3. `/i/{shareSlug}` 접근, RSVP/방명록 무인증

그다음 Railway **dev** DB에만:

```bash
npx prisma migrate deploy
```

## Prisma Commands

- `npm run db:migrate` - Create and run migrations (`prisma migrate dev`)
- `npm run db:generate` - Generate Prisma Client
- `npm run db:studio` - Open Prisma Studio

스키마 상세는 `prisma/schema.prisma` 를 보세요. 작성자 OTP는 `email_verification_codes` 테이블을 사용합니다.
