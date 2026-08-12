# Organization Presets

기관 프리셋은 **브랜드 자산 초기값**만 제공한다 (로고·추천 음악).

시각 디자인 전체는 **Template** (`visualTemplateId`) 이 담당한다.
JCI 전용 디자인은 `ORGANIZATION_02_JCI` — 자세한 내용은 [`ORGANIZATION_JCI_TEMPLATE.md`](./ORGANIZATION_JCI_TEMPLATE.md).

## 1차 프리셋

| id | label | logo | default music |
|----|-------|------|---------------|
| `CUSTOM` | 직접 설정 | none | none |
| `JCI` | JCI | shared template logo | JCI Creed Song |

## 원칙

1. `organization.presetId` 는 출발점 표시용이다.
2. Public/Renderer 는 **저장된** `organization.logo` / `music` 만 사용한다. render-time에 preset 으로 덮어쓰지 않는다.
3. 신규 **Official** draft 기본값은 `CUSTOM` + logo empty + music off.
4. 신규 **JCI template** draft 는 create 시 preset JCI assets 를 적용한다 (기관명·행사 샘플 문구는 넣지 않음).
5. Template Preview fixture 와 draft 는 분리한다.
6. Shared R2 (`invitation/shared/...`) 는 삭제/cleanup 대상이 아니다.
7. 사용자 override(로고·음악) 후에도 `presetId` 는 유지할 수 있다. 강제 재적용 금지.
8. Official 템플릿에서도 사용자가 수동으로 JCI preset 을 고를 수 있다.

## 확장

레지스트리 `frontend/src/invitation/organizationPresets.ts` 에 항목을 추가한다.
UI 는 `listOrganizationPresets()` 기반이다 (하드코딩 카드 금지).
