# Global Invitation – UX, Trust & Operation Guide (SSOT)

**Status: ACTIVE**

**단일 기준 문서(Single Source of Truth).**

**참조 문서**: [INVITATION_RUNTIME_CONTRACT.md](INVITATION_RUNTIME_CONTRACT.md) · [INVITATION_QA_SNAPSHOT.md](INVITATION_QA_SNAPSHOT.md) · [INVITATION_BACKEND_STUB.md](INVITATION_BACKEND_STUB.md) · [CHANGE_GOVERNANCE.md](CHANGE_GOVERNANCE.md)  
FULL Wedding Classic 초대장(v1.x) 기준 사용자 흐름, i18n 규칙, 템플릿 확장 설계, 운영 규칙을 정의한다.  
기능 확장·결제·백엔드 연동은 하지 않으며, 기존 블록 구조를 유지한다.

---

## 1. 진입 경로 (Entry)

- **Home → Invitation**: 홈에서 초대장 데모/링크로 진입
- **Invitation 단독 진입**: 공유된 초대장 URL로 직접 접속

두 경로 모두 동일한 초대장 뷰를 보며, 스크롤이 자연스럽게 RSVP 섹션까지 이어져야 한다.

---

## 2. FULL 섹션 순서 (모바일 기준)

1. **Invitation Hero** – 대표 이미지·타이틀 (날짜 중복 없음)
2. **핵심 일정 요약 (Date / Time)** – 날짜·시간·장소명 **단일 정본**
3. **Location 요약** – 장소명·주소·지도·교통·주차
4. **Program / Schedule** – 캘린더 등
5. **Gallery** (optional)
6. **Special Notes** – 인사말·부가 안내
7. **RSVP**
8. 연락처(Details)·계좌·방명록·공유

스크롤이 길어지는 구간에는 시각적 브레이크(여백, Divider)를 둔다.  
일정·장소·RSVP CTA는 시각적으로 강조, 부가 정보는 톤 다운.

---

## 3. Single Source 규칙 (정보 신뢰성)

- **날짜·시간·주소**는 **한 곳만 정본(Single Source)** 으로 노출
- 동일 정보의 중복 표현 제거
- **연락처(Contact / Help)** 는 Details 또는 하단에 고정하여 일관 노출

---

## 4. RSVP 상태 규칙 (운영)

- **저장 키**: `invitation_rsvp_${slug}` (로컬 스토리지)
- **상태**: 미응답 | 참석 | 불참
- **재접속 시**: 폼은 **Read-only**, "이미 응답하셨습니다" 문구 + 잠금 아이콘
- API 연동 전까지 **UI 전용 로컬 상태** 유지

---

## 5. Read-only 정책

- **Read-only 영역**: RSVP 폼, 제출 버튼 (제출 후)
- 수정 불가 영역은 **회색 톤**으로 시각 구분
- **문구로 상태를 명확히** 표시 (예: "수정할 수 없습니다")

---

## 6. 공유 안정성 규칙 (문서 전용, 구현 ❌)

| 항목 | 규칙 |
|------|------|
| **Title** | 행사명 + 날짜 |
| **Description** | 초대 문구 1줄 |
| **Thumbnail** | Hero 영역 사용 |

- **Hero 영역은 타이틀 및 오버레이 텍스트만 포함한다.** 공유 미리보기 검증 시 화면과 메타 규칙 간 불일치가 발생하지 않도록 한다.
- **구현 없는 항목은 문서 규칙만 존재**한다. 메타 태그·OG·Thumbnail 구현은 하지 않고, 위 규칙만 Guide에 유지한다.

---

## 7. i18n 규칙 (Wedding Classic 전용)

### 7-1. 네임스페이스 고정

- 모든 문구는 **`weddingClassic.*`** 스코프 하위에서만 관리
- 예: `weddingClassic.heroTitleTemplate`, `weddingClassic.scheduleSummaryTitle`, `weddingClassic.rsvp.title`, `weddingClassic.rsvp.button`, `weddingClassic.rsvp.thankYouAttend`, `weddingClassic.rsvp.thankYouDecline`
- **문자열 하드코딩 금지**
- **다른 템플릿과 키 공유 금지** (Wedding Classic 전용 키만 사용)

### 7-2. 번역 누락 방지

- FULL 템플릿에서 사용하는 모든 i18n 키를 **단일 목록**으로 정리 (아래 표)
- 신규 키 추가 시: **ko, en 최소 2개 언어** 필수
- 누락 시 빌드 에러 대신 **Guide 체크 항목**으로 관리

### 7-3. Wedding Classic i18n 키 단일 목록

FULL 템플릿에서 사용하는 키 (ko / en 필수, mn 선택).

