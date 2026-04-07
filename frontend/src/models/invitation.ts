export interface Invitation {
  id: string;
  slug: string;
  shareSlug?: string | null;
  templateType?: 'FULL';
  conceptType?: 'WEDDING' | 'FUNERAL' | 'GENERAL';
  templateId?: string | null;
  title?: string | null;
  eventDate?: string | null;
  locationText?: string | null;
  message?: string | null;
  templateKey: string;
  data?: unknown;
  dataJson?: unknown;
  createdBy?: string;
  isPublished?: boolean;
  musicKey?: string | null;
  countryCode: string;
  language: string;
  status: string;
  isPaid: boolean;
  canShare: boolean;
  paidAt?: string | null;
  publishedAt?: string | null;
  isOwner?: boolean;
  createdAt: string;
  updatedAt: string;
}
