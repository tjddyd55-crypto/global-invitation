# 템플릿 라이프사이클 E2E 검증 보고서 (템플릿)

수동 체크리스트와 자동 API 스펙을 함께 둡니다.

## 사전 조치 (이번 세션에서 수행됨)

| 항목 | 결과 | 비고 |
|------|------|------|
| `npx prisma migrate deploy` | ✅ 적용 완료 | `20260318100000_template_admin_reject_reason` 적용 |
| `npx prisma migrate status` | ✅ `Database schema is up to date!` | |
| 빈 마이그레이션 폴더 제거 | ✅ | `20260217120000_super_credits`, `20260217140000_template_admin_reject_reason` (내용물 없음 → `migrate deploy` P3015 유발) **저장소에 반영 필요(커밋)** |
| `npm run build` (backend) | ✅ `tsc` 성공 | |

## 자동 API E2E

```bash
# 백엔드가 http://localhost:3001 에서 떠 있고 NODE_ENV !== production 일 때
cd global_invitation
npx playwright test e2e/template-lifecycle-admin-api.spec.ts
```

- 파일: `e2e/template-lifecycle-admin-api.spec.ts`
- 크리에이터 **CREATED** 템플릿: 공개 `POST /api/templates/my` 가 없어 **관리자 `POST /api/admin/templates` + `status: CREATED`** 후 크리에이터가 `PATCH .../studioConfig` 로 보강하는 방식으로 동일 상태를 재현합니다.

## 시나리오 보정 (체크리스트와 실제 규칙)

1. **5-6 승인**: `REJECTED` 직후 `APPROVED` 는 전이표상 불가 → 중간에 관리자 `PATCH { status: 'PENDING_REVIEW' }` 필요.
2. **11 권한**: 관리자 세션 없이 호출 시 **401** `ADMIN_AUTH_REQUIRED` (403 아님).
3. **7 Disable**: `ARCHIVED` 는 `isDeleted` 로 영구 숨김. **일시 비활성**은 `DISABLED`(PUBLISHED + 비활성) 전이.
4. **8~10 (프론트/로그)**: 브라우저·서버 수동 확인; 스크린샷은 로컬에서 캡처.

## 수동 단계 체크리스트 (결과 기입용)

| # | 단계 | 성공 | 실패 시 응답/로그 |
|---|------|------|-------------------|
| 2 | 서버 기동 로그 `Backend server running` | | |
| 3 | ADMIN / CREATOR / USER 계정 | | |
| 4-1 | 템플릿 생성 → `lifecycleStatus` CREATED | | |
| 4-2 | `POST .../submit` → PENDING_REVIEW | | |
| 5-1 | admin login + cookie + `/api/admin/me` 200 | | |
| 5-2 | `GET /api/admin/templates` 에 항목 존재 | | |
| 5-3 | `GET .../preview?mode=real` → `sampleData: null` | | |
| 5-4 | 반려 sans 사유 → 400 `REJECT_REASON_REQUIRED` | | |
| 5-5 | 크리에이터 `GET /api/templates/my` 에 사유 | | |
| 5-6~7 | PENDING_REVIEW → APPROVED → PUBLISHED | | |
| 6 | `GET /api/templates/marketplace` 노출 | | |
| 7 | ARCHIVED 후 마켓 미노출 | | |
| 8 | preview `postMessage` → 목록 갱신 | | |
| 9 | 썸네일 URL 표시 | | |
| 10 | 로그 키워드 | | |
| 11 | 실패 케이스 (전이, 401) | | |
