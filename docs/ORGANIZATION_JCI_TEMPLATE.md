# Organization JCI Template

`ORGANIZATION_02_JCI` — JCI 브랜드 전용 기업·단체 초대장 템플릿.

## Template vs Preset

| Layer | Field | Responsibility |
|-------|--------|----------------|
| **Template** | `visualTemplateId` | Layout, colour system, typography, ripple, CTA chrome |
| **Preset** | `organization.presetId` | One-shot initial logo + music only |

Renderer는 저장된 `organization.logo` / `music` 만 사용한다. `presetId === JCI` 로 render-time 강제 재적용 금지.

## IDs

- Template: `ORGANIZATION_02_JCI` (표시명: JCI)
- Sibling: `ORGANIZATION_01_OFFICIAL` (표시명: 공식) — 유지
- Preset: `JCI` / `CUSTOM` (`organizationPresets.ts`)

## Brand source

JCI Brand Guidelines v1.2 (November 27, 2025).

### Theme tokens (`organizationJciTheme.ts`)

- Blue `#0097D7`
- Black `#130F2D`
- White `#FFFFFF`
- Navy `#1F4789`
- Teal `#57BCBC`
- Yellow `#EFC40F` (accent only)

### Typography

- Primary: Plus Jakarta Sans (`--font-gi-jakarta`)
- Korean fallback: Noto Sans KR / system Korean sans
- Arvo: quote/callout only (현재 미사용)

### Logo

- Shared key: `invitation/shared/images/templates/ORGANIZATION_01_OFFICIAL/logo.webp`
- 변형·회전·stretch·색상 변조·shadow 금지
- Placement: header top-left; compact brand identifier
- Local org name: DOM text (JCI Blue), wrap allowed

### Music

- Default create: JCI Creed Song (`JCI_CREED_SONG`)
- Recommended: Song 1 + Song 2
- Playback uses saved `fileUrl` / track; environment UUID drift는 production 전 logicalId 정리 권장

### Ripple

CSS concentric decoration (header / greeting / footer) — logo 재구성 아님.

## Create defaults

JCI template create:

- `visualTemplateId = ORGANIZATION_02_JCI`
- `presetId = JCI`
- shared logo + Creed Song 1
- **no** sample org/event contamination

Official create:

- `CUSTOM`, empty logo, music off

## User override

Logo / Song 2 / upload / none — save + reload 유지. Template이 덮어쓰지 않음.

## Production notes

- main/production merge는 별도 승인
- Shared logo/music R2 삭제 금지
- Prod music DB trackId 확인 후 publish
- FE SaaS UI (`#4F46E5`) ≠ invitation JCI theme

## Invitation chrome (JCI only)

Shared RSVP/account/map/music CSS는 `var(--invite-*, fallback)` 를 읽는다.
`ORGANIZATION_02_JCI` `.page` 가 `--invite-*` 를 `--jci-*` 로 연결한다.

- RSVP CTA: Blue `#0097D7` / hover Navy `#1F4789`
- Account copy: Blue outline
- Map links: subtle Blue border
- Footer: Black `#130F2D`
- Music FAB playing: Blue (idle Black)

Official fallback은 기존 `#4f46e5` 유지.
