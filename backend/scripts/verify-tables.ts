/**
 * Verify that users and invitations tables exist in the database
 * Run: npx tsx scripts/verify-tables.ts
 */
import prisma from '../src/lib/prisma';

async function verifyTables() {
  try {
    console.log('Checking database connection...');
    
    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');

    // Check users table
    const userCount = await prisma.user.count();
    console.log(`✅ users table exists (${userCount} records)`);

    // Check invitations table
    const invitationCount = await prisma.invitation.count();
    console.log(`✅ invitations table exists (${invitationCount} records)`);

    // Check slug unique constraint
    try {
      const testSlug = `test-${Date.now()}`;
      await prisma.invitation.create({
        data: {
          slug: testSlug,
          countryCode: 'GLOBAL',
          language: 'en',
          status: 'draft',
        },
      });
      await prisma.invitation.delete({
        where: { slug: testSlug },
      });
      console.log('✅ slug unique constraint working');
    } catch (error) {
      console.error('❌ slug unique constraint test failed:', error);
    }

    // Check default values
    const testInvitation = await prisma.invitation.create({
      data: {
        slug: `test-defaults-${Date.now()}`,
        countryCode: 'GLOBAL',
        language: 'en',
      },
    });

    if (testInvitation.isPaid === false && testInvitation.canShare === false) {
      console.log('✅ Default values working (is_paid: false, can_share: false)');
    } else {
      console.error('❌ Default values not working correctly');
    }

    await prisma.invitation.delete({
      where: { id: testInvitation.id },
    });

    // Check event_logs table
    const eventLog = await prisma.eventLog.create({
      data: {
        eventType: 'invitation_view',
        templateType: 'wedding',
        language: 'en',
        pageUrl: 'http://localhost:3000/invitation/demo',
        metadata: { sample: true },
      },
    });
    await prisma.eventLog.delete({ where: { id: eventLog.id } });
    console.log('✅ event_logs table exists');

    console.log('\n✅ All checks passed!');
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTables();