| 키 | 용도 |
|----|------|
| `weddingClassic.contactButton` | 혼주 연락 버튼 |
| `weddingClassic.heroTitleTemplate` | Hero 타이틀 ({groom} ♥ {bride} …) |
| `weddingClassic.heroOverlayText` | Hero 오버레이 문구 |
| `weddingClassic.groomLabel` | 신랑 라벨 |
| `weddingClassic.brideLabel` | 신부 라벨 |
| `weddingClassic.galleryTitle` | 갤러리 섹션 제목 |
| `weddingClassic.transportTitle` | 교통 안내 제목 |
| `weddingClassic.parkingTitle` | 주차 안내 제목 |
| `weddingClassic.navTmap` | 티맵 버튼 |
| `weddingClassic.navKakao` | 카카오내비 버튼 |
| `weddingClassic.navNaver` | 네이버지도 버튼 |
| `weddingClassic.copyButton` | 계좌 복사 버튼 |
| `weddingClassic.rsvpTitle` | RSVP 섹션 제목 |
| `weddingClassic.rsvpDescription` | RSVP 설명 |
| `weddingClassic.rsvpButton` | RSVP 제출 버튼 |
| `weddingClassic.rsvpThankYouAttend` | Thank You (참석) |
| `weddingClassic.rsvpThankYouDecline` | Thank You (불참) |
| `weddingClassic.rsvpAlreadyResponded` | 이미 응답함 문구 |
| `weddingClassic.rsvpReadOnlyNotice` | 수정 불가 문구 |
| `weddingClassic.rsvpOptionAttend` | 참석 옵션 |
| `weddingClassic.rsvpOptionDecline` | 불참 옵션 |
| `weddingClassic.rsvpNameLabel` | 이름 필드 라벨 |
| `weddingClassic.rsvpAttendanceLabel` | 참석 여부 라벨 |
| `weddingClassic.scheduleSummaryTitle` | 일정 요약 제목 |
| `weddingClassic.specialNotesTitle` | Special Notes 제목 |
| `weddingClassic.accountsTitle` | 계좌 섹션 제목 |
| `weddingClassic.messagesTitle` | 방명록 제목 |
| `weddingClassic.calendarTitle` | 캘린더 제목 ({date}) |
| `weddingClassic.heroImageAlt` | Hero 이미지 alt |
| `weddingClassic.galleryImageAlt` | 갤러리 이미지 alt |
| `weddingClassic.mapAlt` | 지도 이미지 alt |
| `weddingClassic.share` | 공유 버튼 |
| `weddingClassic.shared` | 공유 완료 문구 |
| `weddingClassic.playMusic` | 음악 재생 (aria-label) |
| `weddingClassic.weekdaySun` … `weekdaySat` | 요일 (캘린더) |

**체크**: 신규 키 추가 시 위 목록에 추가하고, ko·en 번역을 반드시 넣을 것.

---

## 8. 이벤트 타입 확장 설계 (구현 ❌ / 설계만)

### 8-1. EventType (개념만)

| 값 | 설명 |
|----|------|
| **WEDDING** | 현재 지원 |
| BIRTHDAY | (향후) |
| ANNIVERSARY | (향후) |
| CORPORATE | (향후) |

### 8-2. 블록 재사용 규칙

| Block | Wedding | Other Event |
|-------|---------|--------------|
| Hero | 필수 | 필수 |
| Date/Time | 필수 | 필수 |
| Location | 필수 | Optional |
| Program | Optional | Optional |
| Gallery | Optional | Optional |
| RSVP | Optional | Optional |
| Account | Wedding only | ❌ |
| Guestbook | Optional | Optional |

- **블록 추가 ❌** – 새 블록 타입 추가 금지
- **조합만 허용** – 기존 블록의 표시/비표시·순서 조합만 허용

---

## 9. 작업 제한 (ABSOLUTE)

- **SIMPLE MVP**(`/message/*` 경로) **수정 금지**
- **Guide를 렌더 로직으로 사용 금지** (문서만 SSOT)
- **새로운 UX 개념 추가 금지**
- **파일/폴더 구조 변경 금지**
- **신규 페이지 추가 금지**
- **결제·백엔드 연동 금지**
- ⭕ **정리, 명시, 고정만 허용**

---

## 10. 완료 기준 (Acceptance Criteria)

- [ ] 다국어 확장 시 설계 변경 없이 **키 추가만** 가능
- [ ] 웨딩 외 이벤트도 **구조 재사용** 가능 (블록 조합)
- [ ] RSVP / 공유 / 읽기 전용 동작이 **명확**
- [ ] Guide가 **단일 기준(SSOT)** 역할 수행
