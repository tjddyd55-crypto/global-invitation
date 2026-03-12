const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const enums = await prisma.$queryRawUnsafe(
    "SELECT typname FROM pg_type WHERE typtype='e' ORDER BY typname"
  );
  console.log(JSON.stringify(enums, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
