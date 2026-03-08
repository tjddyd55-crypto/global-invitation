# Wedding Editor Refactor Plan

## 목적

현재 `WeddingEditor`는 `wedding_classic` 템플릿 계약에 강하게 결합되어 있다.
이 문서의 목표는 현재 구조를 `wedding` 카테고리 공통 에디터로 진화시켜,
같은 카테고리 안의 여러 템플릿이 새로운 에디터 구현 없이 재사용 가능하도록
리팩터링 방향을 정의하는 것이다.

이 문서는 설계 문서이며, 코드 구현 범위는 포함하지 않는다.
계획은 현재 실제 코드 구조를 기준으로 작성하며, 그린필드 재설계를 전제로 하지 않는다.

## 1. Current Architecture Summary

### 1.1 왜 현재 `WeddingEditor`는 사실상 `wedding_classic` 전용인가

현재 `WeddingEditor`는 카테고리 에디터라기보다 `wedding_classic` 템플릿용 편집기다.
실제 결합 지점은 아래와 같다.

- 고정 step 구조
- 고정 preview renderer
- 고정 mapper
- 고정 media slots
- 기본값과 타입에 들어간 classic 전용 가정

### 1.2 고정 step 구조

`frontend/src/editors/wedding/WeddingEditor.tsx`에서 step 목록은 상수로 고정되어 있다.

- `기본 설정`
- `대표 정보`
- `대표 이미지`
- `초대 문구`
- `신랑/신부`
- `갤러리`
- `위치`
- `계좌`
- `부가 기능`
- `공유 미리보기`

그리고 렌더링도 `currentStep === 0`, `currentStep === 1` 같은 방식으로 직접 분기된다.
즉, step order는 고정이고 템플릿별 조합이나 숨김 개념이 없다.

영향:

- 새로운 wedding template가 `accounts` 없이 동작하더라도 step 제거가 불가능하다.
- `messages`를 나중에 추가하거나 `hero`를 두 단계로 나누려면 editor 본체를 수정해야 한다.

### 1.3 고정 preview renderer

`frontend/src/editors/wedding/components/LivePreviewPanel.tsx`는 아래처럼 `WeddingClassicInvitation`을 직접 import 한다.

- `import WeddingClassicInvitation from '@/src/templates/weddingClassic/WeddingClassicInvitation';`

즉, preview renderer는 category 개념이 아니라 classic renderer에 직접 묶여 있다.

영향:

- `wedding_modern`이 생겨도 같은 editor 안에서 다른 preview renderer를 꽂을 수 없다.
- preview 계층이 registry를 우회하고 있어 템플릿 확장성이 낮다.

### 1.4 고정 mapper

`frontend/src/editors/wedding/state/weddingEditor.mapper.ts`의 핵심 함수는 `buildWeddingClassicPreviewData()`다.

이 함수는 다음 classic 전용 표현까지 직접 책임진다.

- `buildWeddingClassicHeroTitle(...)`
- `buildWeddingClassicCalendarTitle(...)`
- `getWeddingClassicDefaultLabels(...)`
- `messagesTitle`, `accountsTitle`, `rsvpTitle` 등 classic 문구

영향:

- category mapper와 template 표현 계층이 분리되어 있지 않다.
- 새로운 템플릿이 같은 wedding category라도 다른 타이틀 생성 규칙을 가지면 mapper 수정이 필요하다.

### 1.5 고정 media slots

현재 wedding editor에서 사실상 지원하는 미디어 슬롯은 다음뿐이다.

- `heroImage`
- `galleryImages`
- `mapImage`

하지만 이 중 `mapImage`는 editor 입력이 아니라 classic 기본 자산으로 고정된다.

실제 근거:

- `frontend/src/editors/wedding/state/weddingEditor.types.ts`
  - `hero.heroImage`
  - `gallery.images`
  - `location`에는 `mapImage` 자체가 없음
- `frontend/src/editors/wedding/state/weddingEditor.mapper.ts`
  - `mapImage: WEDDING_EDITOR_ASSETS.DEFAULT_MAP_IMAGE`

영향:

- 템플릿이 지도 이미지를 사용자 업로드로 바꾸고 싶어도 state 구조가 없다.
- `storyImages`, `backgroundImage`, `timelineImages` 같은 새로운 media section을 붙일 수 없다.

### 1.6 기본값과 typing 안의 template-specific assumptions

현재 기본값과 타입도 classic assumptions를 가진다.

구체적 예시:

- `frontend/src/editors/wedding/state/weddingEditor.types.ts`
  - `templateKey: 'wedding_classic' | 'classic'`
