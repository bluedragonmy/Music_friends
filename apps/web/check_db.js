const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.account.findMany({
    where: { provider: 'spotify' },
    include: { user: true }
  });
  console.log("Spotify Accounts:");
  accounts.forEach(acc => {
    console.log(`- User: ${acc.user.email}`);
    console.log(`  Access Token exists: ${!!acc.access_token}`);
    if (acc.access_token) {
      console.log(`  Access Token preview: ${acc.access_token.substring(0, 10)}...`);
    }
    console.log(`  Scope: ${acc.scope}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
