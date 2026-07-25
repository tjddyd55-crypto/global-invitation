# Railway Development 운영 메모

## 현재 development 토폴로지

| 역할 | 서비스 | URL / 비고 |
|------|--------|------------|
| DB | **Postgres** | Backend `DATABASE_URL=${{Postgres.DATABASE_URL}}`. volume `postgres-volume-YaVo` |
| API | **Backend** | https://backend-development-c9a4.up.railway.app |
| Web | **Frontend** | https://frontend-development-1b8a.up.railway.app |

공식 구조:

```
Postgres
  └─ Backend
       └─ Frontend
```

### 삭제 완료 (임시 서비스)

| 서비스 | 비고 |
|--------|------|
| `Postgres-GqoC` | 전용 volume `postgres-volume-X7E2` 포함 삭제 |
| `FrontendDev` | 임시 frontend. 공식 Frontend 복구 후 삭제 |

production 환경의 Postgres / Backend / Frontend 는 변경하지 않는다.

---

## Development DB bootstrap 기술 부채

### 현상

빈 PostgreSQL에 `prisma migrate deploy`만 실행하면 초반 migration이 실패한다.

- 예: `20260124030000_auth_guest_flow`가 `invitations` / `users` 테이블을 **ALTER** 하지만,  
  해당 테이블을 **CREATE** 하는 migration이 체인 squashed 이전 이력에 없다.
- 로컬/구 production DB는 과거에 이미 테이블이 있는 상태에서 migration이 쌓였기 때문에 동작한다.

### development 빈 DB 초기화 (공식 Postgres)

1. Backend `DATABASE_URL`이 **Postgres**(`postgres.railway.internal`)인지 확인  
   - production proxy(`centerbeam`) 금지  
   - `postgres-gqoc` 금지
2. 보존할 QA 데이터가 다른 development DB에 있으면 dump/restore 후 진행
3. 스키마만 필요한 경우: `prisma db push` + 각 migration `prisma migrate resolve --applied <name>`
4. 이후 Backend start의 `prisma migrate deploy`는 **no-op** (이미 applied)

### 금지

- **production DB에 동일 방식(`db push` + 일괄 resolve) 사용 금지**
- production `_prisma_migrations` history 임의 수정 금지
- production `migrate deploy`를 development 절차와 섞지 말 것
- `postgres-volume-YaVo` 삭제 금지 (development Postgres 유지)

### 권장 후속 (별도 작업)

1. **Baseline / squash migration**  
   - 현재 스키마를 반영한 단일 baseline SQL을 새 체인의 시작점으로 두고  
   - 신규 환경은 `migrate deploy`만으로 bootstrap 가능하게 한다.
2. 그 전까지 신규 빈 DB는 위 development 절차를 문서화 절차로만 재현한다.

### 신규 development DB 재현 절차 (요약)

```bash
# 1) Railway development + Postgres DATABASE_URL 확인 (secret 출력 금지)
cd backend
# DATABASE_URL=<dev-public-url>  (sakura proxy / postgres.railway.internal 계열만)
npx prisma db push --accept-data-loss --skip-generate
# 각 migration 디렉터리명에 대해:
npx prisma migrate resolve --applied <migration_name>
# 2) Backend 재배포 → migrate deploy no-op → /health database=connected
```

---

## Frontend 배포 메모 (development)

- 서비스: **Frontend** (rootDirectory `frontend/`)
- 브랜치: `chore/cleanup-legacy`
- `NODE_ENV=production` (Next build 요구. Railway 환경명은 계속 development)
- `HOSTNAME=0.0.0.0`
- `frontend/railway.json` buildCommand: `npm run build` (`npm ci` 금지 — cache mount EBUSY)
- monorepo 루트에서 `railway up -s Frontend -e development` (서비스 rootDirectory 활용)

실패 원인으로 자주 본 것:

- `npm ci` buildCommand + cache mount
- `NODE_ENV=development`로 Next production build 실패
- `next start`가 `0.0.0.0`에 bind되지 않음
- 잘못된 API/SITE URL (FrontendDev 잔존)

---

## SMTP (development only)

필수 변수 (Backend development):

- `EMAIL_PROVIDER=smtp`
- `EMAIL_ENABLED=true`
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE`
- `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM`
- `EMAIL_CODE_PEPPER` (기존 development 값 유지)

`/health` 기대값 (secret 미포함):

```json
{
  "email": {
    "provider": "smtp",
    "emailEnabled": true,
    "smtpConfigured": true,
    "mockMode": false
  }
}
```

production 변수·발송 설정 변경 금지.

---

## R2 (development)

- 코드 키: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENDPOINT`, `R2_REGION`, `R2_PUBLIC_BASE_URL`
- Frontend: `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` (Backend public base와 일치)
- **공유 버킷 사용 시** Backend에 `R2_KEY_PREFIX=development` 를 설정한다.  
  객체 키는 `development/invitation/...` 형태로 기록된다.
- 이상적으로는 development 전용 버킷을 분리한다.

---

## 브랜치 / 배포

- feature 브랜치: `chore/cleanup-legacy`
- main / production 자동 반영 금지
