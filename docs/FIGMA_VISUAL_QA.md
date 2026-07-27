# Figma Visual QA — Pixel Overlay

최종 판정은 **이미지 overlay/diff 증거** 기준이다. 구조·치수 assertion만으로 PASS 하지 않는다.

## 기준 배포본 (작업 시작 시점)

| 항목 | 값 |
|------|-----|
| Frontend URL | https://frontend-development-1b8a.up.railway.app |
| deployment id | `69acf80f-0429-4477-b069-6379644582de` |
| createdAt | `2026-07-27T01:08:02.107Z` |
| imageDigest | `sha256:945ccd6f93650c9d82c3bb5e33e50cd9077cf07ec074d518f88ecd51d400df25` |
| Git SHA (시작) | `dd1d3e41e8dfbc68354885f76f04e387f5e2a302` |
| 비고 | 이후 수정 배포 시 본 표의 **재배포 후** 섹션으로 갱신 |

## Reference 생성 방식

- Figma Make (`GwuOKQ8rH3R547iFVrojvv`)는 MCP `get_screenshot` **미지원**
- SSOT: MCP `get_design_context` → `PublicInvitationPage.tsx` / `DesktopEditorScreen.tsx` / `EditorScreen.tsx` 수치
- Reference 렌더: `scripts/figma-pixel-qa/figma-reference.html` (Figma Make 수치 1:1)
- Actual: Railway development Frontend, 동일 viewport · `deviceScaleFactor=1`

## 산출물 경로

- `artifacts/figma-reference/`
- `artifacts/railway-actual/`
- `artifacts/figma-diff/` (`*-side-by-side.png`, `*-overlay.png`, `*-diff.png`, `diff-report.json`)
- 실행 메타: `artifacts/figma-diff/baseline.json`

## 실행

```bash
npm run figma:pixel:qa
npm run figma:pixel:diff
```

## 화면별 판정표

| 화면 | Reference | Actual | Overlay/Diff | mismatch | 결과 | 심각도 | 수정 파일 | 비고 |
|------|-----------|--------|--------------|----------|------|--------|-----------|------|
| Desktop Editor Basic | editor-desktop-basic-1440.png | 동명 | figma-diff/* | (실행 후) | PENDING | — | EditorHeader / WeddingEditor | share banner 제거 |
| Mobile Editor Basic | editor-mobile-basic-375.png | 동명 | figma-diff/* | (실행 후) | PENDING | — | EditorHeader | banner 0 |
| Public Hero 375 | public-mobile-hero-375.png | 동명 | figma-diff/* | (실행 후) | PENDING | — | WeddingClassicInvitation | Hero 520 |
| Public Couple 375 | public-mobile-couple-375.png | 동명 | figma-diff/* | (실행 후) | PENDING | Medium→수정 | WeddingClassicInvitation(.module.css) | 120×160 / r16 |
| Public Guestbook 375 | public-mobile-guestbook-375.png | 동명 | figma-diff/* | (실행 후) | PENDING | Medium→수정 | WeddingClassicInvitation | 메시지 카드만 |
| Public Gallery 375 | public-mobile-gallery-375.png | 동명 | figma-diff/* | (실행 후) | PENDING | — | — | 420 full-width |
| Public Map 375 | public-mobile-map-375.png | 동명 | figma-diff/* | (실행 후) | PENDING | — | — | 280 / r0 |
| Public Share 375 | public-mobile-share-375.png | 동명 | figma-diff/* | (실행 후) | PENDING | — | GlobalSharePanel | |
| Desktop Public | (fullPage actual) | public-desktop-1440.png | — | — | PENDING | — | publicInvitationMobile | |

## 이번 수정 요약

### High
- (배포 전) Figma reference vs Railway overlay 미실행 → 파이프라인 추가

### Medium
- Couple: 120×120 → **120×160**, radius 16, `object-position: center top`, grid/연락 버튼
- Guestbook: `showGuestbook` void 제거, 메시지 카드 섹션 렌더 (빈 배열이면 Contract대로 생략)
- Editor publish/share banner: Editor form 상단 제거, Publish Complete에만 `share-panel` / `share-url`

### Low
- RSVP 섹션 배경을 transparent로 정리 (본문형)

## 재배포 후 (갱신 예정)

| 항목 | 값 |
|------|-----|
| deployment id | TBD |
| imageDigest | TBD |
| commit SHA | TBD |
| 캡처 시각 | TBD |
| Figma pixel 1:1 최종 판정 | TBD |
