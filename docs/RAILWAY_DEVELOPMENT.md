# Railway Development 운영 메모

## 현재 development 토폴로지

| 역할 | 서비스 | URL / 비고 |
|------|--------|------------|
| DB | **Postgres-GqoC** | Backend만 참조. volume `postgres-volume-X7E2` |
| API | **Backend** | https://backend-development-c9a4.up.railway.app |
| Web | **FrontendDev** | https://frontenddev-development.up.railway.app |

### 미사용 후보 (삭제 전 재확인)

| 서비스 | 상태 | Backend/FrontendDev 참조 | 삭제 |
|--------|------|--------------------------|------|
| `Postgres` | SUCCESS (legacy volume YaVo) | **없음** (`DATABASE_URL` → `postgres-gqoc`) | 조건부 가능* |
| `Frontend` | FAILED | CORS/`FRONTEND_URL` **미사용** (FrontendDev만 사용) | 조건부 가능* |

\* Railway가 주입하는 `RAILWAY_SERVICE_FRONTEND_URL` 등 자동 변수에 legacy 이름이 남을 수 있으나 앱 코드는 사용하지 않는다.  
\*\* production 환경의 동일 서비스명과 혼동하지 말 것. development에서만 제거할지 대시보드에서 환경 범위를 재확인한 뒤 삭제한다.

---

## Development DB bootstrap 기술 부채

### 현상

빈 PostgreSQL에 `prisma migrate deploy`만 실행하면 초반 migration이 실패한다.

- 예: `20260124030000_auth_guest_flow`가 `invitations` / `users` 테이블을 **ALTER** 하지만,  
  해당 테이블을 **CREATE** 하는 migration이 체인  squashed 이전 이력에 없다.
- 로컬/구 production DB는 과거에 이미 테이블이 있는 상태에서 migration이 쌓였기 때문에 동작한다.

### 2026-07 development(Postgres-GqoC)에서 사용한 초기

1. Backend `DATABASE_URL`이 **Postgres-GqoC**인지 확인 (production host 금지)
2. `prisma db push`로 현재 `schema.prisma`와 스키마 동기화
3. `prisma/migrations/*` 28개를 각각 `prisma migrate resolve --applied <name>`
4. 이후 Backend start의 `prisma migrate deploy`는 **no-op** (이미 applied)

### 금지

- **production DB에 동일 방식(`db push` + 일괄 resolve) 사용 금지**
- production `_prisma_migrations` history 임의 수정 금지
- production `migrate deploy`를 development 절차와 섞지 말 것

### 권장 후속 (별도 작업)

1. **Baseline / squash migration**  
   - 현재 스키마를 반영한 단일 baseline SQL을 새 체인의 시작점으로 두고  
   - 신규 환경은 `migrate deploy`만으로 bootstrap 가능하게 한다.
2. 그 전까지 신규 빈 DB는 위 development 절차를 문서화 절차로만 재현한다.

### 신규 development DB 재현 절차 (요약)

```bash
# 1) Railway development + Postgres-GqoC(또는 후속 전용 인스턴스) DATABASE_URL 확인
# 2) 로컬에서 public URL로 (secret 출력 금지)
cd backend
# DATABASE_URL=<dev-public-url>
npx prisma db push --accept-data-loss --skip-generate
# 각 migration 디렉터리명에 대해:
npx prisma migrate resolve --applied <migration_name>
# 3) Backend 재배포 → migrate deploy no-op → /health database=connected
```

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
