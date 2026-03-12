require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function run() {
  const badTemplatesBefore = await prisma.$queryRawUnsafe(
    "SELECT COUNT(*)::int AS count FROM templates WHERE creator_id IS NOT NULL AND creator_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'"
  );
  const badUsersBefore = await prisma.$queryRawUnsafe(
    "SELECT COUNT(*)::int AS count FROM users WHERE id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'"
  );

  const resetTemplateCreatorId = await prisma.$executeRawUnsafe(
    "UPDATE templates SET creator_id = NULL WHERE creator_id IS NOT NULL AND creator_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'"
  );
  const deleteInvalidUsers = await prisma.$executeRawUnsafe(
    "DELETE FROM users WHERE id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'"
  );

  const badTemplatesAfter = await prisma.$queryRawUnsafe(
    "SELECT COUNT(*)::int AS count FROM templates WHERE creator_id IS NOT NULL AND creator_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'"
  );
  const badUsersAfter = await prisma.$queryRawUnsafe(
    "SELECT COUNT(*)::int AS count FROM users WHERE id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'"
  );

  console.log(
    JSON.stringify(
      {
        badTemplatesBefore: badTemplatesBefore[0],
        badUsersBefore: badUsersBefore[0],
        resetTemplateCreatorId,
        deleteInvalidUsers,
        badTemplatesAfter: badTemplatesAfter[0],
        badUsersAfter: badUsersAfter[0],
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
