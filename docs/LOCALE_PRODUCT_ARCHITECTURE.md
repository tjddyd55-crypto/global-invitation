# Locale Product Architecture

이번 국제화는 사이트 번역 토글이 아니라 **언어권용 Product Mode** 다.

- `ko-KR` = 한국어권 초대장 서비스
- `en-US` = 영어권 초대장 서비스

Viewer Translation(공유받은 사람이 나중에 따로 번역해서 보기)은 **범위 밖**.

## Supported locales (1차)

| id | selector | dictionary language |
| --- | --- | --- |
| `ko-KR` | 한국어 | `ko` |
| `en-US` | English | `en` |

향후 확장 가능: `ja-JP`, `zh-TW`, `zh-CN`, `es-ES`, `fr-FR`.  
`mn` dictionary는 parity 유지용이며 Product selector에는 없다.

## SSOT

| 계층 | 위치 |
| --- | --- |
| Product registry / persist / resolve | `frontend/src/i18n/productLocales.ts` |
| Feature re-export | `frontend/src/shared/locale` |
| Dictionary | `frontend/src/i18n/locales/{ko,en,mn}.ts` + `productModeCopy.ts` + `i18n/product/*Copy.ts` |
| Invitation snapshot (BE) | **`Invitation.language` only (canonical)** |
| Legacy read fallback | `dataJson.locale` / `dataJson.language` |
| BE normalizer | `backend/src/lib/invitationLocale.ts` |

Prisma 기본값 `Invitation.language = "en"` 은 레거시. **create API는 language를 항상 명시**하므로 DB default에 의존하지 않는다.  
해석 fallback은 `ko-KR`. Production backfill은 별도 승인 전 금지.

Conflict precedence:

1. `Invitation.language` (canonical)
2. legacy `dataJson.locale` / `dataJson.language`
3. `ko-KR`

브라우저 locale / service locale은 public invitation을 바꾸지 않는다.

## Service locale vs Invitation locale

1차 생성 시:

```
serviceLocale === invitation.locale
```

이후:

- Marketing / My Invitations / Create catalog = **service locale**
- Editor workspace / Public `/i/{slug}` = **invitation.locale**
- Template preview = **service locale** (저장하지 않음)
- 브라우저 언어는 public invitation을 바꾸지 않음

이미 만든 invitation의 locale을 한 번에 바꾸는 UI는 없다.

## Resolve priority (service)

1. `gi_locale` localStorage
2. `gi_locale` cookie
3. legacy `language` storage/cookie (`ko`/`en`/`mn`)
4. browser `navigator.language`
5. default `ko-KR`

URL prefix(`/en`, `/ko`)는 도입하지 않음 (전략 B: cookie/state only).

## Create snapshot

`POST /api/invitations` 는 `locale`/`language` 를 받는다.

- 지원: `ko-KR` \| `en-US` (+ legacy `ko`/`en`/`kr`)
- omitted → `ko-KR` (compatibility; FE 정상 경로는 항상 전송)
- unsupported (`mn`, `fr-FR`, garbage) → **400 `INVALID_LOCALE`**
- 저장: `Invitation.language` only
- 신규 write에서 `dataJson.locale` 는 strip (legacy read fallback만 유지)

## Public SSOT

`/i/{shareSlug}` 는 invitation.locale만 사용한다.  
`navigator.language` 로 system copy를 바꾸지 않는다.

사용자 입력(이름, 기관명, 주소, 소개 등)은 locale 변경 시 자동 번역하지 않는다.

## Formatting

- Date/time: `Intl.DateTimeFormat` via `getInvitationScheduleDisplay(data, locale)`
- Pricing currency: **USD 유지**. locale이 KRW로 바꾸지 않음.
- Payment provider / Toss: 변경 없음.

## Legal

약관/개인정보는 한국어 원문 유지. 임의 영어 법률 번역은 하지 않음.

## Future

- Viewer Translation
- Duplicate as English / AI translate draft
- Locale별 section visibility (계좌 문화)
- International phone E.164 완성
- URL prefix SEO (`/en`, `/ko`)
- ja/zh 실제 copy
