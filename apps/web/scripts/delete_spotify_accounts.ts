import { PrismaClient } from "../app/generated/prisma";
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.account.deleteMany({
    where: { provider: 'spotify' }
  });
  console.log(`Deleted ${result.count} Spotify accounts. You can now login again for fresh scopes.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
