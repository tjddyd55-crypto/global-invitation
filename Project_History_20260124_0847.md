# Project_History_20260124_0847.md

## Project Context
- 프로젝트: Global Invitation (모바일 초대장/메시지카드 플랫폼 확장)
- 목적: Invitation / MessageCard / SimpleEvent(Simple Message) / Branded MessageCard를 완전 분리 구조로 확장
- 현재 단계: wedding/funeral invitation, message card(simple/branded) 데모 및 에디터 구조 구축 완료

## Tech Stack & Environment
- Frontend: Next.js App Router, React, TypeScript
- Styling: CSS Modules
- 상태 관리: useReducer 기반 로컬 state
- 이미지 업로드: 브라우저 ObjectURL (임시)
- 지도: Google Maps iframe (branded demo)
- API: `frontend/src/lib/api.ts` (Invitation 기본 fetch/update만 사용)

## Accomplishments
- **Wedding Editor + Template**
  - `/editor/[slug]`에 wedding 에디터 적용
  - wedding classic 템플릿 커플 카드 2컬럼 유지, RSVP/Guestbook 노출 토글 지원
  - 결혼식 입력 폼 기준 문서 생성: `docs/editor/wedding-editor-form.md`
- **Funeral Invitation (독립 템플릿/에디터)**
  - `/invitation/demo-funeral-classic`, `/editor/demo-funeral-classic` 데모 라우팅
  - 템플릿: `frontend/src/templates/funeralClassic/*`
  - 에디터: `frontend/src/editors/funeral/*`
- **MessageCard (Thank You)**
  - `/message/demo-thank-you`, `/message/editor/demo-thank-you`
  - 템플릿: `frontend/src/templates/messageThankYou/*`
  - 에디터: `frontend/src/editors/messageCard/*`
  - 링크 복사 / 캘린더(ICS) / 카카오 공유(stub) 버튼 구현
- **Generic Message Card (Simple)**
  - `/message/demo-simple`, `/message/editor/demo-simple`
  - 템플릿: `frontend/src/templates/messageSimple/*`
  - 에디터: `frontend/src/editors/messageSimple/*`
  - 스케줄(선택), 일정 저장(ICS) 동작
- **Branded Message Card (JCI Demo)**
  - `/message/branded/demo-jci`, `/message/branded/editor/demo-jci`
  - 브랜드 폴더 단위 구조: `frontend/src/templates/messageBranded/jci/*`
  - JCI 로고 적용: `frontend/public/brands/jci/jci-logo.png`
  - 고정 헤더/푸터, 본문 스크롤, 지도 iframe 포함

## Key Logic/Structure
- **라우팅 분리**
  - Invitation: `/invitation/[slug]`, `/editor/[slug]`
  - MessageCard: `/message/[slug]`, `/message/editor/[slug]`
  - Branded MessageCard: `/message/branded/[slug]`, `/message/branded/editor/[slug]`
- **데이터 모델**
  - Invitation: `frontend/src/models/invitation.ts`
  - MessageCard: `frontend/src/models/messageCard.ts`
  - Message Simple: `frontend/src/models/messageSimple.ts`
  - Message Branded: `frontend/src/models/messageBranded.ts`
- **Demo Slugs**
  - Wedding: `demo-wedding-classic`
  - Funeral: `demo-funeral-classic`
  - Message Thank You: `demo-thank-you`
  - Message Simple: `demo-simple`
  - Branded JCI: `demo-jci`
- **Branded JCI 컬러**
  - Primary Blue: `#0097D7`
  - Secondary Navy: `#1F4789`
  - Text: `#FFFFFF` / `#2F2F2F`
  - 모든 색상은 CSS module에만 정의 (인라인 금지)
- **주요 로직**
  - Message/Simple 카드의 일정 저장은 ICS 다운로드로 처리
  - 카카오 공유는 stub (alert) 처리
  - 에디터는 입력 즉시 미리보기 반영, 저장은 demo용 로컬 상태 유지

## Pending Tasks
- Branded JCI 로고 최종 확인(크기/위치/여백) 및 필요 시 교체
- Funeral/Wedding/MessageCard 실제 API 연동 및 저장 스키마 확장
- OG 메타(카카오/문자 미리보기) 실제 적용 로직 연동
- Branded 템플릿 확장 규칙 문서화 (message_branded_* 추가 전략)
- UI 마이너 조정 (모바일 spacing, 텍스트 크기, 지도 영역 높이)
- 테스트/검증: 각 demo 라우트별 모바일/PC 스크롤/고정 영역 정상 동작 확인
