# Template Data Specification

## 1. Wedding Invitation Template Data

Wedding templates must follow a consistent invitation data structure.

### Wedding Basic Information

- `coupleNames`
- `weddingDateTime`
- `venueName`
- `venueDetail`

### Wedding Hero Section

- `heroImage`
- `heroTitle`
- `heroSubtitle`
- `heroOverlayText`

### Wedding Invitation Message

- `introQuote`
- `introText[]`

### Wedding People

- `groom`
  - `name`
  - `photo`
  - `phone`
  - `parentsText`
- `bride`
  - `name`
  - `photo`
  - `phone`
  - `parentsText`

### Wedding Gallery

- `galleryImages[]`

### Wedding Location

- `address`
- `mapImage`
- `transportInfo[]`
- `parkingInfo[]`

### Wedding Accounts

- `accounts[]`
  - `bank`
  - `number`
  - `holder`

### Wedding RSVP

- `rsvp.enabled`
- `rsvpTitle`
- `rsvpDescription`
- `rsvpButton`

### Wedding Messages / Guestbook

- `messagesTitle`
- `messages[]`

### Wedding Share Metadata

- `ogTitle`
- `ogDescription`
- `ogImage`

## 2. Funeral Invitation Template Data

Funeral templates must follow the standard funeral invitation data structure.

### Funeral Basic

- `deceasedName`
- `funeralDateTime`
- `funeralLocation`

### Funeral Hero

- `portraitImage`

### Funeral Obituary

- `obituaryText`

### Funeral Family

- `familyMembers[]`

### Funeral Location

- `address`
- `mapImage`

### Funeral Schedule

- `visitationTime`
- `funeralTime`
- `burialTime`

## 3. Message Card Template Data

Message templates must follow the standard message card data structure.

### Message Basic

- `title`
- `message`

### Message Media

- `image`

### Message Footer

- `senderName`
- `senderTitle`

### Message Share Metadata

- `ogTitle`
- `ogDescription`
- `ogImage`

## 4. Media Guidelines

Templates may support the following media types:

- `heroImage`
- `galleryImages`
- `portraitImage`
- `backgroundImage`
- `mapImage`

All images must support:

- URL
- Alt text
- Optional caption

Recommended media object shape:

```ts
type TemplateImageAsset = {
  url: string;
  alt: string;
  caption?: string;
};
```

## 5. Template Development Rules

All new templates must:

1. Follow the data schema of their category
2. Register in `TEMPLATE_REGISTRY`
3. Use the correct renderer component
4. Be compatible with the assigned `editorType`
5. Support responsive layout

## Future Template Rule

When adding new templates:

1. Follow `TEMPLATE_DATA_SPEC.md`
2. Use existing schema types
3. Only extend schema if absolutely required
