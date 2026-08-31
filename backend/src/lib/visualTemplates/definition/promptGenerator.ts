/**
 * Admin → Cursor/Figma MCP design brief generator.
 */
import { GI_COMPONENTS, GI_COPY_KEYS, GI_FIELDS, GI_SECTIONS, type GiSectionId } from './types';

export type TemplateDesignRequest = {
  concept: 'WEDDING' | 'FUNERAL' | 'GENERAL' | 'ORGANIZATION';
  templateKey: string;
  displayName: string;
  defaultLocale: 'ko-KR' | 'en-US' | 'locale-neutral';
  styleTags: string[];
  mood?: string;
  primaryColor?: string;
  secondaryColor?: string;
  typographyDirection?: string;
  mobileFirst?: boolean;
  visualDirection?: string;
  sections: Array<{ id: GiSectionId; enabled: boolean; notes?: string }>;
};

export function suggestTemplateKey(concept: string, name: string): string {
  const prefix = concept.toUpperCase().replace(/[^A-Z]/g, '') || 'GENERAL';
  const slug = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
  const num = '07';
  return `${prefix}_${num}_${slug || 'NEW'}`;
}

export function generateFigmaDesignPrompt(req: TemplateDesignRequest): string {
  const enabled = req.sections.filter((s) => s.enabled).map((s) => s.id);
  const sectionBlock = enabled
    .map((id, i) => {
      const notes = req.sections.find((s) => s.id === id)?.notes;
      return `  ${i + 1}. GI_SECTION/${id}${notes ? ` — ${notes}` : ''}`;
    })
    .join('\n');

  return `# Figma Design Brief — Global Invitation Visual Template

You are designing a mobile-first invitation template for the Global Invitation product.
This design will be imported via Figma REST API into a TemplateDefinition schema.
Do NOT generate React/JSX/HTML. Design only in Figma using the GI_* naming contract.

## Metadata
- Concept: ${req.concept}
- Template Key (immutable): ${req.templateKey}
- Display name: ${req.displayName}
- Default locale: ${req.defaultLocale}
- Style tags: ${(req.styleTags || []).join(', ') || 'n/a'}
- Mood: ${req.mood || 'n/a'}
- Primary color: ${req.primaryColor || 'n/a'}
- Secondary color: ${req.secondaryColor || 'n/a'}
- Typography direction: ${req.typographyDirection || 'n/a'}
- Mobile-first: ${req.mobileFirst !== false}

## Visual direction
${req.visualDirection || '(none provided)'}

## Hard naming contract (semantic layers ONLY)
Top frame name MUST be exact:
  GI_TEMPLATE/${req.templateKey}

Inside the top frame, create:
  GI_VIEW/MOBILE   (required, ~390 width)
  GI_VIEW/DESKTOP  (optional, ~1280 width)

Sections (exact names, Auto Layout, in this order):
${sectionBlock || '  (none)'}

Allowed section ids: ${GI_SECTIONS.join(', ')}

Fields (use these exact names where applicable):
${GI_FIELDS.map((f) => `  GI_FIELD/${f}`).join('\n')}

Media:
  GI_MEDIA/HERO_IMAGE
  GI_MEDIA/GALLERY_IMAGE

Repeat:
  GI_REPEAT/GALLERY

Functional placeholders (design only — runtime uses product components):
${GI_COMPONENTS.map((c) => `  GI_COMPONENT/${c}`).join('\n')}

Locale UI titles (prefer these over hardcoded Korean/English copy):
${GI_COPY_KEYS.map((c) => `  GI_COPY/${c}`).join('\n')}

Decorative:
  GI_DECOR/<NAME>

Do NOT leave important semantic layers as "Frame 123" / "Group 28" / "Rectangle 19".
Low-level decorative children under GI_DECOR may keep generic names.

## Layout rules
- Breakpoints: <1024 mobile, >=1024 desktop
- Prefer Auto Layout; minimize absolute positioning
- Extractable typography, color, spacing, radius
- Minimize complex masks/filters/blends/effects
- MAP / RSVP / ACCOUNT / COMMENTS / MUSIC_PLAYER = placeholder frames only
- Do not implement real product functionality inside Figma

## Completion checklist
[ ] Top frame name is exactly GI_TEMPLATE/${req.templateKey}
[ ] GI_VIEW/MOBILE exists
[ ] Every required section uses GI_SECTION/<ID>
[ ] Bride/Groom/Date/Venue/Message use GI_FIELD/*
[ ] Hero uses GI_MEDIA/HERO_IMAGE
[ ] Gallery uses GI_REPEAT/GALLERY
[ ] Map/RSVP/Account placeholders use GI_COMPONENT/*
[ ] Auto Layout used on major frames
[ ] No missing required fields for ${req.concept}

When finished, select the top GI_TEMPLATE frame and Copy link to selection for Admin import.
`;
}

export const DEFAULT_WEDDING_SECTIONS: TemplateDesignRequest['sections'] = [
  'HERO',
  'HOST_INFO',
  'EVENT_INFO',
  'MESSAGE',
  'GALLERY',
  'LOCATION',
  'ACCOUNT',
  'RSVP',
  'FOOTER',
].map((id) => ({ id: id as GiSectionId, enabled: true }));
