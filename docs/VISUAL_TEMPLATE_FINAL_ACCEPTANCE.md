# Visual Template — Final Acceptance

**판정:** 완료  
**작성일:** 2026-08-05  
**환경:** Railway development only (`main` / `production` 미반영)

이 문서는 `docs/VISUAL_TEMPLATE_POLISH_REPORT.md`(구현·시각 마감)와 분리된 **최종 검증·승인 기록**이다.  
SSOT 충돌 시 본 문서의 검증 결과가 우선한다.

---

## 1. 최종 판정 요약

| 영역 | 결과 |
|------|------|
| Public 6종 인터랙션 | PASS (`artifacts/visual-template-acceptance/public-interactions.json`) |
| sparse Public regression | PASS |
| Editor protected deep-diff | PASS (WEDDING/GENERAL) |
| FUNERAL Editor/Preview/Public | PASS |
| reduced-motion 6종 | PASS |
| Preview side effect | PASS (Invitation write 0, view analytics 0) |
| 모바일 18건 | PASS |
| R2 34/34 | PASS |
| Figma 6종 | PASS WITH ACCEPTED DIFFERENCE (Make screenshot API 미지원 · development 재대조) |
| origin push | 본 문서 커밋 후 수행 |

---

## 2. 배포 / Git

| 항목 | 값 |
|------|-----|
| Branch | `chore/cleanup-legacy` |
| Frontend deployment ID | `7d3c4b0b-af05-45d6-a9e9-28261b703c5e` |
| Backend deployment ID | `079e3d32-2b42-4d9b-9255-0fbc3591b7ce` |
| FE URL | `https://frontend-development-1b8a.up.railway.app` |
| BE URL | `https://backend-development-c9a4.up.railway.app` |
| main/production | 미반영 |

관련 기능 수정 commit (전체 SHA는 git log 참조):

- sparse Public render
- resume race
- editor draft preserve + datetime-local
- RSVP `rsvpEnabled` backend 정렬

---

## 3. Public 6종 인터랙션

각 템플릿: basic / gallery+lightbox / accounts+copy / map / music / share / RSVP(실저장) **PASS**.

참고:

- Public 계좌 UI는 accordion이 아니라 **flat cards** (제품 현재 정책). 여러 계좌 표시·복사로 검증.
- RSVP 연락처 필드는 폼에 없음 — 이름/참석/인원/메시지·실제출로 검증.

---

## 4. sparse Public

자동화: `e2e/visual-template-sparse-public.spec.ts`  
templateType 누락, title-only, date-only, Classic fallback, optional 없음 — fixture 누수 없이 renderer 진입.

---

## 5. Editor deep-diff

보호 필드(title/gallery/accounts/music/map/RSVP/people 등)만 비교.  
baseline = 첫 저장(정규화) 이후. 템플릿 전환 시 `visualTemplateId` 외 보호 필드 변경 0.

결과 JSON:

- `artifacts/visual-template-acceptance/editor-deep-diff-wedding.json`
- `artifacts/visual-template-acceptance/editor-deep-diff-general.json`

---

## 6. FUNERAL

Editor 단계·Switcher 미노출·`visualTemplateId` 미삽입·Preview/Public `data-concept=FUNERAL` · share block · reload — PASS.

---

## 7. Figma (375×812)

대상 Make: `https://www.figma.com/make/JubE0zOzIFX2DVDqtKhYeJ/...`  
Figma MCP `get_screenshot` 은 **Make 미지원**. development Template Preview를 polish QA·모션 로그로 재대조.

| 템플릿 | 등급 |
|--------|------|
| Editorial | PASS WITH ACCEPTED DIFFERENCE |
| Garden | PASS WITH ACCEPTED DIFFERENCE |
| Night | PASS WITH ACCEPTED DIFFERENCE |
| Clean | PASS WITH ACCEPTED DIFFERENCE |
| Festive | PASS WITH ACCEPTED DIFFERENCE |
| Culture | PASS WITH ACCEPTED DIFFERENCE (sticky section number 미적용 승인) |

승인 차이: R2 이미지, next/font, 실지도, Culture sticky 미적용, touch target.

---

## 8. 모션 / reduced-motion

- `artifacts/visual-template-acceptance/motion-watch-log.json` — 6종 reveal 관찰, 판정 `보임`
- reduced-motion 6종 opacity 0 잔존 0

---

## 9. Preview side effect

`artifacts/visual-template-acceptance/preview-side-effects.json`  
Preview 6종 순회 시 Invitation POST/PATCH/RSVP/view analytics **0**.

---

## 10. 이번 검증에서 고친 결함

1. Editor draft 미적용 시 gallery/music/accounts 기본값 덮어쓰기 → draft 우선 로드
2. `toDateTimeLocal` UTC 밀림 → 벽시계 유지
3. Backend RSVP가 `rsvp.enabled`만 인정 → `rsvpEnabled` 정렬
4. sparse Public `templateType` 누락 (이전 핸드오프)

---

## 11. main 반영 전

- [ ] 디자인 오너 Figma Make 수동 픽셀 서명 (기술 등급은 승인 차이)
- [ ] production 배포 승인
- [ ] BE health `build.sha` 가 railway up 메타데이터에서 unknown 일 수 있음 — deployment ID로 추적
