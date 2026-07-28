import prisma from '../prisma';
import { isUuid } from '../isUuid';
import {
  isSharedInvitationAssetKey,
  parseInvitationUserAssetKey,
} from '../invitationAssetKeys';

const E2E_MEDIA_PREFIX = 'e2e';

function isE2ETestModeEnabled(): boolean {
  return process.env.E2E_TEST_MODE === 'true' && process.env.NODE_ENV !== 'production';
}

export function stripE2EPrefixFromStorageKey(key: string): string {
  const normalized = key.trim().replace(/^\/+/, '');
  if (!normalized.startsWith(`${E2E_MEDIA_PREFIX}/`)) {
    return normalized;
  }
  if (!isE2ETestModeEnabled()) {
    return normalized;
  }
  return normalized.slice(`${E2E_MEDIA_PREFIX}/`.length);
}

function isUuidLike(value: string): boolean {
  return isUuid(value);
}

async function canAccessInvitationMedia(userId: string, invitationIdOrSlug: string): Promise<boolean> {
  if (!invitationIdOrSlug) return false;
  const where = isUuidLike(invitationIdOrSlug)
    ? {
        OR: [{ id: invitationIdOrSlug }, { slug: invitationIdOrSlug }],
        userId,
      }
    : {
        slug: invitationIdOrSlug,
        userId,
      };
  const invitation = await prisma.invitation.findFirst({
    where: {
      ...where,
      isDeleted: false,
    },
    select: { id: true },
  });
  return Boolean(invitation);
}

async function canAccessTemplateMedia(userId: string, entityId: string): Promise<boolean> {
  if (!entityId) return false;

  const submission = await prisma.templateSubmission.findFirst({
    where: {
      id: entityId,
      creatorId: userId,
    },
    select: { id: true },
  });
  if (submission) {
    return true;
  }

  if (!isUuidLike(entityId)) {
    return false;
  }

  const template = await prisma.template.findFirst({
    where: {
      id: entityId,
      creatorId: userId,
    },
    select: { id: true },
  });
  return Boolean(template);
}

/** 템플릿 스토리지 삭제·업로드 권한: 크리에이터 또는 관리자 역할 */
export function isMediaTemplatePrivilegedRole(role: string): boolean {
  return role === 'CREATOR' || role === 'ADMIN';
}

export async function canDeleteByStorageKey(params: {
  userId: string;
  isCreator: boolean;
  key: string;
}): Promise<boolean> {
  const keyForAuthorization = stripE2EPrefixFromStorageKey(params.key);
  const segments = keyForAuthorization.split('/').filter(Boolean);
  if (segments.length < 2) return false;

  // Shared catalog — never deletable via user media DELETE
  if (isSharedInvitationAssetKey(keyForAuthorization)) {
    return false;
  }

  // Canonical + legacy invitation user assets:
  // invitation/{env}/users/{userId}/invitations/{invitationId}/...
  // {env}/invitation/users/...
  // invitation/users/...
  const invitationUserAsset = parseInvitationUserAssetKey(keyForAuthorization);
  if (invitationUserAsset) {
    if (invitationUserAsset.userId !== params.userId) {
      return false;
    }
    return canAccessInvitationMedia(params.userId, invitationUserAsset.invitationId);
  }

  if (segments[0] === 'temp') {
    return false;
  }

  if (segments[0] === 'users') {
    return segments[1] === params.userId;
  }

  if (segments[0] === 'template' && segments.length >= 2) {
    if (!params.isCreator) return false;
    const templateId = segments[1] || '';
    return canAccessTemplateMedia(params.userId, templateId);
  }

  if (segments[0] === 'invitations') {
    const invitationId = segments[1] || '';
    return canAccessInvitationMedia(params.userId, invitationId);
  }

  if (segments[0] === 'templates') {
    if (!params.isCreator) return false;
    if (segments[1] === 'thumbnails') {
      const fileNameOrFolder = segments[2] || '';
      const entityId =
        segments.length > 3
          ? fileNameOrFolder
          : fileNameOrFolder.replace(/\.webp$/i, '').replace(/^thumb_/i, '');
      return canAccessTemplateMedia(params.userId, entityId);
    }
  }

  if (segments[0] === 'creator') {
    if (!params.isCreator) return false;
    const creatorId = segments[1] || '';
    const entityId = segments[2] || '';
    const assetsSegment = segments[3] || '';
    if (assetsSegment !== 'assets') {
      return false;
    }
    if (creatorId !== params.userId) return false;
    return canAccessTemplateMedia(params.userId, entityId);
  }

  if (segments[0] === 'invitation') {
    if (
      segments.length >= 3 &&
      segments[1] &&
      (segments[2] === 'hero' || segments[2] === 'gallery') &&
      segments[1] !== 'temp' &&
      segments[1] !== 'hero' &&
      segments[1] !== 'gallery' &&
      segments[1] !== 'invitations' &&
      segments[1] !== 'templates'
    ) {
      const invitationId = segments[1] || '';
      return canAccessInvitationMedia(params.userId, invitationId);
    }
    if (segments[1] === 'hero' || segments[1] === 'gallery') {
      const invitationId = segments[2] || '';
      return canAccessInvitationMedia(params.userId, invitationId);
    }
    if (segments[1] === 'invitations') {
      const invitationId = segments[2] || '';
      return canAccessInvitationMedia(params.userId, invitationId);
    }
    if (segments[1] === 'templates' && segments.length >= 4) {
      if (!params.isCreator) return false;
      const templateId = segments[2] || '';
      return canAccessTemplateMedia(params.userId, templateId);
    }
    if (segments[1] === 'thumbnails') {
      if (!params.isCreator) return false;
      const file = segments[2] || '';
      const mainMatch = /^([a-zA-Z0-9_-]+)\.jpg$/i.exec(file);
      const companionMatch = /^thumb_([a-zA-Z0-9_-]+)\.jpg$/i.exec(file);
      const entityId = (mainMatch && !file.startsWith('thumb_') ? mainMatch[1] : null) || companionMatch?.[1] || '';
      return canAccessTemplateMedia(params.userId, entityId);
    }
  }

  return false;
}
