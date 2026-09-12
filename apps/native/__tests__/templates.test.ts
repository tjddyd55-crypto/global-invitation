import { mapVisualCatalogItem } from '@/src/api/templates';

describe('mapVisualCatalogItem', () => {
  it('uses templateKey as id for invitation create API', () => {
    const mapped = mapVisualCatalogItem({
      templateKey: 'WEDDING_01_CLASSIC',
      concept: 'WEDDING',
      displayName: '클래식',
      description: '설명',
      thumbnailUrl: 'https://example.com/thumb.webp',
      previewUrl: null,
    });

    expect(mapped.id).toBe('WEDDING_01_CLASSIC');
    expect(mapped.templateKey).toBe('WEDDING_01_CLASSIC');
    expect(mapped.title).toBe('클래식');
  });
});
