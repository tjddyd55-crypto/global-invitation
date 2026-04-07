# QA 통과 결과 (FULL + conceptType)

기준일: 2026-04-07

## 1) 생성 → 공개 전체 플로우

| 항목 | WEDDING | FUNERAL | GENERAL | 비고 |
|---|---|---|---|---|
| 템플릿 선택 → 컨셉 선택 | PASS | PASS | PASS | `/templates`에서 FULL 단일 카드 + 컨셉 버튼 |
| 에디터 입력/저장 | PASS | PASS | PASS | `/editor/:slug` 단일 에디터, 컨셉별 입력 노출 |
| 공개 `/i/{shareSlug}` | PASS | PASS | PASS | published 상태 공유 경로 정상 |
| 공유 링크 재접속 | PASS | PASS | PASS | `/i` 재진입 및 렌더/트래킹 정상 |

## 2) 섹션 노출 검증

| 검증 항목 | 결과 | 근거 |
|---|---|---|
| WEDDING에서만 커플 정보 표시 | PASS | `WeddingClassicInvitation`에서 `conceptType === 'WEDDING'` 분기 |
| FUNERAL에서만 고인/빈소/발인 표시 | PASS | `conceptType === 'FUNERAL'` 분기 |
| GENERAL에서 wedding/funeral 전용 섹션 미노출 | PASS | 전용 섹션 분기 미충족 시 렌더 금지 |

## 3) 기능 동작 검증

| 기능 | 결과 | 비고 |
|---|---|---|
| 지도 렌더 + lat/lng 반영 | PASS | `LocationMapSection` + `mapLat/mapLng` |
| 네비 버튼 동작 | PASS | 카카오/네이버/T맵 URL 생성기 사용 |
| RSVP 제출/수정 | PASS | `/api/rsvp` + `/api/rsvp/:id` PATCH |
| 공유(Web Share/카카오) | PASS | 페이지 하단 공유 섹션에서 동작 |
| 음악 재생 | PASS | 공유/음악 섹션 버튼으로 재생 |
| 갤러리 로드 | PASS | WEDDING/GENERAL 렌더 확인 |

## 4) 데이터 저장 검증

| 규칙 | 결과 | 근거 |
|---|---|---|
| GENERAL 저장 시 wedding/funeral 필드 미포함 | PASS | mapper의 GENERAL return은 공통 필드만 |
| WEDDING 저장 시 funeral 필드 미포함 | PASS | mapper의 WEDDING branch 전용 |
| FUNERAL 저장 시 wedding 필드 미포함 | PASS | mapper의 FUNERAL branch 전용 |

## 5) URL/트래킹 검증

| 규칙 | 결과 | 근거 |
|---|---|---|
| 공개 URL은 `/i/{shareSlug}` | PASS | public URL builder 및 published 리다이렉트 |
| `/invitation/{slug}`에서 published 시 `/i` 이동 | PASS | 내부 페이지 리다이렉트 효과 유지 |
| 조회수는 `/i`에서만 증가 | PASS | `trackInvitationView` 호출 위치 `/i` |

## 6) 금지사항 검증

| 금지사항 | 결과 |
|---|---|
| 컨셉 무관 섹션 표시 금지 | PASS |
| 숨겨진 필드 저장 금지 | PASS |
| localStorage RSVP 금지 | PASS |
| templateType 분기 금지 (`conceptType`만) | PASS |

## 7) 빌드 검증

- `frontend`: `npx tsc --noEmit` 통과
