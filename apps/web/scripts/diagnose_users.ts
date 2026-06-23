/**
 * 診斷腳本：查看兩個重要使用者的歌曲 previewUrl 狀態
 */
import { PrismaClient } from "../app/generated/prisma-new";
const prisma = new PrismaClient();

async function main() {
  const targetEmails = ["aaronlee0715@gmail.com", "411121217@gms.ndhu.edu.tw"];

  for (const email of targetEmails) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        playlists: {
          include: {
            tracks: { include: { track: true }, orderBy: { order: "asc" } }
          }
        },
        accounts: { select: { provider: true, access_token: true, refresh_token: true, expires_at: true } }
      }
    });

    if (!user) { console.log(`❌ User ${email} not found`); continue; }

    console.log(`\n👤 ${user.name} (${email})`);
    const spotifyAcc = user.accounts.find(a => a.provider === "spotify");
    if (spotifyAcc) {
      const isExpired = spotifyAcc.expires_at ? Date.now() >= (spotifyAcc.expires_at - 60) * 1000 : true;
      console.log(`   Spotify Token: ${isExpired ? "⚠️  EXPIRED" : "✅ valid"} | refresh_token: ${spotifyAcc.refresh_token ? "✅ exists" : "❌ missing"}`);
    } else {
      console.log(`   Spotify: ❌ not linked`);
    }

    for (const pl of user.playlists) {
      console.log(`\n   📋 "${pl.name}" (${pl.tracks.length} tracks)`);
      for (const pt of pl.tracks) {
        const url = pt.track.previewUrl;
        let status = "❌ null";
        if (url?.includes("soundhelix")) status = "🔴 SOUNDHELIX (fake)";
        else if (url?.includes("163.com")) status = "🟡 NetEase";
        else if (url?.includes("p.scdn.co") || url?.includes("audio-")) status = "✅ Spotify CDN";
        else if (url) status = `🟢 ${url.substring(0, 50)}`;
        console.log(`      [${pt.order}] ${pt.track.title} — ${status}`);
      }
    }
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
