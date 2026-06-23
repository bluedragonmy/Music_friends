import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MatchStatus } from "@/app/generated/prisma";

// 候選人的回傳結構（含相似度分數）
type CandidateUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  playlists: {
    id: string;
    name: string;
    tracks: {
      order: number | null;
      track: {
        id: string;
        title: string;
        artist: string;
        album: string | null;
        coverImg: string | null;
        duration: number;
        url: string;
      };
    }[];
  }[];
  similarityScore?: number; // 僅在 similar 模式下存在
};

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 解析查詢參數 mode（預設為 random）與額外排除名單 exclude
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") === "similar" ? "similar" : "random";
    const excludeParam = searchParams.get("exclude") || "";
    const clientExcludeIds = excludeParam ? excludeParam.split(",").filter(Boolean) : [];

    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { playlists: { select: { id: true } } }
    });
    if (!me) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (me.playlists.length === 0) {
      return NextResponse.json({ error: "No playlist", needsOnboarding: true }, { status: 400 });
    }

    // ── 步驟 1：建立排除清單 ──────────────────────────────────────────

    // 已滑過的對象
    const alreadySwiped = await prisma.userSwipe.findMany({
      where: { swiperId: me.id },
      select: { targetId: true },
    });
    const swipedIds = alreadySwiped.map((s) => s.targetId);

    // 已在配對房間中的對象
    const activeRooms = await prisma.matchRoom.findMany({
      where: {
        OR: [{ user1Id: me.id }, { user2Id: me.id }],
        status: { in: [MatchStatus.ACTIVE, MatchStatus.MATCHED] },
      },
      select: { user1Id: true, user2Id: true },
    });
    const matchedIds = activeRooms.flatMap((r) =>
      [r.user1Id, r.user2Id].filter((id) => id !== me.id)
    );

    // 排除開發測試用的特定帳號，維持展示畫面的純淨度（僅呈現 100 名隨機測試者）
    const devEmails = [
      "demo@vibe.com",
      "test@vibe.com",
      "mr.potato945@gmail.com",
      "aaronlee0715@gmail.com",
      "411121217@gms.ndhu.edu.tw",
    ];
    const devUsers = await prisma.user.findMany({
      where: { email: { in: devEmails } },
      select: { id: true },
    });
    const devUserIds = devUsers.map((u) => u.id);

    // 合併排除清單
    const excludeIds = [...new Set([me.id, ...swipedIds, ...matchedIds, ...clientExcludeIds, ...devUserIds])];

    // ── 步驟 2：依模式撈取候選人 ─────────────────────────────────────

    // 共用的 select 結構
    const userSelect = {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      playlists: {
        orderBy: { updatedAt: "desc" as const },
        select: {
          id: true,
          name: true,
          tracks: {
            include: { track: true },
            orderBy: { order: "asc" as const },
          },
        },
      },
    };

    let candidates: CandidateUser[];

    if (mode === "random") {
      // ── Random 模式：直接撈取，不排序 ──────────────────────────────
      candidates = await prisma.user.findMany({
        where: {
          id: { notIn: excludeIds },
          playlists: { some: { tracks: { some: {} } } },
        },
        take: 100,
        select: userSelect,
      });
    } else {
      // ── Similar 模式：依共同藝人相似度排序 ──────────────────────────

      // 取出自己歌單中的所有藝人（小寫正規化）
      const myPlaylists = await prisma.playlist.findMany({
        where: { userId: me.id },
        include: {
          tracks: { include: { track: { select: { artist: true } } } },
        },
      });
      const myArtists = new Set(
        myPlaylists
          .flatMap((p) => p.tracks.map((t) => t.track.artist.toLowerCase().trim()))
      );

      if (myArtists.size === 0) {
        // 若自己尚無歌單，退回 random 模式
        candidates = await prisma.user.findMany({
          where: {
            id: { notIn: excludeIds },
            playlists: { some: { tracks: { some: {} } } },
          },
          take: 5,
          select: userSelect,
        });
      } else {
        // 撈出更多候選人以利計算相似度（最多 200 人）
        const pool = await prisma.user.findMany({
          where: {
            id: { notIn: excludeIds },
            playlists: { some: { tracks: { some: {} } } },
          },
          take: 200,
          select: userSelect,
        });

        // 先將 pool 隨機打亂，以利於在同分時保持隨機排序
        const shuffledPool = pool
          .map((candidate) => ({ candidate, rand: Math.random() }))
          .sort((a, b) => a.rand - b.rand)
          .map((item) => item.candidate);

        // 計算每位候選人與自己的「共同藝人數」作為相似度分數
        const scored = shuffledPool.map((candidate) => {
          const candidateArtists = new Set(
            candidate.playlists
              .flatMap((p) => p.tracks.map((t) => t.track.artist.toLowerCase().trim()))
          );
          let score = 0;
          for (const artist of candidateArtists) {
            if (myArtists.has(artist)) score++;
          }
          return { ...candidate, similarityScore: score };
        });

        // 穩定排序：只根據相似度分數降序排列（因為先前已經打亂，同分者自然呈隨機分佈）
        scored.sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0));

        candidates = scored.slice(0, 100);
      }
    }

    // ── 步驟 3：開發測試：強制置頂測試帳號 ──────────────────────────────
    const testEmail1 = "aaronlee0715@gmail.com";
    const testEmail2 = "411121217@gms.ndhu.edu.tw";

    const [user1, user2] = await Promise.all([
      prisma.user.findUnique({ where: { email: testEmail1 }, select: userSelect }),
      prisma.user.findUnique({ where: { email: testEmail2 }, select: userSelect }),
    ]) as any[];

    // 移除現有名單中的 test users 避免重複
    candidates = candidates.filter((c) => c.email !== testEmail1 && c.email !== testEmail2);

    // 篩選最優歌單的輔助函數：優先展示含有真實 Spotify 同步歌曲的歌單，避免被手動建立的假歌測試歌單覆蓋
    const filterBestPlaylist = (c: any) => {
      if (!c) return c;
      const playlists = c.playlists || [];
      
      // 優先選擇名稱為 "My Spotify Top Tracks" 且有歌曲的歌單
      let bestPlaylist = playlists.find(
        (p: any) => p.name === "My Spotify Top Tracks" && p.tracks && p.tracks.length > 0
      );
      
      // 若無，則選擇任何非空（含有歌曲）的歌單
      if (!bestPlaylist) {
        bestPlaylist = playlists.find((p: any) => p.tracks && p.tracks.length > 0);
      }
      
      // 若皆無，則退回使用第一張歌單
      if (!bestPlaylist && playlists.length > 0) {
        bestPlaylist = playlists[0];
      }
      
      return {
        ...c,
        playlists: bestPlaylist ? [bestPlaylist] : [],
      };
    };

    // 全量套用最優歌單篩選機制
    candidates = candidates.map(filterBestPlaylist);

    if (mode === "random") {
      const processedUser1 = filterBestPlaylist(user1);
      const processedUser2 = filterBestPlaylist(user2);

      const topCandidates: any[] = [];

      // 第一個置頂對象 aaronlee0715@gmail.com
      if (processedUser1 && processedUser1.playlists.length > 0 && processedUser1.playlists[0].tracks.length > 0) {
        if (processedUser1.id !== me.id && !matchedIds.includes(processedUser1.id)) {
          topCandidates.push(processedUser1);
        }
      }

      // 第二個置頂對象 411121217@gms.ndhu.edu.tw
      if (processedUser2 && processedUser2.playlists.length > 0 && processedUser2.playlists[0].tracks.length > 0) {
        if (processedUser2.id !== me.id && !matchedIds.includes(processedUser2.id)) {
          topCandidates.push(processedUser2);
        }
      }

      // 塞到最前面：user1 將成為第一張，user2 成為第二張
      candidates.unshift(...topCandidates);
    }

    // ── 步驟 4：回傳（附帶使用的 mode 資訊）────────────────────────
    return NextResponse.json({
      mode,
      candidates: candidates.slice(0, 100), // 確保回傳數量不多於 100 個
    });
  } catch (error) {
    console.error("[Match Candidates Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidates", detail: String(error) },
      { status: 500 }
    );
  }
}
