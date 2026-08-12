/**
 * Organization create payload — Template vs Preset separation.
 * JCI template: visualTemplateId + preset JCI assets only (no sample names/event).
 * Official: CUSTOM preset, empty logo, music off.
 *
 * Lives under invitation/ (not editors/) to keep layer boundaries.
 */
import { DEFAULT_BRAND_ACCENT_COLOR } from '@/src/invitation/conceptTypes';
import { getOrganizationPreset } from '@/src/invitation/organizationPresets';
import type { VisualTemplateId } from '@/src/templates/visualTemplate/ids';
import { ORGANIZATION_JCI_THEME } from '@/src/templates/organizationJci/organizationJciTheme';

export function buildOrganizationCreateData(
  visualTemplateId: VisualTemplateId
): Record<string, unknown> {
  if (visualTemplateId === 'ORGANIZATION_02_JCI') {
    const preset = getOrganizationPreset('JCI');
    const musicAsset = preset.defaultMusic;

    return {
      conceptType: 'ORGANIZATION',
      visualTemplateId: 'ORGANIZATION_02_JCI',
      templateType: 'FULL',
      organization: {
        presetId: 'JCI',
        name: '',
        englishName: '',
        englishFullName: '',
        logo: preset.logoKey || '',
        accentColor: ORGANIZATION_JCI_THEME.blue,
      },
      music: musicAsset
        ? {
            enabled: true,
            sourceType: 'SHARED',
            trackId: musicAsset.trackId,
            musicKey: musicAsset.trackId,
            fileUrl: musicAsset.objectKey,
            fileKey: musicAsset.objectKey,
            title: musicAsset.title,
            loop: true,
            startAtSeconds: 0,
          }
        : { enabled: false, loop: true },
    };
  }

  return {
    conceptType: 'ORGANIZATION',
    visualTemplateId: 'ORGANIZATION_01_OFFICIAL',
    templateType: 'FULL',
    organization: {
      presetId: 'CUSTOM',
      name: '',
      englishName: '',
      englishFullName: '',
      logo: '',
      accentColor: DEFAULT_BRAND_ACCENT_COLOR,
    },
    music: {
      enabled: false,
      loop: true,
    },
  };
}
