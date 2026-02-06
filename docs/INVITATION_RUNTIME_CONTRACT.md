# Invitation Runtime Contract (Frontend SSOT)

초대장 FULL 템플릿의 **Runtime Data Contract** 단일 기준.  
프론트엔드가 읽는 데이터 구조·누락 시 동작·RSVP 규칙을 정의한다.

---

## 1. InvitationRuntimeData 인터페이스

FULL 템플릿(Wedding Classic 등)은 아래 구조의 데이터만 읽는다.

```ts
interface InvitationRuntimeData {
  title: string;
  subtitle?: string;

  eventSummary: {
    date: string;   // 표시용 날짜 문자열 (단일 정본)
    time?: string;
    venue: string;
  };

  location: {
    address: string;
    mapUrl?: string;
  };

  program: Array<{
    label?: string;
    items?: string[];
  }>;

  gallery: string[];  // 이미지 URL 목록

  specialNotes: string[];  // 인사말·부가 안내

  rsvp: {
    enabled: boolean;
    deadline?: string;  // ISO date string, optional
  };
}
```

- **title**: 필수. 행사명/초대 제목.
- **subtitle**: 선택. Hero 부가 문구.
- **eventSummary**: 필수. 날짜·시간·장소명은 **한 곳만 정본(Single Source)**.
- **location**: 필수. 주소·지도 URL(선택).
- **program**: 선택. 일정/프로그램 블록.
- **gallery**: 선택. 갤러리 이미지 URL 배열.
- **specialNotes**: 선택. 안내 문구 배열.
- **rsvp.enabled**: RSVP 섹션 노출 여부. **rsvp.deadline**은 선택.

---

## 2. 데이터 누락 시 Graceful Fallback

| 필드 / 구간 | 규칙 |
|-------------|------|
| **title** | 없으면 빈 문자열 또는 "(제목 없음)" 등 fallback 표시. 크래시 금지. |
| **eventSummary** | 없으면 해당 블록 비표시. date/venue 없으면 블록 생략. |
| **location** | address 없으면 Location 블록 생략. mapUrl 없으면 지도만 생략. |
| **program** | 빈 배열이면 Program 블록 비표시. |
| **gallery** | 빈 배열이면 Gallery 블록 비표시. |
| **specialNotes** | 빈 배열이면 Special Notes 블록 비표시. |
| **rsvp.enabled === false** | RSVP 섹션 전체 비표시. |

- **FULL 템플릿은 위 Contract만 의존**하며, 미정의 필드는 사용하지 않는다.
- 누락/undefined 시 위 규칙에 따라 블록 생략 또는 fallback 문자열로 처리한다.

---

## 3. RSVP State Rule (Front Only)

- **저장 위치**: `localStorage` only.  
  **키**: `invitation_rsvp_${slug}`
- **상태**:
  - **NONE** → 폼 표시(사용자 입력 가능)
  - **SUBMITTED** → 읽기 전용(이미 응답함 문구 + Thank You)
- **서버 저장**: 없음. **임시 UI 전용 로직**이다.
- API 연동 전까지 프론트 상태만 유지하며, 추후 POST /api/rsvp/{slug} 등으로 대체 가능하다.

---

## 4. Absolute Boundary

- **SIMPLE MVP** (`/message/*`)는 **어떤 이유로도 수정 금지**.
- **FULL**은 확장 가능하나 **구조 변경 금지** (블록 추가·라우팅 변경 금지).
- **Runtime Contract 변경 시**  
  **문서 → 코드 → QA** 순서 필수.  
  이 문서(INVITATION_RUNTIME_CONTRACT.md) 수정 없이 데이터 구조·fallback 규칙을 바꾸면 안 된다.
- **문서에 반영되지 않은 변경은 버그로 간주**한다.

---

## 5. 다음 작업자용 체크

- FULL 템플릿 수정 시: 이 문서의 `InvitationRuntimeData`·fallback 규칙을 준수하는지 확인.
- RSVP 동작 변경 시: §3(RSVP State Rule)과 Guide(05_UX_TRUST_GUIDE.md)의 RSVP 규칙을 함께 확인.
- 새 필드/블록이 필요하면: 먼저 이 문서에 Contract를 추가한 뒤 코드 변경.

---

## 6. Future Extension (inactive)

다음 블록은 **렌더링 위치만 예약**되어 있으며, **실제 구현은 하지 않음**.  
Runtime Contract에는 아직 추가하지 않음. v1.2 확장 시 활성화 예정.

| 블록 | 설명 |
|------|------|
| AccommodationInfo | 숙소 안내 |
| TransportationDetail | 교통 상세 |
| ContactHelpDesk | 문의/헬프데스크 |
| HostMessage | 주최자 메시지 |
| ThankYouAfterRSVP | RSVP 후 감사 메시지(블록) |

- 현재는 `DisabledPlaceholder`로만 표시되며, **현재 동작에는 영향 0**.
