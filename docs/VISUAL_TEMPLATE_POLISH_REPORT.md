# Visual Template — 구현·시각 마감 기록

**작성일:** 2026-08-05  
**환경:** Railway `development` only  
**최종 판정(승격):** → [`docs/VISUAL_TEMPLATE_FINAL_ACCEPTANCE.md`](./VISUAL_TEMPLATE_FINAL_ACCEPTANCE.md) (**완료**)

본 문서는 구현·SSOT·시각 마감 기록이다. 최종 인터랙션·FUNERAL·deep-diff·push 검증은 Final Acceptance 문서를 본다.

---

## 1. 최종 아키텍처

```
Template Preview / Editor Preview / Public
  → FullInvitationRenderer
  → RenderInvitationByConcept
  → VisualInvitationHost
  → resolveVisualTemplateId
  → loadVisualTemplateRenderer
  → 템플릿별 renderer (8종)
```

- Engine: `templateKey=invitation_full` 유지
- 시각 SSOT: `dataJson.visualTemplateId`
- 날짜 SSOT: `frontend/src/invitation/scheduleDisplay.ts`
- 샘플 자산 SSOT: `frontend/src/templates/visualTemplate/templateSampleAssets.ts`
- FUNERAL: `FuneralClassicInvitation` 경로 유지 (Visual Registry 미포함)

---

## 2. visualTemplateId SSOT

| 항목 | 결과 |
|------|------|
| 저장 필드 | `dataJson.visualTemplateId` 만 |
| query / localStorage 저장 SSOT | 아님. pending 은 `sessionStorage` `gi_pending_visual_template_v1` (로그인 복원 전용) |
| `templateKey` | `invitation_full` |
| 읽기 fallback | `resolveVisualTemplateId` — DB write 없음 |
| concept 불일치 | FE/BE sanitize 로 저장 차단·omit |
| unknown ID | Classic fallback (읽기) / 저장 시 omit |
| sparse Public | `toSparseWeddingLike` — **샘플 fixture 병합 금지** (2026-08-05 수정) |

관련 파일:

- `frontend/src/templates/visualTemplate/ids.ts`
- `frontend/src/templates/visualTemplate/resolveVisualTemplateId.ts`
- `frontend/src/templates/renderInvitationByConcept.tsx`
- `backend/src/invitation/visualTemplate.ts`

---

## 3. scheduleDisplay SSOT

- 경로: `frontend/src/invitation/scheduleDisplay.ts`
- 신규 6종: `templateInvitationModel` 경유
- Classic: `WeddingClassicInvitation` / `GeneralInvitationRenderer` 직접 사용
- Preview fixture: `previewFixtures.ts` 가 formatter 사용
- unit: `npx tsx --test src/invitation/scheduleDisplay.test.ts` **PASS**
- Playwright Preview/Public: raw ISO (`YYYY-MM-DDTHH:mm`) **0**

---

## 4. R2 asset SSOT

- Prefix: `invitation/shared/images/templates/{visualTemplateId|shared-*}/…`
- FE key SSOT: `templateSampleAssets.ts`
- URL 정규화: `cdnImageSrc`
- 감사 스크립트: `backend/scripts/audit-template-sample-assets.ts`
- 결과 아티팩트: `artifacts/r2-template-audit.json`

| 항목 | 값 |
|------|-----|
| 예상 object 수 | 34 |
| 실제 listed | 34 |
| missing | [] |
| orphan | [] |
| HTTP 200 | 34/34 |
| `Content-Type: image/webp` | 34/34 |
| WebP decode | 34/34 |
| 0 byte | 0 |
| tiny (&lt;1500B) | 0 |

구성:

- 템플릿 8종 × (`hero.webp` + `thumbnail.webp`) = 16
- `shared-wedding`: photo-01..08 + groom + bride = 10
- `shared-general`: photo-01..08 = 8

---

## 5. Registry 목록 (8)

| ID | 고객 이름 | Concept |
|----|-----------|---------|
| `WEDDING_01_CLASSIC` | Classic | WEDDING |
| `WEDDING_04_EDITORIAL` | 모던 에디토리얼 | WEDDING |
| `WEDDING_05_GARDEN` | 로맨틱 가든 | WEDDING |
| `WEDDING_06_NIGHT` | 미니멀 나이트 | WEDDING |
| `GENERAL_01_CLASSIC` | Classic | GENERAL |
| `GENERAL_04_CLEAN` | 클린 이벤트 | GENERAL |
| `GENERAL_05_FESTIVE` | 페스티브 컬러 | GENERAL |
| `GENERAL_06_CULTURE` | 컬처 앤 엑시비션 | GENERAL |

