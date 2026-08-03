# Template Expansion — Figma Make 분석 (구현 전)

**Figma Make:** https://www.figma.com/make/JubE0zOzIFX2DVDqtKhYeJ/Proceed-with-development  
**Make fileKey:** `JubE0zOzIFX2DVDqtKhYeJ`  
**분석일:** 2026-08-03 (재검증 2026-08-03 19:30 KST — Make `App.tsx`/`index.css` MCP 재확보)  
**상태:** Phase 2A–2E 구현 진행 (development 전용)

---

## 1. 소스 접근

| 항목 | 결과 |
|------|------|
| MCP `whoami` | 성공 (`tjddyd55`) |
| `get_metadata` on Make | 미지원 (Design only) |
| `get_design_context` `nodeId=0:1` | **성공** — Make 전체 소스 resource 목록 반환 |
| 핵심 파일 | `src/App.tsx`, `src/index.css`, `src/main.tsx`, `package.json`, redesign 지시문 md |
| 별도 템플릿 파일 | **없음** — 6종 전부 `App.tsx` 인라인 |
| 모션 라이브러리 | **없음** — React 19 + Tailwind 4 + 순수 CSS `@keyframes` |

---

## 2. 확인한 파일

- `src/App.tsx` — picker + 6 template components + shared Top/Lightbox/DateGrid/MapBlock/Account/Rsvp
- `src/index.css` — 375px canvas, 템플릿별 CSS, keyframes, reduced-motion
- `src/main.tsx`, `index.html`, `package.json`, `vite.config.ts`
- `src/imports/pasted_text/invitation-templates-redesign.md` — 구조 지시 SSOT
- `src/imports/pasted_text/wedding-invitation-templates*.md` — 추가 메모(존재)
- Make image assets (png hashes) — 썸네일/프리뷰용으로 보임 (본문 이미지는 Unsplash)

---

## 3. 신규 템플릿 component 6개 (Figma Make 실제 이름)

| Make id | Component | 표시명 |
|---------|-----------|--------|
| `w04` | `WeddingEditorialTemplate` | WEDDING 04 — Modern Editorial |
| `w05` | `WeddingGardenTemplate` | WEDDING 05 — Romantic Garden |
| `w06` | `WeddingNightTemplate` | WEDDING 06 — Minimal Night |
| `g04` | `GeneralCleanTemplate` | GENERAL 04 — Clean Event |
| `g05` | `GeneralFestiveTemplate` | GENERAL 05 — Festive Color |
| `g06` | `GeneralCultureTemplate` | GENERAL 06 — Culture & Exhibition |

권장 서비스 ID (string, Prisma enum 아님):

- `WEDDING_04_EDITORIAL`, `WEDDING_05_GARDEN`, `WEDDING_06_NIGHT`
- `GENERAL_04_CLEAN`, `GENERAL_05_FESTIVE`, `GENERAL_06_CULTURE`

---

## 4. 템플릿별 section 순서 (App.tsx 기준)

### WEDDING 04 Editorial
1. Topbar  
2. `ed-hero` 이미지 + 세로 날짜  
3. `ed-names` 큰 이름 / 부제 / 일시 / scroll cue  
4. `ed-letter` 인사말  
5. `ed-profile` 비대칭 신랑·신부  
6. `ed-gallery` editorial collage + Lightbox(clean)  
7. `ed-schedule` 큰 월 숫자 + DateGrid  
8. MapBlock  
9. Account  
10. Rsvp  

### WEDDING 05 Garden
1. Topbar  
2. `garden-hero` 아치 이미지 + 이름 + 날짜  
3. `garden-letter` 편지 인사말  
4. `garden-people` 엇갈린 프로필 + 연락 pill  
5. `garden-date` DateGrid + 리본형 장소  
6. `garden-gallery` polaroid + Lightbox(clean)  
7. MapBlock → Account → Rsvp  

### WEDDING 06 Night
1. Topbar  
2. `night-hero` full-bleed dark  
3. `night-info` cinematic intro  
4. `night-film` horizontal gallery + Lightbox(dark)  
5. `night-venue` + MapBlock  
6. `night-calendar`  
7. Account → Rsvp  

### GENERAL 04 Clean
1. Topbar  
2. `clean-hero` 제목 우선  
3. `clean-facts` 3-col quick info  
4. `clean-image` 가로 대표 이미지  
5. `clean-copy` 소개  
6. `clean-calendar`  
7. `clean-gallery` 2열 archive  
8. MapBlock → Account(event) → Rsvp  

