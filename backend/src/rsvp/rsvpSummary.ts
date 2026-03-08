export type RsvpSummaryInput = {
  attendance: string;
  guestCount: number;
};

export type RsvpSummary = {
  totalGuests: number;
  totalPeople: number;
  attendingPeople: number;
  declinedPeople: number;
  maybePeople: number;
};

export function buildRsvpSummary(guests: RsvpSummaryInput[]): RsvpSummary {
  return guests.reduce<RsvpSummary>(
    (acc, guest) => {
      acc.totalGuests += 1;
      acc.totalPeople += guest.guestCount;

      if (guest.attendance === 'yes') {
        acc.attendingPeople += guest.guestCount;
      }
      if (guest.attendance === 'no') {
        acc.declinedPeople += guest.guestCount;
      }
      if (guest.attendance === 'maybe') {
        acc.maybePeople += guest.guestCount;
      }

      return acc;
    },
    {
      totalGuests: 0,
      totalPeople: 0,
      attendingPeople: 0,
      declinedPeople: 0,
      maybePeople: 0,
    }
  );
}
