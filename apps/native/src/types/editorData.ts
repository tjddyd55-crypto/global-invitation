import type { ConceptType } from '@/src/api/invitations';

export type MapProvider = 'google' | 'naver';

export type EditorDataJson = {
  conceptType?: ConceptType;
  visualTemplateId?: string;
  title?: string;
  eventDate?: string;
  message?: string;
  heroImage?: string;
  groomName?: string;
  brideName?: string;
  groomFather?: string;
  groomMother?: string;
  brideFather?: string;
  brideMother?: string;
  gallery?: Array<{ id: string; url: string }>;
  location?: {
    mapProvider?: MapProvider;
    venueName?: string;
    address?: string;
    lat?: string;
    lng?: string;
    transport?: string;
    parking?: string;
  };
  accounts?: Array<{ id: string; role: string; bank: string; number: string; holder: string }>;
  rsvp?: { enabled?: boolean; message?: string };
  music?: { enabled?: boolean; trackId?: string; trackTitle?: string };
};

export function parseEditorData(raw: unknown): EditorDataJson {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const data = raw as Record<string, unknown>;

  const locationRaw = data.location;
  const location =
    locationRaw && typeof locationRaw === 'object' && !Array.isArray(locationRaw)
      ? (locationRaw as EditorDataJson['location'])
      : undefined;

  const galleryRaw = data.gallery;
  const gallery = Array.isArray(galleryRaw)
    ? galleryRaw
        .filter((item) => item && typeof item === 'object')
        .map((item, index) => {
          const row = item as Record<string, unknown>;
          return {
            id: String(row.id ?? `gallery-${index}`),
            url: String(row.url ?? row.src ?? ''),
          };
        })
        .filter((item) => item.url)
    : undefined;

  const accountsRaw = data.accounts;
  const accounts = Array.isArray(accountsRaw)
    ? accountsRaw
        .filter((item) => item && typeof item === 'object')
        .map((item, index) => {
          const row = item as Record<string, unknown>;
          return {
            id: String(row.id ?? `account-${index}`),
            role: String(row.role ?? ''),
            bank: String(row.bank ?? ''),
            number: String(row.number ?? ''),
            holder: String(row.holder ?? ''),
          };
        })
    : undefined;

  const rsvpRaw = data.rsvp;
  const rsvp =
    rsvpRaw && typeof rsvpRaw === 'object' && !Array.isArray(rsvpRaw)
      ? (rsvpRaw as EditorDataJson['rsvp'])
      : undefined;

  const musicRaw = data.music;
  const music =
    musicRaw && typeof musicRaw === 'object' && !Array.isArray(musicRaw)
      ? (musicRaw as EditorDataJson['music'])
      : undefined;

  return {
    conceptType: data.conceptType as ConceptType | undefined,
    visualTemplateId: typeof data.visualTemplateId === 'string' ? data.visualTemplateId : undefined,
    title: typeof data.title === 'string' ? data.title : undefined,
    eventDate: typeof data.eventDate === 'string' ? data.eventDate : undefined,
    message: typeof data.message === 'string' ? data.message : typeof data.greeting === 'string' ? data.greeting : undefined,
    heroImage:
      typeof data.heroImage === 'string'
        ? data.heroImage
        : typeof data.hero === 'object' && data.hero && typeof (data.hero as { url?: string }).url === 'string'
          ? (data.hero as { url: string }).url
          : undefined,
    groomName: typeof data.groomName === 'string' ? data.groomName : undefined,
    brideName: typeof data.brideName === 'string' ? data.brideName : undefined,
    groomFather: typeof data.groomFather === 'string' ? data.groomFather : undefined,
    groomMother: typeof data.groomMother === 'string' ? data.groomMother : undefined,
    brideFather: typeof data.brideFather === 'string' ? data.brideFather : undefined,
    brideMother: typeof data.brideMother === 'string' ? data.brideMother : undefined,
    gallery,
    location,
    accounts,
    rsvp,
    music,
  };
}

export function mergeEditorPatch(
  current: EditorDataJson,
  patch: Partial<EditorDataJson>,
): EditorDataJson {
  return {
    ...current,
    ...patch,
    location: patch.location ? { ...current.location, ...patch.location } : current.location,
    rsvp: patch.rsvp ? { ...current.rsvp, ...patch.rsvp } : current.rsvp,
    music: patch.music ? { ...current.music, ...patch.music } : current.music,
  };
}
