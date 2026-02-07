# Cursor Task – 최종 지시 (봉인 버전)

**이 프로젝트는 더 이상 구조 변경 금지.**

이 문서는 Cursor(AI)가 초대장 FULL 템플릿을 수정할 때 **반드시 따를 최종 지시**이다.  
엉뚱한 구조 변경·Extension 활성화·API 연동을 하지 않도록 하기 위한 안전장치.

---

## 1. 금지 작업 (절대 하지 말 것)

- **데이터 구조 변경**  
  `docs/INVITATION_RUNTIME_CONTRACT.md`에 없는 새 필드 추가, 기존 필드 의미/형식 변경.
- **RSVP 상태 모델 변경**  
  상태 값 추가·변경, localStorage 키/형식 변경. 서버 API 연동(문서에 없는 호출).
- **Future Extension 활성화**  
  5개 블록(AccommodationInfo, TransportationDetail, ContactHelpDesk, HostMessage, ThankYouAfterRSVP)을 **CSS/JS로 보이게 하거나 동작하게 만들기**.  
  → 활성화 요청이 오면 **반드시 문서 먼저**: Contract §6·CHANGE_GOVERNANCE·INVITATION_FREEZE_STATUS 수정 후 코드.
- **SIMPLE MVP 수정**  
  `/message/*` 라우트·관련 컴포넌트 수정 금지.
- **새 API/백엔드 호출**  
  `docs/INVITATION_BACKEND_STUB.md`에 없는 엔드포인트 호출 금지.
- **결제·이메일·라우팅 구조**  
  정책 문서 없이 연동·추가 금지.

---

## 2. 허용 작업

- **i18n**  
  `weddingClassic.*` 등 기존 네임스페이스 내 텍스트·번역 추가·수정.
- **스타일 미세 조정**  
  색상·간격·폰트 등. 섹션 순서·블록 추가/삭제는 금지.
- **문서**  
  오타 수정, 체크리스트·절차 보완. **구조/동작 변경 시 해당 문서(Contract, Governance, Freeze) 먼저 수정.**

---

## 3. Future Extension 활성화 요청 시

1. **문서 먼저**  
   `INVITATION_RUNTIME_CONTRACT.md` §6, `CHANGE_GOVERNANCE.md`, `INVITATION_FREEZE_STATUS.md`에 활성화할 블록·데이터 구조·규칙 명시.
2. **그 다음** 코드 변경.
3. **QA**  
   `INVITATION_QA_SNAPSHOT.md`·운영 체크리스트로 회귀 확인.

**문서 없는 Extension 활성화 = 버그.**

---

## 4. 참조 문서 (수정 전 반드시 확인)

- `docs/INVITATION_FREEZE_STATUS.md` — Freeze 범위·허용/금지
- `docs/INVITATION_RUNTIME_CONTRACT.md` — 데이터·RSVP·Extension
- `docs/CHANGE_GOVERNANCE.md` — 변경 절차·PR 규칙
- `docs/INVITATION_OPERATION_CHECKLIST.md` — 비개발자용 검증
- `docs/INVITATION_QA_SNAPSHOT.md` — QA 기준선

---

**요약**: 구조·RSVP·Extension·API는 봉인. 텍스트·스타일·문서 보완만 허용. Extension 활성화는 **항상 문서 선행**.
