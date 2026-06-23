import { PrismaClient } from "../app/generated/prisma";
const prisma = new PrismaClient();

async function main() {
  console.log("📊 === 診斷 Swipes 與 MatchRooms ===\n");

  const swipes = await prisma.userSwipe.findMany({
    include: {
      swiper: { select: { email: true } },
      target: { select: { email: true } },
    }
  });

  console.log(` Swipes 總量: ${swipes.length}`);
  swipes.forEach(s => {
    console.log(`   [${s.createdAt.toISOString()}] swiper: ${s.swiper.email} --(${s.action})--> target: ${s.target.email}`);
  });

  const rooms = await prisma.matchRoom.findMany({
    include: {
      user1: { select: { email: true } },
      user2: { select: { email: true } },
    }
  });

  console.log(`\n MatchRooms 總量: ${rooms.length}`);
  rooms.forEach(r => {
    console.log(`   [${r.createdAt.toISOString()}] status: ${r.status} | ${r.user1.email} <--> ${r.user2.email}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
