/**
 * Dry-run audit helper for invitation publish entitlements.
 * Does not mutate data. Intended for development / pre-production review.
 *
 * Usage (from backend/):
 *   npx tsx scripts/audit-invitation-payment-entitlements.ts
 */
import prisma from '../src/lib/prisma';

async function main() {
  const published = await prisma.invitation.count({
    where: { isDeleted: false, status: 'PUBLISHED' },
  });

  const paidRows = await prisma.invitationPayment.findMany({
    where: { status: 'PAID' },
    select: { invitationId: true },
    distinct: ['invitationId'],
  });
  const paidInvitationIds = new Set(paidRows.map((row) => row.invitationId));

  const publishedInvitations = await prisma.invitation.findMany({
    where: { isDeleted: false, status: 'PUBLISHED' },
    select: { id: true, shareSlug: true, isPaid: true },
  });

  const unpaidPublished = publishedInvitations.filter((row) => !paidInvitationIds.has(row.id));

  console.log(
    JSON.stringify(
      {
        totalPublished: published,
        distinctPaidInvitations: paidInvitationIds.size,
        legacyPublishedWithoutPaidRow: unpaidPublished.length,
        sampleUnpaidPublishedIds: unpaidPublished.slice(0, 20).map((row) => row.id),
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
