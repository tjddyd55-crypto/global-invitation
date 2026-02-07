# Invitation Integration Smoke (10-line)
1) Front: `<FRONTEND_URL>/invitation/sample-wedding` → 정상 렌더 (404 아님)
2) API: `<BACKEND_URL>/api/invitations/sample-wedding` → 200 JSON
3) API(기타 slug): `/api/invitations/{slug}` → 404 { error: "NOT_FOUND" }
4) 오류 시: 503 { error: "TEMP_UNAVAILABLE" } (500 금지)
5) Env(Frontend): NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_API_BASE_URL (or NEXT_PUBLIC_BACKEND_URL)
6) Env(Backend): PORT, DATABASE_URL(미사용이어도 설정 권장)
7) siteUrl 경고 제거: prod에 NEXT_PUBLIC_SITE_URL 필수
8) sample-wedding은 **샘플 전용** (DB/PG/메일 호출 없음)
9) 화면 실패 시: Network 탭에서 요청 URL/코드/바디 확인
10) 문서/코드 불일치 시: INVITATION_RUNTIME_CONTRACT.md 재확인
