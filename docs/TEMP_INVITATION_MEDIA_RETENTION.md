# Temporary Invitation Media Retention

사용자 초대장 업로드의 R2 orphan 누적을 막기 위한 보존·정리 정책입니다.

## 제품 원칙

- 이전 단계 / 뒤로가기 / 새로고침 / 에디터 이탈 → **즉시 삭제하지 않음**
- 초대장 `dataJson`에 참조된 미디어 → **삭제 금지**
- 사용자가 명시적으로 이미지 삭제 → 참조 제거 후 R2/MediaFile 정리
- 어떤 초대장에도 참조되지 않은 사용자 전용 업로드 → **72시간 후** dry-run/cleanup 대상
- `invitation/shared/...` 공용 자산 → **절대 삭제 금지**

## 생명주기 모델 (migration 없음)

저장 SSOT를 추가하지 않습니다.

| 판정 | 기준 |
|------|------|
| ATTACHED | 삭제되지 않은 Invitation의 `data` / `dataJson` / `musicKey`에 object key 또는 CDN URL 참조 |
| TEMP (미참조) | MediaFile 존재 + canonical user key + active 참조 없음 |
| 정리 후보 | TEMP + `createdAt` < now − retention |

## 환경 변수

| 변수 | 기본 | 설명 |
|------|------|------|
| `INVITATION_TEMP_MEDIA_RETENTION_HOURS` | `72` | 24–720. invalid → 72 |
| `INVITATION_TEMP_MEDIA_CLEANUP_BATCH_SIZE` | `100` | 1회 최대 삭제 수 |
| `INVITATION_TEMP_MEDIA_SAFETY_THRESHOLD` | `1000` | 후보 ≥ 이 값이면 execute 중단 |
| `INVITATION_TEMP_MEDIA_CLEANUP_ENABLED` | `false` | worker 자동 삭제. development 검증 전 false 유지 |

## 스크립트

```bash
cd backend

# Dry-run (삭제 0)
npm run invitation:media:audit

# Dry-run cleanup 요약
npm run invitation:media:cleanup

# 수동 실행 (development만, 승인 후)
npm run invitation:media:cleanup -- --execute
```

## Staging temp

Confirm 전 staging 키 `invitation/{env}/temp/...` 는 cleanup worker가 **24시간** 기준으로 정리합니다.

## 운영 활성화 단계

1. dry-run 감사만
2. development `--execute` 1회 + 재감사
3. `INVITATION_TEMP_MEDIA_CLEANUP_ENABLED=true` (development)
4. production은 dry-run 배포 후 별도 승인

main/production cleanup 자동 활성화는 이번 범위에 포함하지 않습니다.
