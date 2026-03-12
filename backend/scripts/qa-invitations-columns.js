const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const columns = await prisma.$queryRawUnsafe(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='invitations' ORDER BY ordinal_position"
  );
  console.log(JSON.stringify(columns, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
