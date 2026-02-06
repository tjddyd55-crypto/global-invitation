export interface Invitation {
  id: string;
  slug: string;
  title?: string | null;
  eventDate?: string | null;
  locationText?: string | null;
  message?: string | null;
  templateKey: string;
  musicKey?: string | null;
  countryCode: string;
  language: string;
  status: string;
  isPaid: boolean;
  canShare: boolean;
  paidAt?: string | null;
  isOwner?: boolean;
  createdAt: string;
  updatedAt: string;
}
