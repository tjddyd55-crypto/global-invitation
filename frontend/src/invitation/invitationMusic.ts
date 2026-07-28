/**
 * 초대장 배경 음악 SSOT.
 * 기본 OFF. enabled=true 이고 유효한 소스가 있을 때만 플레이어 표시.
 */

export type InvitationMusicSettings = {
  enabled: boolean;
  /** 내장 카탈로그 키 (선택) */
  musicKey?: string;
  /** 사용자 업로드 또는 외부 URL */
  fileUrl?: string;
  fileKey?: string;
  title?: string;
  loop?: boolean;
  startAtSeconds?: number;
};

export type ResolvedInvitationMusic = {
  src: string;
  title: string;
  loop: boolean;
  startAtSeconds: number;
};

export const DEFAULT_INVITATION_MUSIC: InvitationMusicSettings = {
  enabled: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

export function normalizeInvitationMusic(value: unknown): InvitationMusicSettings {
  if (!isRecord(value)) {
    return { ...DEFAULT_INVITATION_MUSIC };
  }
  const enabled = value.enabled === true;
  const musicKey = typeof value.musicKey === 'string' ? value.musicKey.trim() : '';
  const fileUrl = typeof value.fileUrl === 'string' ? value.fileUrl.trim() : '';
  const fileKey = typeof value.fileKey === 'string' ? value.fileKey.trim() : '';
  const title = typeof value.title === 'string' ? value.title.trim() : '';
  const loop = value.loop === true;
  const startRaw = value.startAtSeconds;
  const startAtSeconds =
    typeof startRaw === 'number' && Number.isFinite(startRaw) && startRaw >= 0
      ? Math.floor(startRaw)
      : 0;

  return {
    enabled,
    musicKey: musicKey || undefined,
    fileUrl: fileUrl || undefined,
    fileKey: fileKey || undefined,
    title: title || undefined,
    loop,
    startAtSeconds,
  };
}

/**
 * 재생 가능 여부 — 명시적 enabled=true + 유효 URL/카탈로그만.
 * 레거시 musicKey 단독·샘플 기본값은 노출하지 않는다.
 */
export function resolvePlayableInvitationMusic(
  runtimeData: unknown,
  resolveCatalogSrc: (musicKey: string) => { src: string; title: string } | undefined
): ResolvedInvitationMusic | null {
  const musicFromData = isRecord(runtimeData) ? normalizeInvitationMusic(runtimeData.music) : DEFAULT_INVITATION_MUSIC;
  if (!musicFromData.enabled) {
    return null;
  }

  if (musicFromData.fileUrl) {
    return {
      src: musicFromData.fileUrl,
      title: musicFromData.title || '배경 음악',
      loop: Boolean(musicFromData.loop),
      startAtSeconds: musicFromData.startAtSeconds ?? 0,
    };
  }

  if (musicFromData.musicKey) {
    const catalog = resolveCatalogSrc(musicFromData.musicKey);
    if (catalog) {
      return {
        src: catalog.src,
        title: musicFromData.title || catalog.title,
        loop: Boolean(musicFromData.loop),
        startAtSeconds: musicFromData.startAtSeconds ?? 0,
      };
    }
  }

  return null;
}
