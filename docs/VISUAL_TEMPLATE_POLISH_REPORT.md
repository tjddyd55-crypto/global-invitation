# Visual Template Polish — Figma Make 비교 보고

**대상:** WEDDING 04/05/06 · GENERAL 04/05/06  
**기준 뷰포트:** 375×812 (추가 360×800, 390×844)  
**배포 환경:** development only  
**작성일:** 2026-08-05

---

## 1. 상태 정정

이전 Phase 2A–2E 결과는 **구조·기능 연결 완료** 로 정정한다.  
본 작업으로 **시각 마감** 을 마무리했다.

---

## 2. 공통 수정

| 항목 | 결과 |
|------|------|
| ISO 날짜 노출 | `scheduleDisplay` SSOT 도입. Preview/Editor/Public 및 Classic 회귀 경로에서 `2026-10-17T14:00:00` 형태 제거 |
| R2 샘플 자산 | `invitation/shared/images/templates/{id}/…` 34개 WebP 발행. `sample` SVG 전부 삭제 |
| Fixture | 웨딩/일반 각각 자연스러운 제목·인사말·혼주·계좌·지도·갤러리 11장 |
| Preview CTA | 상단은 뒤로/이름만, 하단 fixed CTA + safe-area + 108px spacer |
| 모션 | reveal 변형 확장(draw/slide/zoom), Editorial parallax, Garden slide, Night zoom+film snap, Festive sticker/shape, Clean fact sequence. Culture sticky section number 는 **미적용**(성능·스크롤 안정성) |

---

## 3. 템플릿별 Figma 비교 요약

### WEDDING_04_EDITORIAL
- **일치:** 300px+ Hero 분리, 세로 날짜 rail, DM Serif 이름, thin circle 달력, collage full→2col
- **조정:** Hero 340px·프레임 오버레이·패럴랙스, section label 하단 라인, gallery stagger
- **이미지:** 스튜디오 에디토리얼 톤 Hero + 공유 웨딩 갤러리
- **폰트:** `next/font` DM Serif / Gowun / Noto (Make CDN 대체)
- **모션:** slowpan + title stagger + line draw + gallery stagger

### WEDDING_05_GARDEN
- **일치:** 아치 Hero, 편지 카드, 엇갈린 프로필, 리본 장소, polaroid
- **조정:** botanical soft blob, polaroid 첫 장 full-width, petal calendar
- **모션:** blur reveal + profile slideLeft/Right + polaroid stagger
- **불가피 차이:** Make Unsplash → R2 승인 스톡 (구도·밝기 근접)

### WEDDING_06_NIGHT
- **일치:** full-bleed grayscale Hero, film strip 78%, gold calendar square, dark map
- **조정:** hero scale-down, title mask, divider draw, music ring footer
- **모션:** zoomout + horizontal snap gallery

### GENERAL_04_CLEAN
- **일치:** 제목 우선 · 3-col facts · 16:9 banner · 2열 archive
- **조정:** fact row sequence, accent teal, 하단 compact date
- **모션:** short fade + fact stagger

### GENERAL_05_FESTIVE
- **일치:** rotated photo, sticker 날짜, scrapbook columns, ticket block
- **조정:** shape float, sticker pop, gallery stagger
- **모션:** pop + float + scrap stagger

### GENERAL_06_CULTURE
- **일치:** 40/60 split + vertical title, poster snap 70%, section numbers, share footer
- **조정:** mask/wipe hero, denser typography
- **미적용:** sticky section number (최종 보고 명시)
- **모션:** title mask + wipe + poster snap

---

## 4. 캡처 위치

로컬/CI 실행 후:

`artifacts/visual-template-polish/{TEMPLATE}-{viewport}-{hero|mid|full}.png`

Figma Make 원본 스크린샷은 Make 파일에서 수동 대조. Make 메타데이터 API 미지원으로 자동 side-by-side 는 제한적이다.

---

## 5. 의도적으로 엄격 / 유연한 부분

- **엄격:** 날짜 포맷·자산 키·sample SVG 금지·CTA Preview 전용
- **유연:** Culture sticky number, Make Unsplash 픽셀 동일성(저작권·CDN 정책상 R2 대체)

---

## 6. 완료 체크

- [x] 실사진 R2 적용
- [x] sample 플레이스홀더 0
- [x] raw ISO 0 (표시 경로)
- [x] 개발용 placeholder 문구 0 (Preview fixture)
- [x] 375 시각 보정 6종
- [x] 360/375/390 QA 스크립트
- [x] 모션 + reduced-motion
- [x] CTA 가림 방지
- [x] Classic / FUNERAL 경로 무파괴
- [x] migration 없음
- [ ] development 배포 (커밋 후 `railway up`)
