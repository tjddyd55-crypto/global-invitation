import type { InvitationMusicCategory } from '@prisma/client';

export type SharedMusicPresignMeta = {
  contentType: string;
  filename?: string;
  fileSize: number;
  category: InvitationMusicCategory;
};

export type ConfirmSharedMusicInput = {
  objectKey: string;
  title: string;
  category: InvitationMusicCategory;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  durationSeconds?: number | null;
  artistName?: string | null;
  description?: string | null;
  licenseType?: string | null;
  licenseSource?: string | null;
  licenseSourceUrl?: string | null;
  attributionText?: string | null;
  attributionRequired?: boolean;
  commercialUseConfirmed: boolean;
  isActive?: boolean;
  sortOrder?: number;
};

export type AdminTrackFilters = {
  search?: string;
  category?: InvitationMusicCategory;
  isActive?: boolean;
  isArchived?: boolean;
};

export type UpdateTrackInput = Partial<
  Pick<
    ConfirmSharedMusicInput,
    | 'title'
    | 'category'
    | 'durationSeconds'
    | 'artistName'
    | 'description'
    | 'licenseType'
    | 'licenseSource'
    | 'licenseSourceUrl'
    | 'attributionText'
    | 'attributionRequired'
    | 'commercialUseConfirmed'
    | 'isActive'
    | 'sortOrder'
  >
>;

export type ValidatedTrackCreateParams = {
  adminId: string;
  input: ConfirmSharedMusicInput;
  category: InvitationMusicCategory;
  mimeType: string;
  fileSize: number;
  objectKey: string;
  isActive: boolean;
};
