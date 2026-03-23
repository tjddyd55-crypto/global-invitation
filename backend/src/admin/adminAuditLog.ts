import type { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

/** 알려진 액션 (문자열로 확장 가능) */
export type AdminAuditAction =
  | 'template_create'
  | 'template_update'
  | 'template_delete'
  | 'admin_login'
  | 'super_admin_login'
  | 'rsvp_delete'
  | 'rsvp_message_hide'
  | 'rsvp_message_show'
  | 'submission_created'
  | 'submission_submitted'
  | 'submission_approved'
  | 'submission_rejected'
  | 'credit_policy_update'
  | 'credit_package_create'
  | 'credit_package_update'
  | 'credit_adjust'
  | 'credit_bulk_grant';

type AdminAuditTargetType = 'template' | 'admin' | 'rsvp' | 'template_submission' | 'credit_policy' | 'credit_package' | 'user' | 'bulk';

export async function logAdminAction(params: {
  adminId: string;
  action: AdminAuditAction | string;
  targetType: AdminAuditTargetType | string;
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
