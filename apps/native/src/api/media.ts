import { apiRequest, apiUpload } from '@/src/api/client';

type PresignResponse = {
  stagingObjectKey: string;
  objectKey: string;
  uploadUrl: string;
  publicUrl: string;
  expiresIn: number;
  usage: string;
};

type ConfirmResponse = {
  publicUrl: string;
  objectKey: string;
  url: string;
};

export async function uploadInvitationImage(input: {
  invitationId: string;
  fileUri: string;
  contentType: string;
  fileSize: number;
  scope: 'invitationHero' | 'invitationGallery';
}): Promise<string> {
  const usage =
    input.scope === 'invitationHero' ? 'INVITATION_HERO' : 'INVITATION_GALLERY';

  const presign = await apiRequest<PresignResponse>('/api/media/presign', {
    method: 'POST',
    body: {
      scope: input.scope,
      invitationId: input.invitationId,
      contentType: input.contentType,
      size: input.fileSize,
    },
  });

  await apiUpload(presign.uploadUrl, input.fileUri, input.contentType);

  const confirmed = await apiRequest<ConfirmResponse>('/api/media/confirm', {
    method: 'POST',
    body: {
      stagingObjectKey: presign.stagingObjectKey,
      objectKey: presign.objectKey,
      publicUrl: presign.publicUrl,
      contentType: input.contentType,
      size: input.fileSize,
      usage,
      invitationId: input.invitationId,
    },
  });

  return confirmed.publicUrl || confirmed.url;
}
