import type { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

export type AdminAuditAction =
  | 'template_create'
  | 'template_update'
  | 'template_delete'
  | 'admin_login'
  | 'rsvp_delete'
  | 'rsvp_message_hide'
  | 'rsvp_message_show'
  | 'submission_created'
  | 'submission_submitted'
  | 'submission_approved'
  | 'submission_rejected';

type AdminAuditTargetType = 'template' | 'admin' | 'rsvp' | 'template_submission';

export async function logAdminAction(params: {
  adminId: string;
  action: AdminAuditAction;
  targetType: AdminAuditTargetType;
  targetId?: string | null;
  payload?: Prisma.InputJsonValue;
}) {
  const { adminId, action, targetType, targetId, payload } = params;

  await prisma.adminAuditLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId: targetId || null,
      payload: payload === undefined ? undefined : payload,
    },
  });
}
