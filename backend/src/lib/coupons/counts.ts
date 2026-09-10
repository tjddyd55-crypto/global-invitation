import { InvitationCouponUsageStatus, type Prisma } from '@prisma/client';
import { ACTIVE_USAGE_STATUSES } from './eligibility';

type CountClient = {
  invitationCouponUsage: {
    count: (args: Prisma.InvitationCouponUsageCountArgs) => Promise<number>;
  };
};

export async function countActiveCouponUsages(
  client: CountClient,
  couponId: string
): Promise<number> {
  return client.invitationCouponUsage.count({
    where: { couponId, status: { in: ACTIVE_USAGE_STATUSES } },
  });
}

export async function countActiveCouponUsagesForUser(
  client: CountClient,
  couponId: string,
  userId: string | null
): Promise<number> {
  if (!userId) return 0;
  return client.invitationCouponUsage.count({
    where: { couponId, userId, status: { in: ACTIVE_USAGE_STATUSES } },
  });
}

export async function countAnyCouponUsages(client: CountClient, couponId: string): Promise<number> {
  return client.invitationCouponUsage.count({ where: { couponId } });
}

export function isConsumingUsageStatus(status: InvitationCouponUsageStatus): boolean {
  return (
    status === InvitationCouponUsageStatus.RESERVED ||
    status === InvitationCouponUsageStatus.REDEEMED
  );
}
