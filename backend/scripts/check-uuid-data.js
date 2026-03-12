require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function run() {
  const [badUsers, badCreatorIds, orphanCreatorIds] = await Promise.all([
    prisma.$queryRawUnsafe(
      "SELECT COUNT(*)::int AS count FROM users WHERE id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'"
    ),
    prisma.$queryRawUnsafe(
      "SELECT COUNT(*)::int AS count FROM templates WHERE creator_id IS NOT NULL AND creator_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'"
    ),
    prisma.$queryRawUnsafe(
      'SELECT COUNT(*)::int AS count FROM templates t LEFT JOIN users u ON u.id::text = t.creator_id::text WHERE t.creator_id IS NOT NULL AND u.id IS NULL'
    ),
  ]);

  const [sampleBadCreatorIds, sampleBadUsers] = await Promise.all([
    prisma.$queryRawUnsafe(
      "SELECT id::text AS template_id, creator_id::text AS creator_id FROM templates WHERE creator_id IS NOT NULL AND creator_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' ORDER BY created_at DESC LIMIT 20"
    ),
    prisma.$queryRawUnsafe(
      "SELECT id::text AS user_id FROM users WHERE id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' LIMIT 20"
    ),
  ]);

  console.log(
    JSON.stringify(
      {
        badUsers: badUsers[0],
        badCreatorIds: badCreatorIds[0],
        orphanCreatorIds: orphanCreatorIds[0],
        sampleBadCreatorIds,
        sampleBadUsers,
      },
      null,
      2
    )
  );
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