- `frontend/src/editors/wedding/steps/Step0Setup.tsx`
  - 템플릿 표시가 `wedding_classic (고정)`으로 하드코딩
- `frontend/src/editors/wedding/state/weddingEditor.initial.ts`
  - 기본 이미지가 모두 `/images/wedding/classic/...`
  - 기본 문구와 계좌도 classic 샘플 데이터 중심

영향:

- 동일 카테고리의 새로운 템플릿을 추가하려면 타입, 기본값, UI 문구를 모두 함께 건드려야 한다.
- 에디터가 범용 wedding editor가 아니라 classic variant editor로 남는다.

## 2. Target Architecture

목표 구조는 `WeddingEditorShell + WeddingSectionRegistry + WeddingTemplateConfig` 조합이다.

### 2.1 `WeddingEditorShell`

`WeddingEditorShell`은 wedding 카테고리 공통 편집 컨테이너다.

책임:

- shared editor container
- step navigation
- save/publish actions
- shared layout
- live preview container
- section list orchestration
- template config 주입

하지 않아야 할 일:

- 특정 wedding renderer 직접 import
- classic 전용 label 생성
- hardcoded step array 보유
- 특정 templateKey를 switch로 직접 해석

권장 인터페이스 예시:

```ts
type WeddingEditorShellProps = {
  templateKey: string;
  config: WeddingTemplateConfig;
  initialState: WeddingEditorState;
  pageUrl: string;
  onSave?: (state: WeddingEditorState) => Promise<void> | void;
  onSaveAndExit?: (state: WeddingEditorState) => Promise<void> | void;
  onPublish?: (state: WeddingEditorState) => Promise<void> | void;
  saving?: boolean;
  publishing?: boolean;
  saveError?: string | null;
  draftStatus?: 'draft' | 'published';
  lastSavedAt?: string | null;
};
```

권장 분리:

- `WeddingEditorShell`: orchestration
- `WeddingSectionRenderer`: 현재 step section 렌더링
- `LivePreviewPanel`: preview frame container

### 2.2 `WeddingSectionRegistry`

`WeddingSectionRegistry`는 wedding 카테고리에서 사용할 수 있는 section definition registry다.
각 section은 독립적으로 정의되고 조합 가능해야 한다.

권장 키:

- `basicInfo`
- `hero`
- `invitationMessage`
- `couple`
- `gallery`
- `location`
- `accounts`
- `rsvp`
- `messages`
- `share`

권장 타입:

```ts
type WeddingSectionDefinition = {
  key: WeddingSectionKey;
  title: string;
  requiredByDefault: boolean;
  canBeHidden: boolean;
  getStepLabel?: (config: WeddingTemplateConfig) => string;
  render: (props: WeddingSectionRenderProps) => React.ReactNode;
};
```

#### Section definition matrix

| Section | Purpose | Data ownership | Required / Optional | Can template hide it |
| --- | --- | --- | --- | --- |
| `basicInfo` | 제목, 예식 일시, 장소명 등 행사 기본 정보 입력 | `state.basic` | Required | No |
| `hero` | 대표 이미지와 hero 텍스트 입력 | `state.hero` | Required | Usually No |
| `invitationMessage` | 인용문과 본문 문단 편집 | `state.invitationMessage` | Optional | Yes |
| `couple` | 신랑/신부 인물 정보 편집 | `state.groom`, `state.bride` | Usually Required | Template policy에 따라 Yes |
| `gallery` | 다중 이미지 업로드 및 순서 편집 | `state.gallery` | Optional | Yes |
| `location` | 주소, 좌표, 교통, 주차 정보 | `state.location` | Required for most templates | Yes, but not recommended |
| `accounts` | 계좌 목록 편집 | `state.accounts` | Optional | Yes |
| `rsvp` | RSVP 노출 여부 및 버튼 문구 | `state.extras` 일부 | Optional | Yes |
| `messages` | guestbook/messages 노출 정책과 관련 문구 | `state.extras` 및 향후 `state.messages` | Optional | Yes |
| `share` | OG 메타데이터, 공유 미리보기 | `state.share` | Required | No |

설계 원칙:

- section은 카테고리 수준 책임만 가진다.
- section은 특정 템플릿 렌더러를 import하지 않는다.
- section이 required인지 optional인지는 기본 정책과 template config가 함께 결정한다.
- `hiddenSections`는 UI에서 숨기는 것이지, 무조건 데이터 제거를 의미하지 않는다.

### 2.3 `WeddingTemplateConfig`

각 wedding template는 새로운 editor 구현 대신 설정 객체를 제공해야 한다.

