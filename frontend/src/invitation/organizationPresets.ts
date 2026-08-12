/**
 * Organization brand presets — assets-only defaults (logo + music).
 * Render uses saved organization.logo / music fields, not presetId.
 * See docs/ORGANIZATION_PRESETS.md
 */
import { ORGANIZATION_SAMPLE_LOGO } from '@/src/templates/visualTemplate/templateSampleAssets';
import { ORGANIZATION_SAMPLE_MUSIC } from '@/src/templates/visualTemplate/organizationSharedMusicSample';

export const ORGANIZATION_PRESET_IDS = ['CUSTOM', 'JCI'] as const;

export type OrganizationPresetId = (typeof ORGANIZATION_PRESET_IDS)[number];

export type OrganizationPresetMusicAsset = {
  logicalId: string;
  title: string;
  trackId: string;
  objectKey: string;
};

export type OrganizationPresetDefinition = {
  id: OrganizationPresetId;
  label: string;
  description?: string;
  /** Shared R2 object key — never copy to user path */
  logoKey: string | null;
  defaultMusic: OrganizationPresetMusicAsset | null;
  recommendedMusic: OrganizationPresetMusicAsset[];
};

/** Development-registered InvitationMusicTrack (idempotent publish). */
export const JCI_CREED_SONG_ASSET: OrganizationPresetMusicAsset = {
  logicalId: ORGANIZATION_SAMPLE_MUSIC.logicalId,
  title: ORGANIZATION_SAMPLE_MUSIC.title,
  trackId: ORGANIZATION_SAMPLE_MUSIC.trackId,
  objectKey: ORGANIZATION_SAMPLE_MUSIC.objectKey,
};

export const JCI_CREED_SONG_2_ASSET: OrganizationPresetMusicAsset = {
  logicalId: 'JCI_CREED_SONG_2',
  title: 'JCI Creed Song 2',
  trackId: '8efa323b-de7e-415d-96b1-94738431f254',
  objectKey: 'invitation/shared/music/general/8f92cd5b-c174-4386-aa8d-f507e667ba71.mp3',
};

export const ORGANIZATION_PRESETS: Record<OrganizationPresetId, OrganizationPresetDefinition> = {
  CUSTOM: {
    id: 'CUSTOM',
    label: '직접 설정',
    description: '내 로고와 음악 사용',
    logoKey: null,
    defaultMusic: null,
    recommendedMusic: [],
  },
  JCI: {
    id: 'JCI',
    label: 'JCI',
    description: 'JCI 로고 · 추천 음악',
    logoKey: ORGANIZATION_SAMPLE_LOGO,
    defaultMusic: JCI_CREED_SONG_ASSET,
    recommendedMusic: [JCI_CREED_SONG_ASSET, JCI_CREED_SONG_2_ASSET],
  },
};

export function listOrganizationPresets(): OrganizationPresetDefinition[] {
  return ORGANIZATION_PRESET_IDS.map((id) => ORGANIZATION_PRESETS[id]);
}

export function getOrganizationPreset(id: unknown): OrganizationPresetDefinition {
  if (id === 'JCI') return ORGANIZATION_PRESETS.JCI;
  return ORGANIZATION_PRESETS.CUSTOM;
}

export function isOrganizationPresetId(value: unknown): value is OrganizationPresetId {
  return value === 'CUSTOM' || value === 'JCI';
}

export function normalizeOrganizationPresetId(value: unknown): OrganizationPresetId {
  return isOrganizationPresetId(value) ? value : 'CUSTOM';
}
