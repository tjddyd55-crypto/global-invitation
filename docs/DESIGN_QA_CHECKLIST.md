# Design QA Checklist

Figma Make 기준안과 로컬 구현 화면을 **시각적으로** 비교하기 위한 검수 문서입니다.

- **기준 디자인:** [Figma Make — Implement Feature](https://www.figma.com/make/GwuOKQ8rH3R547iFVrojvv/Implement-Feature?t=Y75DupiA1qNejnTi-0)
- **원칙:** Figma 코드 복붙 금지. Figma는 UI/UX 기준안. 기존 아키텍처(FULL / conceptType / OTP / `/i/{shareSlug}`) 유지.
- **완료 판정:** 코드 설명이 아니라 **실제 화면 캡처**로 판단한다.

---

## 1. 검수 해상도

| 플랫폼 | Viewport |
|--------|----------|
| Mobile | **375 × 812** |
| Desktop | **1440 × 1024** |

---

## 2. 검수 대상 화면

### Mobile (375 × 812)

| # | 화면 | 로컬 경로 (예시) | 캡처 파일 |
|---|------|------------------|-----------|
| M1 | 메인 | `/m` | `artifacts/design-qa/mobile-main.png` |
| M2 | 이메일 입력 | `/auth/email` (또는 `/m` 비인증 CTA) | `artifacts/design-qa/mobile-email-start.png` |
| M3 | 인증번호 확인 | 동일 화면 step=code | `artifacts/design-qa/mobile-email-verify.png` |
| M4 | 컨셉 선택 | `/m/templates` | `artifacts/design-qa/mobile-concept-selection.png` |
| M5 | 에디터 | `/editor/{id}?concept=WEDDING` | `artifacts/design-qa/mobile-editor.png` |
| M6 | 공개 초대장 | `/i/{shareSlug}` | `artifacts/design-qa/mobile-public-invitation.png` |
| M7 | 공개 완료/공유 | `/my-invitations/{id}/complete` | `artifacts/design-qa/mobile-publish-complete.png` |
| M8 | 내 초대장 | `/m/my-invitations` | `artifacts/design-qa/mobile-my-invitations.png` |
| M9 | RSVP 관리 | `/my-invitations/{id}/rsvp` | `artifacts/design-qa/mobile-rsvp-management.png` |

### Desktop (1440 × 1024)

| # | 화면 | 로컬 경로 (예시) | 캡처 파일 |
|---|------|------------------|-----------|
| D1 | 메인 | `/pc` | `artifacts/design-qa/desktop-main.png` |
| D2 | 이메일 입력 | `/auth/email` | `artifacts/design-qa/desktop-email-start.png` |
| D3 | 인증번호 확인 | 동일 화면 step=code | `artifacts/design-qa/desktop-email-verify.png` |
| D4 | 컨셉 선택 | `/pc/templates` | `artifacts/design-qa/desktop-concept-selection.png` |
| D5 | 에디터 | `/editor/{id}?concept=WEDDING` | `artifacts/design-qa/desktop-editor.png` |
| D6 | 공개 초대장 | `/i/{shareSlug}` | `artifacts/design-qa/desktop-public-invitation.png` |
| D7 | 공개 완료/공유 | `/my-invitations/{id}/complete` | `artifacts/design-qa/desktop-publish-complete.png` |
| D8 | 내 초대장 | `/pc/my-invitations` | `artifacts/design-qa/desktop-my-invitations.png` |
| D9 | RSVP 관리 | `/my-invitations/{id}/rsvp` | `artifacts/design-qa/desktop-rsvp-management.png` |

---

## 3. 공통 디자인 검수 항목

각 화면마다 체크한다.

- [ ] 배경색이 Figma 톤(따뜻한 아이보리/베이지)과 맞는가
- [ ] 주요 컨테이너 폭이 맞는가
- [ ] 카드 radius가 16~24px 기준으로 맞는가
- [ ] 버튼 높이가 48px 이상인가
- [ ] Primary 색상이 indigo/violet 계열로 통일되었는가
- [ ] 텍스트 크기와 굵기가 Figma와 유사한가
- [ ] 섹션 간격이 너무 좁거나 넓지 않은가
- [ ] 모바일 터치 영역이 충분한가 (최소 약 48px)
- [ ] PC에서는 모바일 화면을 단순 확대하지 않았는가

---

## 4. SaaS 화면 검수 기준

**대상:** 메인 · 이메일 인증 · 컨셉 선택 · 에디터 · 내 초대장 · RSVP 관리

- [ ] 카드형 SaaS UI 유지
- [ ] 흰색 카드 + 아이보리 배경
- [ ] 버튼/입력창/카드 스타일 통일 (`designTokens.css` / GI UI)
- [ ] 모바일/PC가 같은 디자인 시스템을 공유
- [ ] PC는 넓은 화면에 맞게 레이아웃 재배치 (단순 scale 금지)

### 이메일 인증 추가 체크

- [ ] 비밀번호 입력 없음
- [ ] 회원가입/로그인 분리 없음
- [ ] 이메일 OTP만 사용 (입력 → 인증번호 확인)

### 컨셉 선택 추가 체크

- [ ] 결혼식 / 부고장 / 일반 행사 카드
- [ ] 선택 상태(border + check) 명확
- [ ] 하단 CTA: **선택하고 시작하기**
- [ ] PC 3열 / Mobile 세로 카드

---

## 5. 공개 초대장 검수 기준

**대상:** `/i/{shareSlug}`

- [ ] SaaS 카드 UI가 **아님**
- [ ] 모바일 청첩장처럼 **full-width 긴 스크롤**
- [ ] 외곽 둥근 카드 안에 전체 초대장을 넣지 않음
- [ ] Hero / 앨범 / 지도는 가로폭 **100%**
- [ ] 인사말 · 달력 · 참석 · 공유는 넓은 여백의 본문형 섹션
- [ ] 계좌 · 방명록만 필요 시 내부 카드

### 이미지 분리 (서로 섞지 않음)

| 슬롯 | 용도 | Pass |
|------|------|------|
| Hero | 최상단 대표 이미지 (~520px, cover) | [ ] |
| 신랑 사진 | Couple 섹션 프로필 | [ ] |
| 신부 사진 | Couple 섹션 프로필 | [ ] |
| Gallery | 앨범 섹션 목록 | [ ] |

### PC 공개 초대장

- [ ] 가운데 **375px** 초대장 column
- [ ] 오른쪽 공유(또는 RSVP 보조) 카드
- [ ] 초대장 내부는 모바일과 동일한 full-width 구조
- [ ] 전체 폭으로 늘리지 않음

---

## 6. PC 에디터 검수 기준 (3단 구조)

| 영역 | 요구 | Pass |
|------|------|------|
| 왼쪽 | Stepper Sidebar · 한글 스텝명 · 숫자 배지 · active | [ ] |
| 가운데 | Form Editor · 입력 카드 · 저장 액션 | [ ] |
| 오른쪽 | **375px** Mobile Preview · sticky · 실시간 | [ ] |

### 모바일 에디터

- [ ] 단일 컬럼
- [ ] 가로 스크롤 stepper
- [ ] Preview 플로팅 버튼

### 금지

- [ ] Basic Info / Hero / Couple 영어 탭 **없음**
- [ ] FULL / invitation_full / templateType 입력 표시 **없음**
- [ ] editor 내부 concept selector **없음**

---

## 7. 화면 캡처 방식

### Playwright (권장)

프론트·백엔드 로컬 실행 후:

```bash
# 터미널 1
cd frontend && npm run dev

# 터미널 2
cd backend && npm run dev

# 캡처
npx playwright test e2e/design-qa-screenshots.spec.ts --project=chromium
```

환경 변수 (선택):

| 변수 | 설명 |
|------|------|
| `DESIGN_QA_EDITOR_ID` | 에디터/완료/RSVP 캡처용 초대장 id |
| `DESIGN_QA_SHARE_SLUG` | 공개 초대장 캡처용 shareSlug |
| `E2E_API_BASE_URL` | 기본 `http://localhost:3001` |

캡처 출력: `artifacts/design-qa/*.png`

### 수동 캡처

Chrome DevTools → device toolbar / 창 크기 고정 후 동일 파일명으로 저장.

---

## 8. QA용 샘플 데이터 (고정)

비교 시 아래 샘플을 사용한다. 구현 상수: `frontend/src/design-qa/sampleData.ts`

### Wedding

| 필드 | 값 |
|------|-----|
| 신랑 | 이준혁 |
| 신부 | 김지은 |
| 날짜 | 2025년 11월 15일 토요일 오후 2시 30분 |
| 장소 | 더 웨딩홀 그랜드볼룸 · 서울 강남구 |
| Hero | 있음 |
| 신랑/신부 사진 | 있음 |
| Gallery | 있음 |
| 계좌 | 있음 |
| RSVP | 있음 |
| 방명록 | 있음 |

### Funeral

| 필드 | 값 |
|------|-----|
| 고인명 | (샘플) 홍길동 |
| 별세일 | 있음 |
| 빈소 | 있음 |
| 발인 | 있음 |
| 장지 | 있음 |
| 조문 메시지 | 있음 |
| 계좌 / 방명록 | 있음 (에디터 스텝) |

### General

| 필드 | 값 |
|------|-----|
| 행사명 | 있음 |
| 일정 / 장소 | 있음 |
| 행사 소개 | 있음 |
| Gallery / RSVP | 있음 |

---

## 9. 화면별 Pass / Fail 기록

**검수일:** 2026-07-25 (기준점 커밋 직전 재검증 · PNG 18장)  
**기준:** Figma Make + 본 체크리스트 · 실제 PNG + 이미지 HTTP/DOM 검증  
**QA 데이터:** `DESIGN_QA_EDITOR_ID=b7362e15-6049-49b3-bb25-5f935bb6e7dd` · `DESIGN_QA_SHARE_SLUG=nx52bsbb`

### Mobile 375×812

| 화면 | 결과 | Figma와 다른 점 | 수정 필요 파일 | 우선순위 | 캡처 |
|------|------|-----------------|----------------|----------|------|
| Main | PASS | — | — | — | `artifacts/design-qa/mobile-main.png` |
| Email Start | PASS | — | — | — | `artifacts/design-qa/mobile-email-start.png` |
| Email Verify | PASS | — | — | — | `artifacts/design-qa/mobile-email-verify.png` |
| Concept Selection | PASS | — | — | — | `artifacts/design-qa/mobile-concept-selection.png` |
| Editor | PASS | 공개 배너 mobile compact 적용. QA 에셋은 그라데이션 JPEG | — | Low | `artifacts/design-qa/mobile-editor.png` |
| Public Invitation | PASS | SaaS 헤더 없음 · Hero 로드(naturalWidth>0) · 인사말 본문형 · width 100% | — | — | `artifacts/design-qa/mobile-public-invitation.png` |
| Publish Complete | PASS | — | — | — | `artifacts/design-qa/mobile-publish-complete.png` |
| My Invitations | PASS | — | — | — | `artifacts/design-qa/mobile-my-invitations.png` |
| RSVP Management | PASS | — | — | — | `artifacts/design-qa/mobile-rsvp-management.png` |

### Desktop 1440×1024

| 화면 | 결과 | Figma와 다른 점 | 수정 필요 파일 | 우선순위 | 캡처 |
|------|------|-----------------|----------------|----------|------|
| Main | PASS | — | — | — | `artifacts/design-qa/desktop-main.png` |
| Email Start | PASS | — | — | — | `artifacts/design-qa/desktop-email-start.png` |
| Email Verify | PASS | — | — | — | `artifacts/design-qa/desktop-email-verify.png` |
| Concept Selection | PASS | — | — | — | `artifacts/design-qa/desktop-concept-selection.png` |
| Editor | PASS | 3단 유지 | — | — | `artifacts/design-qa/desktop-editor.png` |
| Public Invitation | PASS | 375 column + 우측 공유 · 헤더 없음 · Hero/커플/갤러리 경로 200 | — | — | `artifacts/design-qa/desktop-public-invitation.png` |
| Publish Complete | PASS | — | — | — | `artifacts/design-qa/desktop-publish-complete.png` |
| My Invitations | PASS | — | — | — | `artifacts/design-qa/desktop-my-invitations.png` |
| RSVP Management | PASS | — | — | — | `artifacts/design-qa/desktop-rsvp-management.png` |

### 공개 초대장 집중 검수

| 항목 | 결과 | 메모 |
|------|------|------|
| 전체 외곽 카드 없음 | PASS | PublicInvitationLayout + shell 투명 |
| 모바일 width 100% | PASS | |
| Hero / Gallery / 지도 full-width | PASS | Hero JPEG 로드 확인. Gallery DOM naturalWidth>0 |
| 인사말 본문형 | PASS | transparent · shadow/border 제거 |
| 계좌/방명록 내부 카드 | PASS | |
| Hero vs 신랑/신부 분리 | PASS | 슬롯·경로 분리, 이미지 200 |
| 글로벌 공유 옵션 | PASS | |
| PC 375 + 우측 공유 | PASS | |
| GlobalHeader 미노출 | PASS | ClientLayout + GlobalHeaderGate |

### 에디터 집중 검수

| 항목 | 결과 | 메모 |
|------|------|------|
| Desktop 3단 | PASS | |
| Mobile 가로 stepper + Preview | PASS | `/editor` → viewport 기준 `/m`·`/pc` 1회 redirect |
| 이미지 4종 입력 분리 | PASS | |
| 모바일 공개 배너 compact | PASS | URL 복사 1액션 우선 |

### 집계

| 항목 | 값 |
|------|----|
| 필수 PNG | **18/18** |
| Mobile PASS / FAIL | **9 / 0** |
| Desktop PASS / FAIL | **9 / 0** |
| High 차이 | **0건** |
| Medium/Low | Low: QA용 그라데이션 JPEG(실사 사진 아님) |
| 디자인 완료 판정 | **가능 (Pass)** |

---

## 10. 최종 판정 기준

아래를 **모두** 만족하면 디자인 반영 완료로 판단한다.

1. [x] 화면 흐름이 동일하다  
   `[초대장 만들기] → [이메일] → [인증번호] → [컨셉] → [에디터] → [저장/공개/공유]`
2. [x] 모바일/PC 레이아웃이 Figma와 같은 방향이다
3. [x] 에디터는 PC 3단 · 모바일 단일 구조다
4. [x] 공개 초대장은 full-width 감성형이다
5. [x] 컨셉 선택 화면이 Figma와 거의 동일하다
6. [x] 이메일 인증은 비밀번호 없이 OTP만 사용한다
7. [x] 공유 화면은 글로벌 공유 옵션을 제공한다
8. [x] 색상 · 간격 · 버튼 · 카드 톤이 Figma 기준과 크게 다르지 않다

**최종:** ☑ Pass / ☐ Fail — 일자: 2026-07-25 검수자: Design QA (Playwright PNG)

---

## 11. 금지 사항

- 디자인 확인 없이 기능만 맞다고 완료 처리하지 말 것
- 공개 초대장을 카드형 SaaS UI로 되돌리지 말 것
- 모바일만 보고 PC 완료 처리하지 말 것
- PC만 보고 모바일 완료 처리하지 말 것
- Figma Make 코드를 통째로 복붙해서 기존 구조를 깨지 말 것

---

## 12. 실사 이미지 수동 QA (개발환경)

QA 그라데이션 JPEG와 별도로, **라이선스 확보된 실사**로 development에서 확인한다.  
(저장소/운영에 라이선스 불명확 이미지 포함 금지)

| # | 항목 | 결과 | 메모 |
|---|------|------|------|
| R1 | Hero 가로 업로드·공개 | ☐ | object-fit cover · object-position center |
| R2 | Hero 세로(portrait) 업로드·공개 | ☐ | portrait 시 object-position center 20% |
| R3 | 신랑/신부 정사각 crop | ☐ | |
| R4 | Gallery 가로·세로 혼합 10장+ | ☐ | |
| R5 | 새로고침 후 유지 · CDN/R2 URL | ☐ | |
| R6 | ImageWithFallback 실패 처리 | ☐ | |
| R7 | 모바일 스크롤 성능 | ☐ | |
| R8 | 공개 링크 무인증 | ☐ | |
| R9 | Android Chrome 공개·공유 | ☐ | |
| R10 | iPhone Safari 공개·공유 | ☐ | |

---

## 관련 파일

| 역할 | 경로 |
|------|------|
| 이 체크리스트 | `docs/DESIGN_QA_CHECKLIST.md` |
| 디자인 토큰 | `frontend/src/styles/designTokens.css` |
| QA 샘플 데이터 | `frontend/src/design-qa/sampleData.ts` |
| Wedding 데모 상수 | `frontend/src/templates/weddingClassic/data.ts` (이준혁/김지은 샘플) |
| 캡처 스크립트 | `e2e/design-qa-screenshots.spec.ts` |
| 캡처 산출물 | `artifacts/design-qa/` |
| npm script | `npm run design:qa:screenshots` |
