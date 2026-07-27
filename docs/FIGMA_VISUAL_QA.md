# Figma Visual QA — Layout / Masked Pixel

## 판정 원칙 (정상화 후)

1. **동일 데이터** (`scripts/figma-pixel-qa/sample-fixture.json`)
2. **동일 폰트** `Noto Sans KR` + system fallback
3. **Layout mode**: Hero/Couple/Gallery/Map = 단색 placeholder
4. **Primary metric**: `maskedMismatch` (이미지 내부 mask 후)
5. **비교 방식**: 공통 영역 crop (stretch 금지). 크기 차이는 `sizeDelta`/`geometryMismatch`로 별도 보고
6. Threshold: ≤0.02 PASS · ≤0.05 REVIEW · >0.05 FAIL

Raw mismatch는 콘텐츠 차이 진단용이며 **최종 PASS/FAIL에 직접 사용하지 않는다.**

## 최종 배포 / 캡처

| 항목 | 값 |
|------|-----|
| Frontend | https://frontend-development-1b8a.up.railway.app |
| deployment id | `45100a3f-9c8f-44a8-aa62-001294a83d57` |
| imageDigest | `sha256:ce035be60168d716559903402e6f262ae9ffb5156809714629f534bdd6f92a25` |
| commit (UI) | `97f20c8` |
| commit (QA) | `deebc53` + pixel-diff crop |
| captureAt | `2026-07-27T07:48:41Z` |

## 산출물

`artifacts/figma-pixel-qa/{reference,actual,overlay,diff,masked-diff,reports}/`

## Layout masked 결과 (primary)

| 화면 | raw | masked | geometry | 판정 | 원인 |
|------|-----|--------|----------|------|------|
| Public Hero | 0.886 | **0.007** | 0 | **PASS** | 이미지 내부만 달랐음 → mask 후 정렬 |
| Public Gallery | 0.070 | **0.007** | Δh | **PASS** | 동일 |
| Public Map | 0.593 | **0.025** | Δh | **REVIEW** | 내비 버튼/타이포 AA |
| Public Couple | 0.042 | **0.042** | Δh | **REVIEW** | 세로 gap/폰트 렌더 |
| Public Guestbook | 0.036 | **0.036** | Δh | **REVIEW** | 버튼 gap/AA |
| Public Share | 0.037 | **0.037** | Δh | **REVIEW** | 버튼 폭/색 채도 |
| Desktop Editor Basic | 0.175 | 0.175 | Δ | **FAIL** | 실폼 ↔ form reference 잔차 |
| Mobile Editor Basic | 0.088 | 0.088 | 0 | **FAIL** | 동일 |
| Desktop Public | 0.957 | 0.957 | Δ | **FAIL** | fullPage vs hero-only ref (기준 미정렬) |

## Medium 이슈 처리

| 이슈 | 결과 |
|------|------|
| 콘텐츠 불일치로 Hero/Gallery 오판 | Layout+mask로 **PASS** 정상화 |
| Share hierarchy | Figma 2버튼(공유하기/링크 복사)+bottom sheet (`InvitationShareBlock`) |
| Guestbook 날짜 | 날짜만 표시 (시간 제거) |
| Couple geometry | 120×160 / r16 유지, layout REVIEW |

## 최종 판정

**Public Invitation (layout-masked): CONDITIONAL PASS**  
→ 필수 Public 화면이 모두 PASS 또는 ≤0.05 REVIEW.

**Overall Figma pixel 1:1: FAIL (Editor / Desktop Public 기준 미달)**  
→ Editor step form reference 고도화와 Desktop Public full-page reference가 남아 있음.

High: **0** (배너/셸/이미지 오판 제거)  
Medium 잔여: Editor form fidelity, Desktop Public reference  
Low: Couple/Guestbook/Share REVIEW (AA·미세 spacing)

## 실행

```bash
npm run figma:pixel:qa
npm run figma:pixel:diff
```