필수 지원 필드:

- `templateKey`
- `enabledSections`
- `hiddenSections`
- `defaultValues`
- `fieldOverrides`
- `previewRenderer`

권장 구조:

```ts
type WeddingTemplateConfig = {
  templateKey: string;
  enabledSections: WeddingSectionKey[];
  hiddenSections?: WeddingSectionKey[];
  defaultValues?: Partial<WeddingEditorState>;
  fieldOverrides?: Partial<Record<WeddingSectionKey, WeddingFieldOverride[]>>;
  previewRenderer: React.ComponentType<WeddingTemplatePreviewProps>;
};
```

필드 의미:

- `templateKey`
  - 템플릿 식별자
- `enabledSections`
  - 이 템플릿이 사용할 section 목록
- `hiddenSections`
  - registry에 존재하지만 UI에서는 숨길 section 목록
- `defaultValues`
  - 템플릿별 기본값, 기본 문구, 기본 자산
- `fieldOverrides`
  - label, placeholder, help text, required 여부 같은 field-level override
- `previewRenderer`
  - live preview와 preview step에서 사용할 renderer

예시 방향:

- `wedding_classic`
  - `accounts`, `rsvp`, `messages` 활성
- `wedding_minimal`
  - `accounts`, `messages` 숨김
  - `hero`, `basicInfo`, `location`, `share` 중심
- `wedding_modern`
  - section 구성은 유사하지만 문구와 기본 자산만 다름

## 3. Data Architecture

핵심 목표는 `editor state`, `category runtime data`, `template-specific rendering data`를 분리하는 것이다.

### 3.1 Editor state

역할:

- 폼 입력과 편집 UX에 최적화된 상태
- reducer가 관리하는 source of editing truth
- UI 단위 구조 유지

현재 실체:

- `setup`
- `basic`
- `hero`
- `invitationMessage`
- `groom`
- `bride`
- `gallery`
- `location`
- `accounts`
- `extras`
- `share`

앞으로의 원칙:

- editor state는 renderer 요구사항을 직접 반영하지 않는다.
- 가능한 한 form-friendly shape를 유지한다.

### 3.2 Category runtime data

역할:

- wedding category의 공통 런타임 계약
- preview, save, publish 직전의 공통 데이터
- 여러 wedding 템플릿이 공유 가능한 중간 표준 형태

이 계층은 현재 `WeddingInvitationData`를 그대로 재사용할 수도 있지만,
실제 의미는 "classic renderer props"가 아니라 "wedding category runtime contract"가 되어야 한다.

이 데이터에는 다음 수준이 적합하다.

- 행사 기본 정보
- 사람 정보
- gallery
- location
- accounts
- RSVP
- share metadata

### 3.3 Template-specific rendering data

역할:

- 각 renderer가 실제로 소비하는 최종 데이터
- 같은 category runtime data라도 표현 방식이 다른 부분 담당

예시:

- classic은 `calendarTitle`, 관계 호칭 prefix, 기본 label 세트가 필요
- minimal은 calendar section이 없을 수 있음
- modern은 같은 데이터라도 hero title 생성 규칙이 다를 수 있음

### 3.4 현재 mapper의 진화 방향

현재:

- `buildWeddingClassicPreviewData(state)`

목표:

- `buildWeddingCategoryRuntimeData(state, templateKey)`
- 필요 시 template adapter layer 추가

권장 파이프라인:

```ts
WeddingEditorState
-> buildWeddingCategoryRuntimeData(state, templateKey)
-> resolveWeddingTemplateAdapter(templateKey)
-> buildTemplateRenderingData(runtimeData)
-> previewRenderer / publish renderer
```

### 3.5 Template adapter layer가 필요한가

결론:

- Yes, 선택적이지만 권장된다.

이유:

- 현재 classic은 template-specific transformation이 많다.
- 이를 category mapper에 남겨두면 category contract가 다시 classic 중심으로 오염된다.

권장 역할 분리:

- category mapper
  - 공통 wedding 데이터 생성
- template adapter
  - 각 템플릿이 요구하는 표현 데이터 생성

예시:

- `adaptWeddingRuntimeDataForClassic(...)`
- `adaptWeddingRuntimeDataForModern(...)`

## 4. Preview Architecture

### 4.1 현재 문제

현재 `LivePreviewPanel`은 `WeddingClassicInvitation`을 직접 import 한다.
이 구조는 preview 계층이 template registry를 우회하게 만든다.

### 4.2 목표 구조

preview renderer 선택은 반드시 다음 경로를 따라야 한다.

