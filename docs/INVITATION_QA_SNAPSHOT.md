# Invitation FULL Template – QA Snapshot 기준

**Status: ACTIVE**

“이 상태가 정상이다”라는 **시각적·동작 기준선**을 고정한다.

**참조 문서**: [INVITATION_RUNTIME_CONTRACT.md](INVITATION_RUNTIME_CONTRACT.md) (§6 Future Extension, §3 RSVP State Rule) · [05_UX_TRUST_GUIDE.md](05_UX_TRUST_GUIDE.md) · [INVITATION_BACKEND_STUB.md](INVITATION_BACKEND_STUB.md) · [CHANGE_GOVERNANCE.md](CHANGE_GOVERNANCE.md)  
디자이너/개발자가 문서만 보고도 판단할 수 있도록 체크리스트와 테스트 케이스를 정리한다.

---

## 1. 테스트용 JSON 5종

| 케이스 | 파일 | 설명 |
|--------|------|------|
| **FULL_ALL_FIELDS** | `docs/qa-snapshots/FULL_ALL_FIELDS.json` | 모든 필드 채움. 데스크톱/모바일 기준선. |
| **NO_GALLERY** | `docs/qa-snapshots/NO_GALLERY.json` | `gallery[]` 빈 배열. Gallery 섹션 미노출. |
| **NO_PROGRAM** | `docs/qa-snapshots/NO_PROGRAM.json` | Program/캘린더용 데이터 없음. Program 섹션 미노출. |
| **RSVP_DISABLED** | `docs/qa-snapshots/RSVP_DISABLED.json` | `rsvp.enabled: false`. RSVP 섹션 완전 비활성. |
| **MINIMAL_FULL** | `docs/qa-snapshots/MINIMAL_FULL.json` | title + eventSummary 위주. 나머지 섹션 숨김 또는 Empty. |

- 위 JSON은 **Runtime Contract** 예시 payload이다.  
- 실제 렌더는 `buildWeddingClassicData()` 등으로 생성한 데이터를 사용하며, 동일한 “형태”로 최소/부분 데이터를 넣었을 때 위 동작이 나와야 한다.

---

## 2. 케이스별 검증 포인트

### FULL_ALL_FIELDS

- [ ] Hero, eventSummary, Location, Program(캘린더), Gallery, Special Notes, RSVP, 연락처, 계좌, 방명록, 공유 버튼이 **순서대로** 노출된다.
- [ ] 데스크톱/모바일 모두 레이아웃 깨짐 없음.
- [ ] 날짜·장소가 **한 곳만** 강조 영역에 노출되고, 중복 문구 없음.

### NO_GALLERY

- [ ] **Gallery 섹션 전체 미노출**(빈 배열/undefined 시 섹션 미표시, E-1). Gallery DOM 없음.
- [ ] 크래시·console.error 없음.

### NO_PROGRAM

- [ ] Program/캘린더 섹션이 **완전히 미노출**된다.
- [ ] eventSummary(날짜·시간·장소)는 그대로 노출된다.

### RSVP_DISABLED

- [ ] RSVP 섹션 전체가 **노출되지 않는다**.
- [ ] localStorage RSVP 상태와 무관하게 폼/Thank You 블록이 보이지 않는다.

### MINIMAL_FULL

- [ ] Hero(title), eventSummary만 의미 있게 노출된다.
- [ ] Location, Program, Gallery, Special Notes, RSVP, 연락처, 계좌 등은 **데이터 없음에 따라 숨김 또는 빈 상태**로 처리된다.
- [ ] **빌드 + 런타임 에러 0**, console.error/warning 없음.

---

## 3. “이 상태가 정상” 체크리스트 (공통)

- [ ] **섹션 순서**: Hero → eventSummary → Location → Program → Gallery → Special Notes → RSVP → 연락처 → 계좌 → 방명록 → 공유. (데이터 없으면 해당 섹션 생략.)
- [ ] **중복 정보**: 날짜·시간·장소는 eventSummary 한 곳만 “정본”으로 노출. 다른 블록에서는 반복하지 않거나 톤 다운.
- [ ] **RSVP**: FORM → 폼, SUBMITTED/READ_ONLY → 폼 비활성 + "이미 응답하셨습니다" + Thank You. localStorage 키 `invitation_rsvp_${slug}` 외 상태 참조·API 호출 없음.
- [ ] **데스크톱/모바일**: 스크롤·브레이크·CTA가 가이드(05_UX_TRUST_GUIDE.md)와 일치.
- [ ] **에러 없음**: 빈/부분 데이터에서도 크래시 없고, console.error/warning 없음.

---

## 4. 스크린샷·결과 문서화

- 각 케이스에 대해 **데스크톱 / 모바일** 렌더링 스크린샷을 찍어 팀 내 공유 권장.
- **권장 스크린샷 3장**: (1) Hero, (2) RSVP ReadOnly(이미 응답함 + 잠금), (3) ThankYou 블록. QA 문서만 보고 검증 가능하도록 유지.
- “이 상태가 정상” 체크리스트를 채운 뒤, 변경 시 같은 케이스로 회귀 확인.

---

## 4b. 추가 테스트 케이스 (E-5)

| 케이스 | 검증 포인트 | 완료 기준 |
|--------|-------------|-----------|
| **필드 누락** | 필수 필드 일부 누락 시 해당 섹션만 숨김, 크래시/console 0 | 빈/부분 데이터에서 에러 없음 |
| **RSVP 재접속** | localStorage에 응답 저장 후 새로고침·재접속 시 폼 비활성, “이미 응답하셨습니다” + Thank You 유지 | 서버/API 호출 없이 상태 유지 |
| **모바일 스크롤/섹션 순서** | 모바일 뷰에서 Hero → eventSummary → … → RSVP → 연락처 순서, 스크롤·브레이크 자연스러움 | 05_UX_TRUST_GUIDE §2와 불일치 없음 |

---

## 5. 참조 문서

- **Runtime Contract**: `docs/INVITATION_RUNTIME_CONTRACT.md`
- **UX/Trust**: `docs/05_UX_TRUST_GUIDE.md`
- **Backend Stub**: `docs/INVITATION_BACKEND_STUB.md`
- **Integration Smoke**: `docs/INVITATION_INTEGRATION_SMOKE.md`

---

## 6. Future Extension (inactive)

FULL 템플릿에는 **위치만 예약된** 블록 5개(AccommodationInfo, TransportationDetail, ContactHelpDesk, HostMessage, ThankYouAfterRSVP)가 있다.  
**의도적 비활성 상태**: 확장 블록은 **존재하지만 display:none인 Extension 블록**으로 DOM에만 있으며, UX/레이아웃에 영향을 주지 않는다. 조건부 렌더 금지·위치만 예약. 상세는 `INVITATION_RUNTIME_CONTRACT.md` §6 참고.