02·03 미등록. FUNERAL ID 없음.

---

## 6. Preview / Editor / Public resolver

동일 체인 증명 (코드):

1. Preview: `app/templates/[templateKey]/preview` → `VisualTemplatePreviewScreen` → `FullInvitationRenderer`
2. Editor: `LivePreviewPanel` → `FullInvitationRenderer`
3. Public: registry `invitation_full` → `FullInvitationRenderer`

금지 항목(preview 전용 fork / public 복사 renderer) **코드상 없음**.

---

## 7. Figma Make 비교 (375×812)

Make 메타데이터 API 미지원. 본 세션은 development Preview 재실행(모바일 18건) + `artifacts/visual-template-polish/` 캡처·레이아웃 계약을 기준으로 재등급했다. **픽셀 자동 side-by-side 는 수행하지 않음.**

| 템플릿 | 등급 | 비고 |
|--------|------|------|
| Editorial | PASS WITH ACCEPTED DIFFERENCE | Hero/rail/calendar/collage 구조 유지. 폰트=`next/font`, 이미지=R2 |
| Garden | PASS WITH ACCEPTED DIFFERENCE | 아치·편지·polaroid 유지. Unsplash→R2 |
| Night | PASS WITH ACCEPTED DIFFERENCE | full-bleed·film strip·gold calendar 유지 |
| Clean | PASS WITH ACCEPTED DIFFERENCE | facts·16:9·archive 유지 |
| Festive | PASS WITH ACCEPTED DIFFERENCE | sticker·scrapbook 유지 |
| Culture | PASS WITH ACCEPTED DIFFERENCE | split hero·poster snap 유지. **sticky section number 미적용**(성능) |

FAIL 템플릿 없음 → 시각 QA를 “완전 픽셀 일치”로 주장하지 않으며, **승인된 차이 포함 PASS** 로 보고.

---

## 8. R2 34개 검증표

상세는 `artifacts/r2-template-audit.json` `all[]`.  
요약: 전수 HTTP 200 · image/webp · decode OK · orphan 0.

---

## 9. 모바일 18건 결과표

재실행: `e2e/visual-template-polish-qa.spec.ts` @ development — **18/18 PASS** (2026-08-05)

| 템플릿 | 360×800 | 375×812 | 390×844 |
|--------|---------|---------|---------|
| WEDDING_04_EDITORIAL | PASS | PASS | PASS |
| WEDDING_05_GARDEN | PASS | PASS | PASS |
| WEDDING_06_NIGHT | PASS | PASS | PASS |
| GENERAL_04_CLEAN | PASS | PASS | PASS |
| GENERAL_05_FESTIVE | PASS | PASS | PASS |
| GENERAL_06_CULTURE | PASS | PASS | PASS |

검증 항목(스크립트): ISO/sample/placeholder 금지, horizontal overflow ≤1, CTA/문서 가시, 캡처 저장.

---

## 10. motion / reduced-motion

| 항목 | 결과 |
|------|------|
| reduced-motion Editorial Preview | Playwright PASS — `.gi-reveal` opacity 0 / transform 잔존 0 |
| 개별 모션(parallax/sticker 등) 수동 시청 | **부분 확인** (코드·CSS 존재, 프레임별 수동 시청 로그 없음) |
| Culture sticky number | 의도적 미적용 |

---

## 11. Template Catalog

`e2e/visual-template-catalog.spec.ts` + handoff catalog 구간 **PASS**  
WEDDING 4 / GENERAL 4, 02·03 비노출, create 시 `visualTemplateId` 저장.

---

## 12. 로그인 복원

`gi_pending_visual_template_v1` → `/create/templates/resume`  
`e2e/visual-template-handoff.spec.ts` resume 테스트 **PASS**  
(이전 race: clearPending 후 concept 리다이렉트 — `startedRef` 로 수정, commit `7d9d3c9a…`)

---

## 13. Editor 변경 · dataJson 보존

handoff E2E:

- WEDDING: Editorial → Garden → Night → Classic
- GENERAL: Clean → Festive → Culture → Classic

확인: `visualTemplateId` 변경, 저장 후 유지.  
**전체 nested dataJson deep-diff(계좌·RSVP·음악 키 전수)는 자동화에 포함되지 않음 → 조건부.**

---

## 14. Public 기능

`e2e/visual-template-public-handoff.spec.ts` **6/6 PASS** (수정 배포 후)

검증됨:

