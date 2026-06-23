import { PrismaClient } from "../app/generated/prisma-new";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    include: {
      accounts: true,
      syncLogs: {
        take: 5,
        orderBy: { playedAt: "desc" },
        include: { track: true }
      }
    }
  });

  if (!user) {
    console.log("No user found");
    return;
  }

  console.log(`User: ${user.name} (${user.email})`);
  console.log(`Last Synced At: ${user.lastSyncedAt}`);
  console.log(`SyncLog Count: ${await prisma.syncLog.count({ where: { userId: user.id } })}`);
  console.log(`Top 5 SyncLogs:`);
  console.log(JSON.stringify(user.syncLogs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
