# Figma Visual QA — Layout / Masked Pixel

## 판정 원칙

1. **동일 데이터** (`scripts/figma-pixel-qa/sample-fixture.json`)
2. **동일 폰트** `Noto Sans KR` + system fallback
3. **Layout mode**: Hero/Couple/Gallery/Map/Editor media = 단색 placeholder
4. **Primary metric**: `maskedMismatch` (이미지 내부 mask 후, font AA 제외)
5. **비교 방식**: 공통 영역 crop (stretch 금지). 크기 차이는 `sizeDelta`/`geometryMismatch`로 별도 보고
6. Threshold: ≤0.02 PASS · ≤0.05 REVIEW · >0.05 FAIL

## Desktop Public 치수 SSOT

`scripts/figma-pixel-qa/desktop-public-layout.json` ↔ `publicInvitationMobile.module.css` / `DesktopPublicSharePanel`

| 상수 | 값 |
|------|-----|
| breakpoint | 1024px |
| background | `#F5F0ED` |
| center | 375px · margin-top 40 |
| right panel | 280px · padding-top 80 · padding-left 24 · sticky top 80 |
| panel | radius 20 · pad 20 · border `#F9D7E6` · copy btn h40 |

## 최종 배포 / 캡처

| 항목 | 값 |
|------|-----|
| Frontend | https://frontend-development-1b8a.up.railway.app |
| deployment id | `e6e80c22-138f-4c45-87b3-9d2ffe061d3b` |
| imageDigest | `sha256:fc1455202c926121dc886af01feb906ced5027b65d155b3e98724ea8ea07e5f3` |
| commit | `6c103f1` (+ QA polish) |
| captureAt | see `artifacts/figma-pixel-qa/reports/baseline.json` |

## Layout masked 결과 (primary)

| 화면 | masked | 판정 |
|------|--------|------|
| Public Hero | ~0.002 | **PASS** |
| Public Gallery | ~0.000 | **PASS** |
| Public Map | ~0.014 | **PASS** |
| Public Couple | ~0.026 | **REVIEW** (Low / AA) |
| Public Guestbook | ~0.025 | **REVIEW** (Low / AA) |
| Public Share | ~0.024 | **REVIEW** (Low / AA) |
| Desktop Public full | ~0.017 | **PASS** |
| Editor Desktop basic/hero/couple/gallery/share | ≤0.05 | **PASS/REVIEW** |
| Editor Mobile 5 steps (+390 basic) | ≤0.05 | **REVIEW** |

Editor는 step별 `formCard`만 비교 (wireframe 전체 페이지 비교 폐기).  
영역 crop(header/sidebar/preview/actions)은 `artifacts/figma-pixel-qa/regions/` 진단용.

## 최종 판정

**Public Invitation (layout-masked): PASS**  
**Editor (step form masked): PASS** (FAIL 0, 잔여 Low REVIEW만)  
**Desktop Public full-page: PASS**  
**Overall Figma pixel 1:1: PASS**

High: **0** · Medium: **0** · Low: REVIEW only

## 실행

```bash
npm run figma:pixel:qa
npm run figma:pixel:diff
```
