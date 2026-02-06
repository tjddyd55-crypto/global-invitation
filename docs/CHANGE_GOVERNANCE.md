# Change Governance

앞으로 실수로 깨지는 것을 방지하기 위한 **변경 가능/불가/절차** 단일 기준.

---

## 1. 변경 가능

- **FULL 템플릿** 내에서:
  - 텍스트·문구 미세 조정
  - 섹션 순서 유지 범위 내 스타일 미세 조정
  - i18n 키·번역 추가 (weddingClassic.* 등 기존 네임스페이스 준수)
- **문서**: 오타 수정, 절차 보완, 체크리스트 추가
- **백엔드**: Stub 계약에 맞는 응답 형식 추가 (문서 선반영 후)

---

## 2. 변경 불가

- **SIMPLE MVP** (`/message/*`): 어떤 이유로도 수정 금지.
- **Runtime Contract**: `INVITATION_RUNTIME_CONTRACT.md`에 정의된 데이터 구조·fallback 규칙을 **문서 없이** 바꾸기 금지.
- **API 호출**: 문서(`INVITATION_BACKEND_STUB.md`)에 없는 새 API 호출·연동 금지. (RSVP는 현재 localStorage 전용.)
- **라우팅 구조**: 새 페이지·새 라우트 추가 금지. (기존 경로 내 수정만 허용.)
- **결제/PG/이메일**: 정책 문서 없이 연동 금지.

---

## 3. 변경 절차 (필수)

1. **문서** → 2. **코드** → 3. **QA** → 4. **커밋**

- Contract·Stub·Guide 등 **관련 문서를 먼저** 수정한다.
- 그 다음 코드를 수정한다.
- QA(스냅샷·체크리스트)로 회귀를 확인한 뒤 커밋한다.
- **문서 없는 변경 = 버그**로 간주한다.

---

## 4. PR / 커밋 규칙

- **문서 없는 변경 금지**: Contract·Governance·QA 문서에 반영되지 않은 구조/동작 변경은 머지하지 않는다.
- **FULL만 수정 시**: `INVITATION_RUNTIME_CONTRACT.md`, `05_UX_TRUST_GUIDE.md`, 필요 시 `INVITATION_QA_SNAPSHOT.md`를 함께 본다.
- **백엔드 API 추가/변경 시**: `INVITATION_BACKEND_STUB.md`에 계약을 먼저 반영한다.

---

## 5. 신규 인원 온보딩

- 이 문서와 아래 문서만 읽으면 **방향 이탈 방지** 가능:
  - `docs/INVITATION_RUNTIME_CONTRACT.md`
  - `docs/INVITATION_BACKEND_STUB.md`
  - `docs/05_UX_TRUST_GUIDE.md`
  - `docs/INVITATION_QA_SNAPSHOT.md`
  - `docs/CHANGE_GOVERNANCE.md` (본 문서)
