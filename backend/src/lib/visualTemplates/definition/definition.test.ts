import assert from 'node:assert/strict';
import test from 'node:test';
import { parseFigmaFrameUrl } from '../../figma/urlParser';
import { parseGiLayerName, parseFigmaTemplateNode } from './giParser';
import { validateTemplateDefinition } from './validate';
import { buildWeddingPocFixtureDefinition, WEDDING_POC_TEMPLATE_KEY } from './weddingPocFixture';
import { generateFigmaDesignPrompt, DEFAULT_WEDDING_SECTIONS } from './promptGenerator';
import type { FigmaNodeDocument } from '../../figma/client';

test('figma URL parser accepts design URL with dash node-id', () => {
  const parsed = parseFigmaFrameUrl(
    'https://www.figma.com/design/AbCdEf12345/Name?node-id=12-34'
  );
  assert.equal(parsed.fileKey, 'AbCdEf12345');
  assert.equal(parsed.nodeIdColon, '12:34');
  assert.equal(parsed.nodeIdDash, '12-34');
});

test('figma URL parser accepts file URL with colon node-id', () => {
  const parsed = parseFigmaFrameUrl('https://figma.com/file/AbCdEf12345/x?node-id=1:2');
  assert.equal(parsed.nodeIdColon, '1:2');
});

test('figma URL parser rejects non-figma host', () => {
  assert.throws(
    () => parseFigmaFrameUrl('https://evil.example/design/AbCdEf12345/x?node-id=1-2'),
    /FIGMA_URL_HOST_NOT_ALLOWED/
  );
});

test('figma URL parser requires node id', () => {
  assert.throws(
    () => parseFigmaFrameUrl('https://www.figma.com/design/AbCdEf12345/Name'),
    /FIGMA_NODE_ID_MISSING/
  );
});

test('GI layer name contract', () => {
  assert.deepEqual(parseGiLayerName('GI_TEMPLATE/WEDDING_07_ROMANTIC_GARDEN'), {
    kind: 'TEMPLATE',
    key: 'WEDDING_07_ROMANTIC_GARDEN',
  });
  assert.equal(parseGiLayerName('GI_SECTION/HERO').kind, 'SECTION');
  assert.equal(parseGiLayerName('GI_FIELD/BRIDE_NAME').kind, 'FIELD');
  assert.equal(parseGiLayerName('GI_COMPONENT/MAP').kind, 'COMPONENT');
  assert.equal(parseGiLayerName('Frame 123').kind, 'PLAIN');
});

test('wedding POC fixture validates', () => {
  const def = buildWeddingPocFixtureDefinition();
  const result = validateTemplateDefinition(def, { expectedTemplateKey: WEDDING_POC_TEMPLATE_KEY });
  assert.equal(result.ok, true);
  assert.equal(result.definition?.templateKey, WEDDING_POC_TEMPLATE_KEY);
});

test('parser detects sections from figma-like tree', () => {
  const root: FigmaNodeDocument = {
    id: '0:1',
    name: `GI_TEMPLATE/${WEDDING_POC_TEMPLATE_KEY}`,
    type: 'FRAME',
    absoluteBoundingBox: { x: 0, y: 0, width: 390, height: 2000 },
    children: [
      {
        id: '1:1',
        name: 'GI_VIEW/MOBILE',
        type: 'FRAME',
        children: [
          {
            id: '2:1',
            name: 'GI_SECTION/HERO',
            type: 'FRAME',
            children: [
              { id: '3:1', name: 'GI_FIELD/EVENT_TITLE', type: 'TEXT', characters: 'Title' },
              { id: '3:2', name: 'GI_MEDIA/HERO_IMAGE', type: 'RECTANGLE' },
            ],
          },
          {
            id: '2:2',
            name: 'GI_SECTION/EVENT_INFO',
            type: 'FRAME',
            children: [{ id: '3:3', name: 'GI_FIELD/EVENT_DATE', type: 'TEXT', characters: 'Date' }],
          },
          {
            id: '2:3',
            name: 'GI_SECTION/MESSAGE',
            type: 'FRAME',
            children: [{ id: '3:4', name: 'GI_FIELD/MESSAGE_BODY', type: 'TEXT', characters: 'Hi' }],
          },
          {
            id: '2:4',
            name: 'GI_SECTION/LOCATION',
            type: 'FRAME',
            children: [{ id: '3:5', name: 'GI_COMPONENT/MAP', type: 'FRAME' }],
          },
          {
            id: '2:5',
            name: 'GI_SECTION/RSVP',
            type: 'FRAME',
            children: [{ id: '3:6', name: 'GI_COMPONENT/RSVP', type: 'FRAME' }],
          },
        ],
      },
    ],
  };

  const parsed = parseFigmaTemplateNode({
    root,
    expectedTemplateKey: WEDDING_POC_TEMPLATE_KEY,
    concept: 'WEDDING',
    source: { type: 'FIGMA', fileKey: 'abc', nodeId: '0:1' },
  });
  assert.ok(parsed.detectedSections.includes('HERO'));
  assert.ok(parsed.detectedFields.includes('EVENT_TITLE'));
  assert.ok(parsed.detectedComponents.includes('MAP'));
  const validated = validateTemplateDefinition(parsed.definition, {
    expectedTemplateKey: WEDDING_POC_TEMPLATE_KEY,
  });
  assert.equal(validated.ok, true);
});

test('prompt generator includes GI contract checklist', () => {
  const prompt = generateFigmaDesignPrompt({
    concept: 'WEDDING',
    templateKey: WEDDING_POC_TEMPLATE_KEY,
    displayName: 'Romantic Garden',
    defaultLocale: 'ko-KR',
    styleTags: ['Romantic'],
    sections: DEFAULT_WEDDING_SECTIONS,
    mobileFirst: true,
    visualDirection: 'garden',
  });
  assert.match(prompt, /GI_TEMPLATE\/WEDDING_07_ROMANTIC_GARDEN/);
  assert.match(prompt, /GI_VIEW\/MOBILE/);
  assert.match(prompt, /Completion checklist/);
});
