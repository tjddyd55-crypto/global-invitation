# Template Development Specification

## 1. Template Categories
Supported template categories:

- `wedding`
- `funeral`
- `message`
- `event`
- `business`

Category is the first classification layer for a template.
Every new template must declare a category explicitly and use a category-appropriate runtime data schema.

## 2. Required Template Structure
Each template must include a renderer component.

Example:

- `WeddingClassicInvitation.tsx`

Required location:

- `frontend/src/templates/[template-folder]/`

Recommended folder structure:

```text
frontend/src/templates/[template-folder]/
  ├─ [TemplateRenderer].tsx
  ├─ [TemplateRenderer].module.css
  ├─ data.ts
  └─ optional supporting files
```

Requirements:

- The renderer component must be the primary visual entry point for the template.
- The renderer must receive typed runtime data through its `data` prop.
- Template-specific assets, styles, and helper logic should stay inside the template folder when possible.

## 3. Required Registry Entry
All templates must be registered in:

- `frontend/src/templates/registry.ts`

Example:

```ts
TEMPLATE_REGISTRY = {
  wedding_classic: {
    category: "wedding",
    editorType: "wedding",
    renderer: WeddingClassicInvitation,
    label: "Wedding Classic",
  },
};
```

Required registry responsibilities:

- Define the canonical `templateKey`
- Define the `category`
- Define the `editorType`
- Define the renderer component
- Define a human-readable label

The registry is the single source of truth for:

- template renderer selection
- editor routing selection
- template key validation

## 4. Required Invitation Data Schema
Templates must follow the category schema defined in:

- `frontend/src/invitation/schemas.ts`

Current category-to-schema mapping:

- Wedding templates use `WeddingInvitationData`
- Funeral templates use `FuneralInvitationData`
- Message templates use `MessageInvitationData`

Requirements:

- Renderer props must use the correct schema type
- Editor output must be convertible to the correct schema type
- Runtime draft storage must remain compatible with the schema

If a new category is introduced, a dedicated schema type must be added before the template is connected to the registry.

## 5. Media Support
Templates may include the following media types:

- hero image
- gallery images
- background image
- map image

Media rules:

- Media fields must be represented explicitly in the category schema
- Optional media must degrade safely when missing
- A renderer must not crash when a media field is absent

## 6. Editor Compatibility
Templates must support the `editorType` defined in the registry.

Example:

- `editorType: "wedding"`

Compatible editor:

- `WeddingEditor`

Examples:

- `wedding` templates -> `WeddingEditor`
- `funeral` templates -> `FuneralEditor`
- `message` templates -> message editor flow defined by registry path

Rules:

- A template must not declare an editor type unless a compatible editor exists
- Registry entry and editor flow must stay aligned
- Unsupported editor/template combinations must fail safely with fallback UI

## 7. Template Preview Requirement
Each template should optionally provide a preview component.

Example:

- `TemplatePreview` component for gallery preview usage

Used in:

- `/templates` gallery

Preview rules:

- Preview should be lightweight and safe for gallery rendering
- Preview should use representative sample data
- Preview should not contain editor-only logic

## Summary
To add a new template safely, the following must be completed:

1. Create a renderer component under `frontend/src/templates/[template-folder]/`
2. Add or reuse the correct invitation runtime schema
3. Register the template in `frontend/src/templates/registry.ts`
4. Ensure the template matches a valid editor type
5. Provide preview support when the gallery experience requires it

Templates that skip registry registration or schema alignment are considered incomplete and must not be exposed to production flows.
