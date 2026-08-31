/**
 * Wedding POC fixture TemplateDefinition — used for tests and offline import when Figma blocked.
 * Key must NOT collide with CODE registry (01/04/05/06).
 */
import type { TemplateDefinition } from './types';
import { TEMPLATE_DEFINITION_SCHEMA_VERSION } from './types';

export const WEDDING_POC_TEMPLATE_KEY = 'WEDDING_07_ROMANTIC_GARDEN';

export function buildWeddingPocFixtureDefinition(): TemplateDefinition {
  return {
    schemaVersion: TEMPLATE_DEFINITION_SCHEMA_VERSION,
    templateKey: WEDDING_POC_TEMPLATE_KEY,
    concept: 'WEDDING',
    source: { type: 'FIXTURE', sourceHash: 'fixture-wedding-07-v1' },
    tokens: {
      primaryColor: '#5c6b4a',
      secondaryColor: '#f3efe6',
      fontFamily: 'Georgia, serif',
    },
    mobile: {
      width: 390,
      sections: [
        {
          id: 'HERO',
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 48,
            paddingBottom: 32,
            paddingLeft: 20,
            paddingRight: 20,
            backgroundColor: '#f3efe6',
            gap: 16,
          },
          nodes: [
            {
              id: 'hero-img',
              type: 'IMAGE',
              media: 'HERO_IMAGE',
              alt: 'Hero',
              style: {
                width: '100%',
                minHeight: 280,
                borderRadius: 12,
                objectFit: 'cover',
              },
            },
            {
              id: 'hero-title',
              type: 'FIELD',
              binding: 'EVENT_TITLE',
              fallbackText: 'Wedding Day',
              style: { fontSize: 28, fontWeight: 600, textAlign: 'center', color: '#2f3a28' },
            },
            {
              id: 'hero-names',
              type: 'CONTAINER',
              style: { display: 'flex', flexDirection: 'row', gap: 12, justifyContent: 'center' },
              children: [
                {
                  id: 'groom',
                  type: 'FIELD',
                  binding: 'GROOM_NAME',
                  fallbackText: 'Groom',
                  style: { fontSize: 18, color: '#2f3a28' },
                },
                {
                  id: 'amp',
                  type: 'TEXT',
                  text: '&',
                  style: { fontSize: 18, color: '#5c6b4a' },
                },
                {
                  id: 'bride',
                  type: 'FIELD',
                  binding: 'BRIDE_NAME',
                  fallbackText: 'Bride',
                  style: { fontSize: 18, color: '#2f3a28' },
                },
              ],
            },
          ],
        },
        {
          id: 'HOST_INFO',
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingTop: 24,
            paddingBottom: 24,
            paddingLeft: 20,
            paddingRight: 20,
          },
          nodes: [
            {
              id: 'host-title',
              type: 'COPY',
              copyKey: 'HOST_TITLE',
              style: { fontSize: 14, letterSpacing: 2, textAlign: 'center', color: '#5c6b4a' },
            },
          ],
        },
        {
          id: 'EVENT_INFO',
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 20,
            paddingRight: 20,
            alignItems: 'center',
          },
          nodes: [
            {
              id: 'date',
              type: 'FIELD',
              binding: 'EVENT_DATE',
              fallbackText: 'Date',
              style: { fontSize: 16, textAlign: 'center', color: '#2f3a28' },
            },
            {
              id: 'time',
              type: 'FIELD',
              binding: 'EVENT_TIME',
              fallbackText: 'Time',
              style: { fontSize: 14, textAlign: 'center', color: '#5c6b4a' },
            },
            {
              id: 'venue',
              type: 'FIELD',
              binding: 'VENUE_NAME',
              fallbackText: 'Venue',
              style: { fontSize: 16, textAlign: 'center', color: '#2f3a28' },
            },
          ],
        },
        {
          id: 'MESSAGE',
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            paddingTop: 24,
            paddingBottom: 24,
            paddingLeft: 24,
            paddingRight: 24,
          },
          nodes: [
            {
              id: 'msg-title',
              type: 'COPY',
              copyKey: 'MESSAGE_TITLE',
              style: { fontSize: 14, textAlign: 'center', color: '#5c6b4a' },
            },
            {
              id: 'msg-body',
              type: 'FIELD',
              binding: 'MESSAGE_BODY',
              fallbackText: 'We invite you to celebrate with us.',
              style: { fontSize: 15, lineHeight: 24, textAlign: 'center', color: '#2f3a28' },
            },
          ],
        },
        {
          id: 'GALLERY',
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 16,
            paddingRight: 16,
          },
          nodes: [
            {
              id: 'gal-title',
              type: 'COPY',
              copyKey: 'GALLERY_TITLE',
              style: { fontSize: 14, textAlign: 'center', color: '#5c6b4a' },
            },
            {
              id: 'gal-repeat',
              type: 'REPEAT',
              repeatOf: 'GALLERY',
              style: { display: 'flex', flexDirection: 'column', gap: 8 },
              children: [
                {
                  id: 'gal-item',
                  type: 'IMAGE',
                  media: 'GALLERY_IMAGE',
                  alt: 'Gallery',
                  style: { width: '100%', minHeight: 180, borderRadius: 8, objectFit: 'cover' },
                },
              ],
            },
          ],
        },
        {
          id: 'LOCATION',
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            paddingTop: 24,
            paddingBottom: 24,
            paddingLeft: 16,
            paddingRight: 16,
          },
          nodes: [
            {
              id: 'loc-title',
              type: 'COPY',
              copyKey: 'LOCATION_TITLE',
              style: { fontSize: 14, textAlign: 'center', color: '#5c6b4a' },
            },
            {
              id: 'loc-addr',
              type: 'FIELD',
              binding: 'VENUE_ADDRESS',
              fallbackText: 'Address',
              style: { fontSize: 14, textAlign: 'center', color: '#2f3a28' },
            },
            { id: 'map', type: 'COMPONENT', component: 'MAP', style: { minHeight: 200, borderRadius: 12 } },
          ],
        },
        {
          id: 'ACCOUNT',
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            paddingTop: 24,
            paddingBottom: 24,
            paddingLeft: 16,
            paddingRight: 16,
          },
          nodes: [
            {
              id: 'acc-title',
              type: 'COPY',
              copyKey: 'ACCOUNT_TITLE',
              style: { fontSize: 14, textAlign: 'center', color: '#5c6b4a' },
            },
            { id: 'acc', type: 'COMPONENT', component: 'ACCOUNT' },
          ],
        },
        {
          id: 'RSVP',
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            paddingTop: 24,
            paddingBottom: 24,
            paddingLeft: 16,
            paddingRight: 16,
            backgroundColor: '#f3efe6',
          },
          nodes: [
            {
              id: 'rsvp-title',
              type: 'COPY',
              copyKey: 'RSVP_TITLE',
              style: { fontSize: 14, textAlign: 'center', color: '#5c6b4a' },
            },
            { id: 'rsvp', type: 'COMPONENT', component: 'RSVP' },
          ],
        },
        {
          id: 'FOOTER',
          style: {
            display: 'flex',
            flexDirection: 'column',
            paddingTop: 32,
            paddingBottom: 48,
            paddingLeft: 20,
            paddingRight: 20,
            alignItems: 'center',
          },
          nodes: [
            {
              id: 'footer',
              type: 'COPY',
              copyKey: 'FOOTER_NOTE',
              style: { fontSize: 13, textAlign: 'center', color: '#5c6b4a' },
            },
          ],
        },
      ],
    },
    desktop: {
      width: 1280,
      sections: [], // renderer falls back to mobile sections with maxWidth expansion
    },
  };
}
