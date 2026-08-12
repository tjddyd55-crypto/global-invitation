# Organization Presets

기관 프리셋은 **브랜드 자산 초기값**만 제공한다 (로고·추천 음악).

## 1차 프리셋

| id | label | logo | default music |
|----|-------|------|---------------|
| `CUSTOM` | 직접 설정 | none | none |
| `JCI` | JCI | shared template logo | JCI Creed Song |

## 원칙

1. `organization.presetId` 는 출발점 표시용이다.
2. Public/Renderer 는 **저장된** `organization.logo` / `music` 만 사용한다. render-time에 preset 으로 덮어쓰지 않는다.
3. 신규 draft 기본값은 `CUSTOM` + logo empty + music off.
4. Template Preview fixture 와 draft 는 분리한다.
5. Shared R2 (`invitation/shared/...`) 는 삭제/cleanup 대상이 아니다.
6. 사용자 override(로고·음악) 후에도 `presetId` 는 유지할 수 있다. 강제 재적용 금지.

## 확장

레지스트리 `frontend/src/invitation/organizationPresets.ts` 에 항목을 추가한다.
UI 는 `listOrganizationPresets()` 기반이다 (하드코딩 카드 금지).
