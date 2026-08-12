/**
 * Organization preset apply — Editor action only.
 * Does not mutate render-time; returns patches for organization + music extras.
 */
import type { OrganizationBranding } from '@/src/invitation/conceptTypes';
import {
  getOrganizationPreset,
  normalizeOrganizationPresetId,
  type OrganizationPresetId,
  type OrganizationPresetMusicAsset,
} from '@/src/invitation/organizationPresets';
import type { WeddingEditorExtras } from '@/src/editors/wedding/state/weddingEditor.types';

export type OrganizationPresetMusicSnapshot = Pick<
  WeddingEditorExtras,
  | 'musicEnabled'
  | 'musicSourceType'
  | 'musicTrackId'
  | 'musicKey'
  | 'musicFileUrl'
  | 'musicFileKey'
  | 'musicTitle'
  | 'musicLoop'
  | 'musicStartAtSeconds'
>;

export type ApplyOrganizationPresetInput = {
  presetId: OrganizationPresetId;
  organization: OrganizationBranding;
  music: OrganizationPresetMusicSnapshot;
};

export type ApplyOrganizationPresetResult = {
  organization: OrganizationBranding;
  music: OrganizationPresetMusicSnapshot;
  /** Previous logo before apply (for lifecycle when switching to shared). */
  previousLogo: string;
  appliedAssets: boolean;
};

function musicFromAsset(asset: OrganizationPresetMusicAsset): OrganizationPresetMusicSnapshot {
  return {
    musicEnabled: true,
    musicSourceType: 'SHARED',
    musicTrackId: asset.trackId,
    musicKey: asset.trackId,
    musicFileUrl: asset.objectKey,
    musicFileKey: asset.objectKey,
    musicTitle: asset.title,
    musicLoop: true,
    musicStartAtSeconds: 0,
  };
}

function emptyMusic(preserveLoop: boolean): OrganizationPresetMusicSnapshot {
  return {
    musicEnabled: false,
    musicSourceType: undefined,
    musicTrackId: undefined,
    musicKey: undefined,
    musicFileUrl: undefined,
    musicFileKey: undefined,
    musicTitle: undefined,
    musicLoop: preserveLoop,
    musicStartAtSeconds: 0,
  };
}

function normalizeLogo(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** True when current logo/music already match JCI defaults (no confirm needed). */
export function matchesOrganizationPresetDefaults(
  presetId: OrganizationPresetId,
  organization: OrganizationBranding,
  music: OrganizationPresetMusicSnapshot
): boolean {
  const preset = getOrganizationPreset(presetId);
  if (presetId === 'CUSTOM') {
    return normalizeOrganizationPresetId(organization.presetId) === 'CUSTOM';
  }
  const logo = normalizeLogo(organization.logo);
  const expectedLogo = normalizeLogo(preset.logoKey);
  const trackId = (music.musicTrackId || music.musicKey || '').trim();
  const expectedTrack = preset.defaultMusic?.trackId || '';
  return (
    logo === expectedLogo &&
    Boolean(music.musicEnabled) &&
    trackId === expectedTrack &&
    !normalizeLogo(music.musicFileUrl).startsWith('blob:')
  );
}

/**
 * Apply preset assets.
 * - CUSTOM: only set presetId; keep logo/music
 * - JCI: set presetId + JCI logo + Creed Song 1 (does not touch name/english/accent)
 */
export function applyOrganizationPreset(
  input: ApplyOrganizationPresetInput
): ApplyOrganizationPresetResult {
  const preset = getOrganizationPreset(input.presetId);
  const previousLogo = normalizeLogo(input.organization.logo);
  const baseOrg: OrganizationBranding = {
    ...input.organization,
    presetId: preset.id,
  };

  if (preset.id === 'CUSTOM') {
    return {
      organization: baseOrg,
      music: { ...input.music },
      previousLogo,
      appliedAssets: false,
    };
  }

  const music = preset.defaultMusic
    ? musicFromAsset(preset.defaultMusic)
    : emptyMusic(Boolean(input.music.musicLoop));

  return {
    organization: {
      ...baseOrg,
      logo: preset.logoKey || '',
      // name / englishName / englishFullName / accentColor untouched
    },
    music,
    previousLogo,
    appliedAssets: true,
  };
}
