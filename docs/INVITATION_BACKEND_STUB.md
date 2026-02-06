# Invitation Backend Stub Contract

초대장 관련 **백엔드 API 계약(Stub)** 정의.  
현재 MVP 단계에서는 **실제 구현 없이 계약만 명시**하며, 호출은 금지한다.

---

## 1. 계약만 정의된 엔드포인트

### GET /api/invitations/:slug

- **역할**: slug에 해당하는 초대장 단건 조회.
- **상태**: **미구현**. 응답 스펙만 계약으로 둠.
- **예정 응답 형식** (참고용):
  - `200`: 초대장 공개 필드 (title, eventDate, locationText, message, templateKey, status 등)
  - `404`: 해당 slug 없음
- **현재**: 실제 초대장 조회는 기존 구현된 라우트를 사용. 이 계약은 **추후 통합·확장 시** 기준으로만 사용.

---

### POST /api/rsvp/:slug

- **역할**: 해당 초대장에 대한 RSVP(참석 여부) 제출.
- **상태**: **미구현**. 요청/응답 스펙만 계약으로 둠.
- **예정 요청 예시** (참고용):  
  `{ name?: string, attending: boolean, message?: string }`
- **예정 응답**: `201` + 저장된 RSVP 정보 또는 `400`/`404` 등.
- **현재**: RSVP는 **프론트 전용(localStorage)**. 이 API는 **호출 금지**.

---

## 2. 현재 단계에서의 호출 금지

- **POST /api/rsvp/:slug**  
  - 구현되지 않았으며, **클라이언트에서 호출하지 않는다.**  
  - RSVP 상태는 `INVITATION_RUNTIME_CONTRACT.md` §3에 따라 **localStorage만 사용**.

- **GET /api/invitations/:slug**  
  - 기존 구현이 있다면 기존 라우트 사용.  
  - 이 문서의 "Stub"은 **추후 API 통일·확장 시** 계약 기준으로만 사용.

---

## 3. 프론트/백엔드 경계

- **초대장 표시 데이터**: 프론트는 `INVITATION_RUNTIME_CONTRACT.md`의 **InvitationRuntimeData**를 기준으로 렌더링.
- **RSVP 저장**: 현재는 **서버 저장 없음**. 프론트 localStorage만 사용(문서: `INVITATION_RUNTIME_CONTRACT.md` §3).
- **계약 변경 시**: 이 문서(Stub)와 런타임 계약 문서를 먼저 수정한 뒤, 백엔드/프론트 구현 및 QA 진행.

---

## 4. Absolute Boundary (공통)

- **SIMPLE MVP** (`/message/*`) 수정 금지.
- **문서 없는 API·Contract 변경은 버그로 간주**.
- Runtime Contract 변경 시: **문서 → 코드 → QA** 순서 필수.