`templateKey -> registry -> preview renderer`

### 4.3 권장 resolution flow

1. `WeddingEditorShell`이 현재 `templateKey`를 가진다.
2. `templateKey`로 `WeddingTemplateConfig`를 resolve 한다.
3. config에서 `previewRenderer`를 가져온다.
4. `buildWeddingCategoryRuntimeData(state, templateKey)`를 실행한다.
5. 필요 시 adapter를 거쳐 renderer input을 만든다.
6. `LivePreviewPanel`은 renderer와 data를 props로 받아 렌더링만 담당한다.

권장 인터페이스:

```ts
type LivePreviewPanelProps = {
  renderer: React.ComponentType<any>;
  data: unknown;
  previewOptions?: {
    showRsvp?: boolean;
    showGuestbook?: boolean;
  };
  title?: string;
};
```

핵심 원칙:

- preview panel은 renderer를 직접 import하지 않는다.
- preview panel은 frame/container 역할만 한다.
- renderer 선택은 config/registry 계층이 담당한다.
- preview와 publish는 같은 renderer resolution source를 사용해야 한다.

## 5. Migration Plan

리팩터링은 작은 단계로 나누어 진행해야 한다.
기존 drafts와 publish flow를 깨지 않는 것이 최우선이다.

### Phase 1

목표:

- `WeddingClassicInvitation` direct coupling 제거
- classic-only mapper naming 일반화

작업:

1. `LivePreviewPanel`에서 direct import 제거
2. `WeddingEditor` 또는 shell 계층에서 `templateKey` 기준 renderer resolve
3. `buildWeddingClassicPreviewData`를 deprecated 상태로 유지하면서
   `buildWeddingCategoryRuntimeData` 도입
4. `wedding_classic`과 `classic` 출력 동일성 보장

가능성이 높은 영향 파일:

- `frontend/src/editors/wedding/components/LivePreviewPanel.tsx`
- `frontend/src/editors/wedding/WeddingEditor.tsx`
- `frontend/src/editors/wedding/state/weddingEditor.mapper.ts`
- `frontend/src/templates/registry.ts`
- `frontend/app/editor/[slug]/page.tsx`

위험도:

- Medium

Fallback / rollback notes:

- `buildWeddingClassicPreviewData`를 즉시 삭제하지 않고 compatibility wrapper로 유지
- renderer resolve 실패 시 임시로 classic direct path로 되돌릴 수 있게 분리 커밋 권장

### Phase 2

목표:

- `WeddingSectionRegistry` 도입
- hardcoded step array 제거

작업:

1. section definition type 추가
2. 기존 `Step1BasicInfo`, `Step2HeroImage` 등을 registry definition으로 래핑
3. `STEP_ITEMS` 제거
4. registry 기반 step list 생성
5. 우선은 `wedding_classic` config 1개만 연결

가능성이 높은 영향 파일:

- `frontend/src/editors/wedding/WeddingEditor.tsx`
- `frontend/src/editors/wedding/components/StepperNav.tsx`
- `frontend/src/editors/wedding/steps/*`
- `frontend/src/editors/wedding/state/weddingEditor.types.ts`
- 신규 `frontend/src/editors/wedding/registry/*`

위험도:

- Medium-High

Fallback / rollback notes:

- 기존 hardcoded `STEP_ITEMS` 구현을 한동안 브랜치 또는 별도 커밋으로 유지
- step source만 교체하고 reducer/state shape는 Phase 2에서 가능한 한 유지

### Phase 3

목표:

- `WeddingTemplateConfig` 지원
- hidden/optional sections
- template-specific defaults / field overrides

작업:

1. `WeddingTemplateConfig` 타입 정의
2. `wedding_classic` config 작성
3. `hiddenSections`, `enabledSections` 반영
4. `defaultValues`, `fieldOverrides` 적용
5. `wedding_minimal`, `wedding_modern` 같은 추가 config를 안전하게 작성할 수 있는 구조 확보

가능성이 높은 영향 파일:

- `frontend/src/editors/wedding/WeddingEditor.tsx`
- `frontend/src/editors/wedding/state/weddingEditor.initial.ts`
- `frontend/src/editors/wedding/state/weddingEditor.types.ts`
- 신규 `frontend/src/editors/wedding/templateConfigs/*`
- `frontend/src/templates/registry.ts`

위험도:

- High

Fallback / rollback notes:

- hidden section은 우선 data 삭제 없이 UI만 숨기도록 구현
- `wedding_classic` config를 baseline으로 두고 추가 템플릿 config는 feature-flag처럼 점진 활성화

### Phase 4

목표:

