<!-- markdownlint-disable -->

# StudioConfig Contract

## 목적
`studioConfig`는 Creator 템플릿의 디자인 설정을 저장/검증/미리보기/공개 렌더링에 공통으로 사용하는 공식 계약이다.

- `template_submissions.studio_config`: creator 작업본
- `templates.studio_config`: 승인 후 공개 템플릿 설정
- system 템플릿은 기존 렌더링을 그대로 유지하고, creator 템플릿만 확장 적용한다.

---

## 1) StudioConfig 구조

```json
{
  "category": "wedding",
  "theme": {
    "primaryColor": "#e8a3b3",
    "backgroundColor": "#ffffff",
    "textColor": "#333333",
    "fontFamily": "Playfair Display",
    "spacingScale": "normal"
  },
  "sections": {
    "hero": {
      "enabled": true,
      "layout": "center",
      "textAlign": "center",
      "backgroundStyle": "image"
    }
  },
  "sectionOrder": ["hero", "basicInfo", "couple"]
}
```

---

## 2) Allowed Categories

### Active
- `wedding`
- `funeral`
- `message`

### Planned (guide only, submit 금지)
- `simple_notice`
- `event`
- `business`

---

## 3) Theme Contract

### Required keys
- `primaryColor`
- `backgroundColor`
- `textColor`
- `fontFamily`
- `spacingScale`

### Allowed `fontFamily`
- `Playfair Display`
- `Noto Sans`
- `Noto Serif`
- `Montserrat`
- `Inter`

### Allowed `spacingScale`
- `compact`
- `normal`
- `wide`

---

## 4) Section Contract by Category

### Wedding
- `hero`
- `basicInfo`
- `invitationMessage`
- `couple`
- `gallery`
- `location`
- `accounts`
- `messages`
- `rsvp`
- `share`

### Funeral
- `hero`
- `deceasedInfo`
- `schedule`
- `location`
- `messages`
- `share`

### Message
- `hero`
- `message`
- `image`
- `sender`
- `share`

---

## 5) Base Section Config

```json
{
  "enabled": true,
  "layout": "center",
  "textAlign": "center",
  "backgroundStyle": "image"
}
```

### Allowed values
- `layout`: `center` | `left` | `right` | `split` | `full`
- `textAlign`: `left` | `center` | `right`
- `backgroundStyle`: `image` | `color` | `gradient`

---

## 6) Gallery Section Config

```json
{
  "enabled": true,
  "layout": "grid",
  "columns": 3,
  "imageStyle": "rounded"
}
```

### Allowed values
- `layout`: `grid` | `masonry` | `carousel`
- `columns`: `2` | `3` | `4`
- `imageStyle`: `square` | `rounded` | `circle`

---

## 7) Location Section Config

```json
{
  "enabled": true,
  "mapStyle": "card",
  "showTransport": true,
  "showParking": true
}
```

### Allowed values
- `mapStyle`: `card` | `full` | `compact`

---

## 8) Validation Rules

검증 위치:
- `backend/src/creator/templateSubmission.validation.ts`

검증 항목:
- category 유효성 (active/planned 구분)
- category와 studioConfig.category 일치 여부
- theme 키/값 형식 (`fontFamily`, `spacingScale`, color format)
- 허용된 섹션만 사용했는지
- 섹션별 허용 필드만 사용했는지
- `sectionOrder` 타입/중복/지원되지 않는 섹션 포함 여부
- 제출 시 `previewThumbnailUrl` 필수

유효하지 않으면 제출(`submit`)은 거부된다.

---

## 9) Renderer Responsibilities

### Creator renderer
- category 단위 renderer만 사용:
  - `CreatorWeddingRenderer`
  - `CreatorFuneralRenderer`
  - `CreatorMessageRenderer`
- 입력:
  - `runtimeData`
  - `studioConfig`
- 역할:
  - theme/style 반영
  - section enabled에 따라 표시 제어 가능한 영역 반영

### Fallback safety
- creator renderer 에러 시 system renderer로 폴백
- `studioConfig` 누락 시 system renderer로 폴백
- system template 렌더링 동작은 변경하지 않는다.

---

## 10) Preview Flow

- `sampleData + studioConfig + creator renderer => preview`
- Studio UI에서 설정 변경 즉시 preview에 반영
- preview 렌더 실패 시 안전 placeholder 표시