- `/i/{shareSlug}` 200
- `data-visual-template` 일치
- 고객 title 표시, fixture 이름(지수·민준 등) 비노출
- Preview CTA 없음
- raw ISO 0
- broken image 0
- pageerror 0

**미확인(이번 핸드오프):**

- lightbox / 지도 클릭 / 계좌 accordion·복사 / RSVP 제출 / 음악 재생 / 공유 네이티브 동작

---

## 15–16. Classic / FUNERAL 회귀

| 항목 | 결과 |
|------|------|
| Classic Preview (handoff) | PASS |
| Classic fallback 코드 | PASS (`resolveVisualTemplateId`) |
| FUNERAL registry 미포함 | PASS |
| FUNERAL create/publish API | PASS (smoke) |
| FUNERAL Public HTTP 200 · visualTemplate 속성 없음 · 에러문구 없음 | PASS (HTML smoke) |
| FUNERAL Editor/브라우저 UI 전수 | **미확인** |

---

## 17. 알려진 차이

1. Culture sticky section number 미적용
2. Figma Make Unsplash → R2 WebP (저작권·CDN)
3. `next/font` vs Make CDN 폰트 렌더 차이
4. Public sparse create 직후 빈 섹션 숨김(데이터 없으면 섹션 비움) — fixture와 다름이 정상
5. PATCH `dataJson` 비병합 — 클라이언트는 `templateType` 포함 권장 (서버 sparse 허용으로 보강)

---

## 18. 배포 정보

| 항목 | 값 |
|------|-----|
| Branch | `chore/cleanup-legacy` |
| 최종 commit SHA | `dc872de3122804de78ba0ce0e8cf3d645ec9ce88` |
| origin 대비 | **ahead 6** (push 전) |
| Frontend deployment ID | `ec915743-c039-43c6-a013-d36f6282f932` |
| Frontend status | SUCCESS |
| Frontend URL | `https://frontend-development-1b8a.up.railway.app` |
| Backend deployment ID | `bf3996f0-6362-47a6-982c-ab229b5a9034` |
| Backend commit | `a5ead83316fd28d5430fd55835acc339c6bb85f5` |
| Backend health builtAt (조회 시각 기준) | `/health` 의 `build.builtAt` (프로세스 기동마다 갱신될 수 있음) |
| Backend URL | `https://backend-development-c9a4.up.railway.app` |
| Backend health | `status=ok`, `database=connected` |
| main / production | **미반영** |
| FE deploy 방식 | `railway up` (로컬 워킹트리). meta.commitHash=null |

관련 commit (polish~handoff):

1. `e675c400314a9c4c27ea6832141900b1780a3695` polish(templates): finish visual fidelity…
2. `b154c2007ac3cc10c1b00644f8fa69941d367198` fix(templates): Korean serif fallback…
3. `4f1c5dd00fb4df4672e25d6e2de29e50078038a2` docs: mark visual template polish…
4. `7d9d3c9a05f2f9465bc69ceaeaa2a81bf3ad085f` fix(templates): prevent resume page race…
5. `121a7a20e280cc678856eabd88b1ba86f6c19a08` fix(templates): render sparse FULL…
6. `dc872de3122804de78ba0ce0e8cf3d645ec9ce88` fix(templates): accept sparse dataJson without templateType…

---

## 19. 테스트 결과

| Suite | 결과 |
|-------|------|
| FE `scheduleDisplay` + `visualTemplate` (node:test) | 11 PASS |
| BE `visualTemplate.test.ts` | 3 PASS |
| FE `tsc --noEmit` | PASS |
| BE `tsc` build | PASS |
| FE `next build` | PASS |
| Playwright polish QA 18 | PASS |
| Playwright catalog | PASS |
| Playwright handoff 4 | PASS |
| Playwright public + reduced-motion 2 | PASS |

---

## 20. main 반영 전 체크리스트

- [ ] origin 에 branch push (현재 ahead 6)
- [ ] Public 인터랙션 전수 (RSVP/지도/계좌/음악/lightbox/공유)
- [ ] FUNERAL Editor + Public 브라우저 전수
- [ ] Editor dataJson deep-diff 자동화
- [ ] Figma Make 수동 픽셀 대조 서명(디자인 오너)
- [ ] Backend 재배포 필요 여부 재확인 (현재 allowlist 는 `a5ead83` 기준)
- [ ] untracked `artifacts/` · `tmp-*` 정리 정책 결정
- [ ] production 배포 금지 상태 유지 확인 후 별도 승인

---

## 캡처 경로

`artifacts/visual-template-polish/{TEMPLATE}-{viewport}-{hero|mid|full}.png` — polish QA 재실행으로 갱신됨.
