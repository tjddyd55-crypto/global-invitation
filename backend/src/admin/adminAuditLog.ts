import type { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

export type AdminAuditAction =
  | 'template_create'
  | 'template_update'
  | 'template_delete'
  | 'admin_login';

type AdminAuditTargetType = 'template' | 'admin';

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