- classic-specific assumptions 제거
- `wedding_classic` / `classic` 외 추가 wedding template 지원

작업:

1. classic 자산/문구/타이틀 생성 로직 정리
2. template adapter layer 도입 또는 강화
3. additional wedding template 연결
4. draft restore, preview, publish 회귀 검증

가능성이 높은 영향 파일:

- `frontend/src/editors/wedding/state/weddingEditor.initial.ts`
- `frontend/src/editors/wedding/state/weddingEditor.mapper.ts`
- `frontend/src/templates/weddingClassic/*`
- 신규 `frontend/src/templates/weddingModern/*`
- 신규 `frontend/src/templates/weddingMinimal/*`
- `frontend/src/invitation/schemas.ts`

위험도:

- High

Fallback / rollback notes:

- 신규 wedding template 공개는 config만 추가했다고 즉시 열지 말고 QA 완료 후 공개
- `wedding_classic`을 golden path로 유지하고 regressions가 생기면 신규 template 연결만 되돌릴 수 있어야 함

## 6. Risk Analysis

### 6.1 Existing drafts

위험:

- 기존 local draft는 현재 classic 중심 구조를 전제로 저장되어 있다.
- mapper 또는 state shape 변경 시 draft 복원이 깨질 수 있다.

대응:

- legacy draft reader 유지
- `wedding_classic`과 `classic` draft를 우선 회귀 테스트
- hidden sections는 초기에 값 삭제 없이 유지

### 6.2 Preview rendering

위험:

- renderer resolve 실패 시 blank preview 발생 가능
- adapter 누락 시 preview data가 incomplete 상태로 전달될 수 있음

대응:

- `templateKey` 미해결 fallback UI 제공
- preview renderer와 publish renderer의 resolution source 통일
- classic snapshot 또는 visual regression 우선 검증

### 6.3 Editor save/load flow

위험:

- reducer action과 state shape 변경 시 save/load 경로가 깨질 수 있다.
- field overrides가 잘못 적용되면 입력 UI와 저장값이 어긋날 수 있다.

대응:

- 초기 phase에서는 state shape 유지
- step source만 먼저 교체
- reducer 변경은 단계적으로 진행

### 6.4 Invitation publish flow

위험:

- publish 직전 mapper가 달라지면 public invitation page가 기대하는 데이터와 어긋날 수 있다.
- preview는 되는데 publish 결과만 깨지는 비대칭 문제가 생길 수 있다.

대응:

- preview와 publish가 동일 mapper pipeline을 사용하도록 강제
- public renderer contract를 명시적으로 문서화
- `wedding_classic` publish를 최우선 회귀 경로로 설정

### 6.5 Backward compatibility with `wedding_classic` and `classic`

위험:

- `classic` alias가 새 config 구조에서 누락될 수 있다.
- `templateKey` 확장 과정에서 현재 `'wedding_classic' | 'classic'` 타입이 깨질 수 있다.

대응:

- alias mapping을 명시적으로 유지
- `wedding_classic`과 `classic` 둘 다 동일 config 또는 shared config 경로를 쓰도록 설계

## 7. Final Recommendation

권장 결론:

- 현재 editor는 당분간 유지한다.
- 리팩터링은 반드시 phase 단위로 나눈다.
- 최소 Phase 2 완료 전까지는 새로운 wedding template 개발을 본격적으로 진행하지 않는다.

이유:

- 현재 구조는 editor, preview, mapper, defaults가 모두 classic 중심으로 결합되어 있다.
- 지금 상태에서 새로운 wedding template를 추가하면 editor 내부 분기와 template-specific assumptions만 늘어난다.
- Phase 2 완료 후에야 step source가 config 기반으로 바뀌므로, 이후부터가 실질적인 category editor 출발점이다.

실행 원칙:

1. 현재 editor는 운영 안정성을 위해 임시 유지
2. preview decoupling부터 시작
3. section registry를 먼저 안정화
4. 그 다음 template config와 additional templates를 붙임

## Summary

이 리팩터링의 핵심은 `WeddingEditor`를 새로 만드는 것이 아니라,
현재 `wedding_classic` 중심 편집기를 `wedding` 카테고리 공통 편집 플랫폼으로 재구성하는 것이다.

핵심 전환 포인트:

1. preview renderer 분리
2. category-level mapper 도입
3. section registry 도입
4. template config 도입
5. template adapter로 표현 차이 분리

이 순서를 지키면 기존 `wedding_classic` / `classic` 흐름을 최대한 보존하면서,
추가 wedding template를 editor 재구현 없이 확장할 수 있다.
