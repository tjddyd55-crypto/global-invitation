# Invitation FREEZE Status

**이 시점 이후 변경은 의도적 결정**이라는 증거 문서.

---

## 현재 버전

| 항목 | 값 |
|------|-----|
| **템플릿** | Wedding Classic (FULL) |
| **버전** | v1.0 (Runtime Safe) |
| **Freeze 선언일** | 문서 최초 작성일 기준 |

---

## Freeze 범위 (고정·변경 금지)

- **Runtime Contract**  
  `docs/INVITATION_RUNTIME_CONTRACT.md`에 정의된 데이터 구조·Graceful Fallback 규칙·§1b FULL 사용 필드.
- **RSVP UX 규칙**  
  상태(FORM/SUBMITTED/READ_ONLY), localStorage 키 `invitation_rsvp_${slug}`, 키 존재 → READ_ONLY, 제출 직후 → SUBMITTED, 폼 비활성·ReadOnly·Thank You 동작.
- **Future Extension (inactive)**  
  AccommodationInfo, TransportationDetail, ContactHelpDesk, HostMessage, ThankYouAfterRSVP — 위치만 예약, **활성화 금지** (Contract §6·Governance 선행 없이).

---

## 허용 변경 (Freeze 범위 밖)

- **텍스트(i18n)**  
  `weddingClassic.*` 네임스페이스 내 문구·번역 추가·수정.
- **스타일 미세 조정**  
  색상·간격·폰트 등 시각만 조정. 섹션 순서·블록 추가/삭제 금지.

---

## 금지 변경 (구조·동작)

- **데이터 구조**  
  Contract에 없는 새 필드 사용, 기존 필드 의미/형식 변경.
- **RSVP 상태 모델**  
  상태 값 추가·변경, localStorage 키/형식 변경, 서버 연동(문서 없이).
- **Extension 활성화**  
  5개 Future Extension 블록을 display/visibility로 켜기. 활성화 시 반드시 Contract §6·CHANGE_GOVERNANCE 문서 선행.

---

## 참조

- [INVITATION_RUNTIME_CONTRACT.md](INVITATION_RUNTIME_CONTRACT.md)
- [CHANGE_GOVERNANCE.md](CHANGE_GOVERNANCE.md)
- [INVITATION_OPERATION_CHECKLIST.md](INVITATION_OPERATION_CHECKLIST.md)
- [CURSOR_TASK_FINAL.md](../CURSOR_TASK_FINAL.md) (Cursor용 봉인 지시)