### GENERAL 05 Festive
1. Topbar  
2. `festive-hero` 포스터 + shapes + sticker 날짜  
3. `festive-copy`  
4. `festive-gallery` scrapbook columns  
5. `festive-calendar`  
6. MapBlock  
7. `ticket` + Account(event)  
8. Rsvp(festive)  

### GENERAL 06 Culture
1. Topbar  
2. `culture-hero` 40/60 split + 세로 제목  
3. `culture-quote`  
4. `culture-program` + DateGrid  
5. `poster-strip` snap gallery  
6. MapBlock  
7. `culture-ticket`  
8. Rsvp  
(공유 전용 섹션은 Make JSX에 없음 — Topbar 공유 버튼만)

---

## 5. 주요 layout 차이 요약

| | Hero | Gallery | Calendar highlight | Tone |
|--|------|---------|--------------------|------|
| Editorial | 300px 이미지 + 하단 큰 이름 분리 | full→2col→offset tall | thin circle | DM Serif, #a63d33 RSVP |
| Garden | 아치 `border-radius:180px 180px 0 0` | polaroid + arch first | petal blob fill | Gowun Batang, cream |
| Night | 420px grayscale full-bleed | horizontal 78% film | gold filled square | #111 dark |
| Clean | 텍스트 우선, 이미지는 이후 | 2열 equal | teal square | modular brochure |
| Festive | rotated photo + sticker | CSS columns scrapbook | orange circle | #ffe34d / #301f6c |
| Culture | 40% vertical title / 60% image | poster snap 70% | orange square | exhibition grid |

---

## 6. 애니메이션 목록 (index.css)

| Name | Effect | Used by |
|------|--------|---------|
| `rise` | opacity 0→1, Y+16→0, blur 4→0, 0.65–1s | `.reveal`, garden ornament, festive img, culture title |
| `fade` | opacity | lightbox |
| `slowpan` | scale 1.06→1, 8s | editorial hero |
| `zoomout` | scale 1.08→1, 1s | night hero |
| `pop` | scale 0.94→1 + rotate -9deg | festive sticker |
| `press` | scale 0.96 mid | RSVP chosen |

**미구현(지시문에는 있으나 Make CSS에 약함/없음):**
- scroll-triggered IntersectionObserver reveal (대부분 로드 시 1회)
- editorial title stagger / divider line draw
- garden profile slide-in
- night mask/letter-spacing reveal, line draw, music ring
- festive shape translate (shapes는 static)
- culture grid wipe / sticky section number

`prefers-reduced-motion: reduce` → 전역 `animation: none !important` 있음.

---

## 7. 이미지·폰트 자산

### Fonts (Google Fonts CDN)
- `DM Serif Display` (ital)
- `Gowun Batang` 400/700
- `Noto Sans KR` 400–700  
→ 서비스 사용 가능(합법적 대체 불필요). Next.js에서는 `next/font` 또는 기존 font 파이프라인으로 이식 권장.

### Images
- **본문:** Unsplash 임시 URL 다수 (`images.unsplash.com/...`) — **Public/Renderer 하드코딩 금지**
- **Make png assets:** MCP `file://figma/make/image/...` 해시 png 10장 — 썸네일 후보, R2 이전 필요
- 분류: 전부 **R2 shared 이전 필요** 또는 승인 스톡으로 교체

권장 R2:
`invitation/shared/images/templates/{templateId}/thumbnail.webp`  
`invitation/shared/images/templates/{templateId}/sample-*.webp`

---

## 8. 기존 서비스 데이터 mapping

| Figma `Data` | WEDDING SSOT | GENERAL SSOT |
|--------------|--------------|--------------|
| `title` | `title` / couple names | `title` |
| `subtitle` | `introQuote` / `heroSubtitle` | intro / subtitle |
| `date`/`time` | `eventDate` / `weddingDateTime` | `eventDateTime` |
| `venue`/`detail` | `venueName` / `venueDetail` | 동일 |
| `image` | `heroImage` | 동일 |
| `photos[]` | `gallery.images` | 동일 |
| `accent` | template theme token (저장 불필요) | 동일 |
| 신랑·신부 | `groom`/`bride` (+ contact) | N/A |
| 계좌 | accounts selector | accounts + `accountEnabled` |
| RSVP | Public API | 동일 |
| 지도 | `getInvitationMapSettings` | 동일 |
| 음악/공유 | music controller / share block | 동일 |

---

## 9. 그대로 재사용 가능

