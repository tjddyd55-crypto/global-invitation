# Temporary Invitation Media Retention

사용자 초대장 업로드의 R2 orphan 누적을 막기 위한 보존·정리 정책입니다.

## 제품 원칙

- 이전 단계 / 뒤로가기 / 새로고침 / 에디터 이탈 → **즉시 삭제하지 않음**
- 초대장 `dataJson`에 참조된 미디어 → **삭제 금지**
- 사용자가 명시적으로 이미지 삭제 → **persist 성공 후** R2/MediaFile 정리
- 어떤 초대장에도 참조되지 않은 사용자 전용 업로드 → **72시간 후** dry-run/cleanup 대상
- `invitation/shared/...` 공용 자산 → **절대 삭제 금지**

## 생명주기 모델 (migration 없음)

저장 SSOT를 추가하지 않습니다.

| 판정 | 기준 |
|------|------|
| ATTACHED | 삭제되지 않은 Invitation의 `data` / `dataJson` / `musicKey`에 object key 또는 CDN URL 참조 |
| TEMP (미참조) | MediaFile 존재 + canonical user key + active 참조 없음 |
| 정리 후보 | TEMP + `createdAt` < now − retention |

## 명시적 삭제 순서 (Gallery / Hero / Profile / Share)

공통 helper: `frontend/src/editors/wedding/lib/persistThenDeleteMedia.ts`

1. draft에서 참조 제거
2. invitation persist (`onSave` / PATCH)
3. persist 성공 확인
4. `DELETE /api/media`
5. Backend active reference 재확인
6. R2 exact delete + MediaFile soft-delete

실패 정책:

| 단계 | UI | R2/MediaFile |
|------|----|--------------|
| persist 실패 | **rollback** (이미지 복원) | 삭제 호출 없음 |
| delete 실패 | **제거 유지** + 안내 | 미참조 → 72h cleanup 회수 |

Backend 가드 (`assertInvitationUserMediaSafeToDelete`):

- shared → 403
- active dataJson 참조 → **409 MEDIA_STILL_REFERENCED**
- reference scan 실패 → 503 fail-closed

Share HERO 모드(대표 이미지 재사용)는 R2 delete를 건너뛴다.

## CleanupJob vs temp cleanup 책임

| 경로 | 책임 |
|------|------|
| Invitation soft-delete → `CleanupJob` | 해당 invitation 전용 object exact delete |
| temp cleanup | active JSON에 참조되지 않은 canonical MediaFile (72h+) |

- Invitation 삭제 시 MediaFile을 즉시 soft-delete → temp cleanup overlap 0
- 두 경로 모두 exact-key + idempotent

## 환경 변수

| 변수 | 기본 | 설명 |
|------|------|------|
| `INVITATION_TEMP_MEDIA_RETENTION_HOURS` | `72` | 24–720. invalid → 72 |
| `INVITATION_TEMP_MEDIA_CLEANUP_BATCH_SIZE` | `100` | 1회 최대 삭제 수 |
| `INVITATION_TEMP_MEDIA_SAFETY_THRESHOLD` | `1000` | 후보 ≥ 이 값이면 execute 중단 |
| `INVITATION_TEMP_MEDIA_CLEANUP_ENABLED` | `false` | worker 자동 삭제 |

## 스크립트

```bash
cd backend
npm run invitation:media:audit
npm run invitation:media:cleanup
npx tsx scripts/verify-temp-invitation-media-dev.ts
npm run invitation:media:cleanup -- --execute   # development + exact key 검수 후만
```

## Worker / cron

- cleanupWorker **1분** tick
- unreferenced cleanup은 enable 시에만 **최대 1시간 1회**
- 하루 1회 SLA 없음 → **automatic cleanup false 유지**
- cron 추가·production enable 금지 (별도 승인)

## Railway development 검증 (2026-08-06)

| 항목 | dry-run 전 | execute 후 |
|------|------------|------------|
| active Invitation | 210 | 210 |
| MediaFile active | 34 | 29 |
| ATTACHED | 29 | 29 |
| TEMP / 72h+ 후보 | 5 | **0** |
| 후보 bytes | ~1.0 MB | 0 |
| R2 users objects | 34 | 29 |
| R2-only / DB-only / broken | 0 / 0 / 0 | 0 / 0 / 0 |

수동 execute: planned 5 / R2 5 / DB soft-delete 5 / failed 0 · cleanup enabled **false**

QA fixture: ATTACHED 보호 · TEMP 삭제 · recent 보호 · CleanupJob overlap 0 · fixture 하드 삭제

## Persist-then-delete 마감 (2026-08-07)

- Hero / Groom / Bride / Share → Gallery와 동일 순서
- Playwright: `e2e/temp-invitation-media-lifecycle.spec.ts`
- Backend unit: temp media + shared delete guard
- Frontend unit: persistThenDeleteMedia helper
- automatic cleanup: **false**
- main/production: **미반영**

## production 활성화 전 체크리스트

- [x] development dry-run + 수동 execute + 재감사
- [x] Hero/Profile persist-then-delete
- [ ] development 자동 cleanup 관찰(승인 후)
- [ ] production dry-run 전수 검수
- [ ] 별도 승인 후 enable
