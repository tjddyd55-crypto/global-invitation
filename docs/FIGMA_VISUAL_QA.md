# Figma Visual QA — Pixel Overlay

최종 판정은 **이미지 overlay/diff 증거** 기준이다. 구조·치수 assertion만으로 PASS 하지 않는다.

## 재배포 후 기준 배포본 (최종 캡처)

| 항목 | 값 |
|------|-----|
| Frontend URL | https://frontend-development-1b8a.up.railway.app |
| deployment id | `5c66cb67-5b37-468d-8278-c4893b814f26` |
| createdAt | `2026-07-27T01:37:xxZ` (list SUCCESS) |
| imageDigest | `sha256:f7068bc7491a9fb084d2609f55985e9f476c62ab6b96f4545067bd90e2402cc6` |
| webpack chunk | `/_next/static/chunks/webpack-95579dc1efb70b87.js` |
| Git SHA | `4f596d95142efc3230fefd4d21f094ed32fc7e2c` |
| 캡처 시각 | `2026-07-27T01:38:43.248Z` |

### 작업 시작 시점 (구버전 · 무효)

| 항목 | 값 |
|------|-----|
| deployment id | `69acf80f-0429-4477-b069-6379644582de` |
| imageDigest | `sha256:945ccd6f93650c9d82c3bb5e33e50cd9077cf07ec074d518f88ecd51d400df25` |
| Git SHA | `dd1d3e41e8dfbc68354885f76f04e387f5e2a302` |

## Reference 생성 방식

- Figma Make (`GwuOKQ8rH3R547iFVrojvv`)는 MCP `get_screenshot` **미지원**
- SSOT: MCP `get_design_context` → `PublicInvitationPage.tsx` / Editor 수치
- Reference 렌더: `scripts/figma-pixel-qa/figma-reference.html`
- Actual: Railway development Frontend, 동일 viewport · `deviceScaleFactor=1`

## 산출물

| 종류 | 경로 | 수량 (최종) |
|------|------|-------------|
| Figma reference | `artifacts/figma-reference/` | 8 |
| Railway actual | `artifacts/railway-actual/` | 11 |
| overlay | `artifacts/figma-diff/*-overlay.png` | 8 |
| diff | `artifacts/figma-diff/*-diff.png` | 8 |
| report | `artifacts/figma-diff/diff-report.json` | 1 |
| baseline | `artifacts/figma-diff/baseline.json` | 1 |

## 화면별 판정표 (이미지 기준)

| 화면 | mismatch | 결과 | 심각도 | 비고 |
|------|----------|------|--------|------|
| Desktop Editor Basic | 0.144 | FAIL | Medium | wireframe SSOT vs 실폼 콘텐츠 차이 |
| Mobile Editor Basic | 0.082 | FAIL | Medium | 동일 (실폼/헤더 세부) |
| Public Hero 375 | 0.575 | FAIL | Medium | 실 Hero 사진 vs reference 그라데이션 |
| Public Couple 375 | 0.326 | FAIL* | Low~Medium | *치수 120×160/r16/pad 56×24 **DOM PASS**. 픽셀 FAIL은 사진 vs 이니셜 에셋 |
| Public Guestbook 375 | 0.063 | REVIEW | Low | 카드/버튼 hierarchy 일치. 날짜 포맷·폰트 렌더 차이 |
| Public Gallery 375 | 0.999 | FAIL | Medium | reference placeholder vs 실 이미지 carousel |
| Public Map 375 | 0.732 | FAIL | Medium | reference placeholder vs 실 지도 블록 |
| Public Share 375 | 0.108 | FAIL | Medium | GlobalSharePanel 그리드 vs Figma 2버튼 |

### DOM 검증 (최종 배포)

- Couple frame: **120×160**, radius **16px**, section padding **56px 24px**
- Guestbook padding **56px 20px**, buttons `전체보기` / `작성하기`
- Editor `share-panel` count: **0** (Publish Complete만 사용)

## Medium 이슈 처리

| 이슈 | 결과 | 파일 |
|------|------|------|
| Couple 120×160 | DOM PASS | `WeddingClassicInvitation.tsx` / `.module.css` |
| Guestbook 카드형 | DOM PASS / pixel REVIEW | 동일 |
| Editor publish banner | PASS (제거) | `app/editor/[slug]/page.tsx`, `PublishCompleteScreen.tsx` |

## 최종 판정

**Figma pixel 1:1: FAIL (미완료)**

근거:
1. 필수 overlay/diff는 생성됨
2. Couple/Guestbook/Editor banner의 **구조·치수**는 Figma Make 수치와 일치
3. 그러나 전체 화면 pixelmatch에서 Medium급 mismatch가 남아 High=0·Medium=0 조건을 충족하지 않음
4. 구조 assertion만으로 PASS 처리하지 않음

### 남은 항목

- High: 0 (레이아웃 shell/배너 잔존 없음)
- Medium: Editor wireframe↔실폼, Hero/Gallery/Map 에셋, Share 버튼 hierarchy
- Low: Guestbook 6.3% 폰트/날짜, 좁은 desktop preview 축소

## 실행

```bash
npm run figma:pixel:qa
npm run figma:pixel:diff
```