- `getInvitationScheduleCalendarModel` (날짜 계산만; UI는 템플릿별)
- Gallery lightbox state 패턴, `galleryDisplayMode`
- Map settings / Google·Naver navigation
- Account copy + multi-account selectors
- RSVP API (PUBLIC only)
- Music playback controller
- Share Kakao/LINE/URL
- Concept presentation config / editor steps (FUNERAL 무변경)
- `Invitation` `templateKey` String 컬럼 (mig 없이 새 key 가능)

---

## 10. 재구현 필요

- 6개 독립 renderer JSX + CSS modules (Make App.tsx를 서비스 레이어에 맞게 이식)
- Template visual Registry (현재는 `invitation_full` + concept만)
- Template Preview route + fixtures (DB write 0)
- 고객용 템플릿 목록/카드/썸네일
- Create flow에 `templateId`/`templateKey` 전달·검증
- Editor 현재 템플릿 표시·변경 UX
- `renderMode`: TEMPLATE_PREVIEW | EDITOR_PREVIEW | PUBLIC
- MapBlock mock → 실제 LocationMapSection 연결 (시각 래퍼는 템플릿별)
- Account mock → 실제 accounts UI (템플릿별 presentation)
- Scroll reveal helper (`useInViewOnce`) — Make보다 강화 필요 시 지시문 personality 준수
- Dynamic import per renderer (번들)

---

## 11. 디자인 변경이 불가피한 부분 (승인 필요)

1. **기존 “01~03”:** 코드베이스에 `WEDDING_01` 식 시각 템플릿 없음. 현재 `WeddingClassicInvitation` / `GeneralInvitationRenderer` 1종씩만 존재 → Classic을 `*_01_CLASSIC`(가칭)으로 등록하고 02·03은 없거나 추후. **임의로 02·03을 새로 디자인하지 않음.**
2. **저장 SSOT:** `templateKey=invitation_full` 유지 + `dataJson.templateVariant` 또는 신규 registry key(`wedding_editorial` 등). 권장: **additive `dataJson.visualTemplateId`** + engine key는 `invitation_full` 유지 (기존 초대장 회귀 최소).
3. **Culture 공유 섹션:** Make에 본문 share 섹션 없음 → 서비스 Public 공유 SSOT를 하단/Top에 연결하되 Make 레이아웃을 깨지 않게 배치.
4. **계좌 accordion / 다계좌:** Make는 단일 계좌 → 시각은 유지하고 내부만 multi-account.
5. **Unsplash → R2** 샘플 이미지 교체 (비율·톤 유지).
6. **스크롤 parallax/line-draw 등:** Make에 약하거나 없음 → redesign.md personality를 기준으로 **추가 구현** (원본 단순화 금지 원칙과 충돌 시 personality 지시문을 우선).

---

## 12. 예상 변경 파일 (구현 시)

- `frontend/src/templates/registry.ts` 및 신규 `visualTemplateRegistry.ts`
- `frontend/src/templates/renderInvitationByConcept.tsx` / `full/FullInvitationRenderer.tsx`
- `frontend/src/templates/weddingEditorial|Garden|Night/*`
- `frontend/src/templates/generalClean|Festive|Culture/*`
- `frontend/src/templates/shared/motion/*`
- `frontend/src/templates/previewFixtures/*`
- `frontend/app/templates/...` 또는 `/create` 템플릿 선택·preview route
- `frontend/src/features/templates|concept|create/*`
- `frontend/src/editors/wedding/*` (템플릿 표시/변경)
- `frontend/src/invitation/schemas.ts` (visualTemplateId optional)
- Backend: create validation only if needed (`invitations.ts` template allowlist) — **Prisma mig 불필요 예상**
- E2E: `e2e/template-*.spec.ts`
- Docs: PLATFORM / invitation structure 갱신

---

## 13. DB migration

**불필요 예상.** `templateKey` String, conceptType JSON.  
시각 ID는 JSON 필드 또는 registry key로 추가.

---

## 14. Backend

- 최소: create/update 시 visual template allowlist 검증  
- templates 테이블 seed/row (선택)  
- FUNERAL·기존 invitation_full 무변경  

---

## 15. 구현 순서 (승인 후)

1. Registry + `visualTemplateId` 계약 + Classic=01 매핑  
2. Preview fixtures + `/templates/{id}/preview` + CTA create  
3. WEDDING 04→06 renderers (Make CSS/JSX 이식 + SSOT wiring)  
4. GENERAL 04→06 동일  
5. Editor 표시/변경 + Public resolver + dynamic import  
6. Motion/a11y/perf + R2 assets  
7. E2E 6종 + 01 회귀 + development 배포  

**renderer 구현은 본 문서 승인 전까지 시작하지 않음.**
