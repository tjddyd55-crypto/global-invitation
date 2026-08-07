# 컨셉별 필드 정의 문서

기준: `templateType = 'FULL'` 고정, 분기는 `conceptType`으로만 처리.

## 1) 공통 필드 (모든 컨셉)

- `title`
- `heroImage`
- `content`
- `eventDate`
- `locationText`
- `mapLat` / `mapLng`
- `galleryImages`
- `schedule` (string[])
- `accounts`
- `rsvpEnabled`
- `share` (`ogTitle`, `ogDescription`, `ogImage`)
- `musicKey`

## 2) 컨셉별 확장 필드

### WEDDING
- `groomName`
- `brideName`
- `groomPhone`
- `bridePhone`
- `parentsInfo`

### FUNERAL
- `deceasedName`
- `funeralHall`
- `funeralDate`
- `contactPerson`

### GENERAL
- 확장 필드 없음 (공통 필드만 사용)

### ORGANIZATION
- `organization.name`
- `organization.englishName`
- `organization.logo`
- `organization.accentColor` (hex `#RRGGBB`, 기본 `#0B1F3A`)
- visual template: `ORGANIZATION_01_OFFICIAL` (공식 초청)
- GENERAL 하위가 아님 — 최상위 conceptType

## 3) 저장 규칙

- `dataJson`에는 **공통 필드 + 해당 컨셉 확장 필드만** 저장.
- 예:
  - `GENERAL` 저장 시 `groomName`, `deceasedName` 저장 금지
  - `WEDDING` 저장 시 `deceasedName` 계열 저장 금지
  - `FUNERAL` 저장 시 `groomName` 계열 저장 금지

---

## 4) 컨셉별 섹션 순서 (렌더 고정)

### WEDDING
1. 히어로
2. 초대 메시지
3. 신랑 · 신부 정보
4. 일정 (캘린더)
5. 갤러리
6. 위치 안내
7. 계좌 정보
8. RSVP
9. 공유 / 음악

### FUNERAL
1. 히어로
2. 부고 메시지
3. 고인 정보
4. 빈소 / 발인 정보
5. 일정
6. 위치 안내
7. 계좌 정보
8. RSVP
9. 공유

### GENERAL
1. 히어로
2. 행사 소개
3. 일정
4. 갤러리
5. 위치 안내
6. RSVP
7. 공유 / 음악

---

## 5) 문구 라벨 규칙

### 공통
- 위치 안내
- 일정
- 참석 여부
- 공유하기

### WEDDING
- 신랑 · 신부
- 마음 전하실 곳
- 소중한 날에 함께해 주세요

### FUNERAL
- 부고
- 고인
- 빈소 안내
- 발인 일정
- 조문 안내
- 마음 전하실 곳

### GENERAL
- 행사 안내
- 행사 일정
- 참석 여부
- 위치 안내

---

# 렌더 조건 명세

## 공통 섹션 (모든 컨셉)

- 히어로
- 초대 메시지
- 일정
- 지도
- 갤러리
- 계좌
- 공유
- 음악
- RSVP(페이지 하단 `RSVPForm`, API 기반)

## 컨셉 전용 섹션

- `conceptType === 'WEDDING'`
  - 신랑/신부 정보 섹션 표시
- `conceptType === 'FUNERAL'`
  - 고인 정보 섹션 표시
  - 빈소/발인 정보 섹션 표시
- `conceptType === 'GENERAL'`
  - 전용 섹션 없음 (공통 섹션만 표시)

## 금지 규칙

- 컨셉에 없는 전용 필드/섹션 렌더 금지
- 분기 기준으로 `templateType` 사용 금지 (`conceptType`만 사용)

---

# 에디터 입력 항목 구조

기본 원칙:
- 단일 진입 경로 `/editor/:slug`
- 컨셉에 따라 입력 항목만 다르게 노출
- 숨김 필드는 저장 금지

## 공통 입력 (항상 노출)

- 제목
- 대표 이미지
- 메시지
- 날짜/시간
- 장소 텍스트
- 지도 좌표
- 갤러리
- 일정
- 계좌
- RSVP ON/OFF
- 음악 선택

## WEDDING 추가 입력

- 신랑 이름/전화
- 신부 이름/전화
- 부모 정보

## FUNERAL 추가 입력

- 고인 이름
- 빈소 위치
- 발인 날짜
- 상주 연락처

## GENERAL

- 추가 입력 없음

---

## QA 체크리스트 결과 (코드/빌드 기준)

- 타입 검증: `frontend` 기준 `npx tsc --noEmit` 통과
- localStorage RSVP 키워드: 코드 검색 결과 없음
- `/invitation/{slug}`의 published 리다이렉트: `/i/{shareSlug}` 경로 확인
- 조회수 트래킹: `/i` 페이지에서만 `trackInvitationView()` 호출
- `templateType` 분기 사용: 검색 기준 없음 (`conceptType` 분기만 사용)
