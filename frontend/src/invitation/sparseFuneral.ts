import type { FuneralInvitationData } from '@/src/invitation/schemas';
import { copyRuntimeInvitationLocale } from '@/src/invitation/runtimeLocale';

function textOrEmpty(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * create/factory dataJson may only have conceptType=FUNERAL + title/date.
 * Build a FuneralClassic-compatible payload without Korean sample fixtures.
 */
export function toSparseFuneralLike(data: Record<string, unknown>): FuneralInvitationData {
  const hall = asRecord(data.funeralHall);
  const schedule = asRecord(data.schedule);
  const contact = asRecord(data.contact);
  const eventDate =
    textOrEmpty(data.deathDate) || textOrEmpty(schedule.funeralDate) || textOrEmpty(data.eventDate);
  const location =
    textOrEmpty(hall.name) || textOrEmpty(data.venueName) || textOrEmpty(data.locationText);
  const address = textOrEmpty(hall.address) || textOrEmpty(data.address) || textOrEmpty(data.locationText);
  const familyMembers = Array.isArray(data.familyMembers)
    ? data.familyMembers.filter((item): item is string => typeof item === 'string')
    : undefined;

  return copyRuntimeInvitationLocale(
    {
      templateType: 'FULL',
      conceptType: 'FUNERAL',
      templateKey: 'invitation_full',
      deceasedName: textOrEmpty(data.deceasedName) || textOrEmpty(data.title),
      birthDate: textOrEmpty(data.birthDate) || undefined,
      deathDate: textOrEmpty(data.deathDate) || eventDate,
      chiefMourner: textOrEmpty(data.chiefMourner),
      familyMembers,
      message: textOrEmpty(data.message) || textOrEmpty(data.content),
      funeralHall: {
        name: location,
        address,
        mapImage: textOrEmpty(hall.mapImage) || textOrEmpty(data.mapImage) || undefined,
        mapLat: typeof hall.mapLat === 'number' ? hall.mapLat : undefined,
        mapLng: typeof hall.mapLng === 'number' ? hall.mapLng : undefined,
      },
      schedule: {
        wakeStart: textOrEmpty(schedule.wakeStart) || undefined,
        funeralDate: textOrEmpty(schedule.funeralDate) || eventDate,
        burial: textOrEmpty(schedule.burial) || undefined,
      },
      contact:
        textOrEmpty(contact.name) || textOrEmpty(contact.phone)
          ? { name: textOrEmpty(contact.name), phone: textOrEmpty(contact.phone) }
          : undefined,
      heroImage: textOrEmpty(data.heroImage) || undefined,
    },
    data
  ) as FuneralInvitationData;
}
