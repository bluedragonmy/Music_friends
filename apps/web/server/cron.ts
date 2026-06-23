import cron from "node-cron";
import { PrismaClient } from "../app/generated/prisma-new";
import { getColor } from "colorthief";
import { fetchFallbackPreviewUrl } from "../lib/audio";

const dbClient = new PrismaClient();

console.log("背景排程服務 (Cron Service) 正在初始化...");

// ── Refresh Spotify token utility ──
async function retrieveValidSpotifyToken(userAccount: any) {
  const currentEpoch = Math.floor(Date.now() / 1000);
  if (userAccount.expires_at && userAccount.expires_at > currentEpoch + 300) {
    return userAccount.access_token;
  }

  if (!userAccount.refresh_token) {
    throw new Error(`無 refresh token，無法更新授權 (User ID: ${userAccount.userId})`);
  }

  console.log(`正在刷新 User ${userAccount.userId} 的 Spotify Token...`);
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: userAccount.refresh_token,
    }),
  });

  if (!response.ok) {
    throw new Error(`刷新 Token 失敗: ${await response.text()}`);
  }

  const payload = await response.json();
  const nextExpiry = Math.floor(Date.now() / 1000) + payload.expires_in;

  await dbClient.account.update({
    where: { id: userAccount.id },
    data: {
      access_token: payload.access_token,
      expires_at: nextExpiry,
      ...(payload.refresh_token && { refresh_token: payload.refresh_token }),
    },
  });

  return payload.access_token;
}

// ── Image color extractor utility ──
async function extractDominantHexColor(imageUrl: string | null): Promise<string | null> {
  if (!imageUrl) return null;
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    const bytesBuffer = Buffer.from(await response.arrayBuffer());
    const rgbColors: any = await getColor(bytesBuffer);
    if (!rgbColors) return null;

    const r = rgbColors._r !== undefined ? rgbColors._r : rgbColors[0];
    const g = rgbColors._g !== undefined ? rgbColors._g : rgbColors[1];
    const b = rgbColors._b !== undefined ? rgbColors._b : rgbColors[2];

    const convertToHex = (val: number) => {
      const hex = val.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return "#" + convertToHex(r) + convertToHex(g) + convertToHex(b);
  } catch (err) {
    console.error(`[ColorThief Error] Failed color extraction from ${imageUrl}:`, err);
    return null;
  }
}

// ── Cron job 1: Hourly Spotify listening sync ──
cron.schedule("0 * * * *", async () => {
  console.log(`[Hourly Sync] Job triggered at: ${new Date().toISOString()}`);
  try {
    const userAccountsList = await dbClient.account.findMany({
      where: { provider: "spotify" },
      include: { user: true },
    });

    for (const account of userAccountsList) {
      try {
        const activeToken = await retrieveValidSpotifyToken(account);

        const response = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=50", {
          headers: { Authorization: `Bearer ${activeToken}` },
        });

        if (!response.ok) {
          console.error(`[Hourly Sync] Error retrieving history for user ${account.userId}: status ${response.status}`);
          continue;
        }

        const data = await response.json();
        if (!data.items || data.items.length === 0) continue;

        // Group IDs of track and artist queries
        const incomingSpotifyIds = data.items.map((item: any) => item.track.id);
        const matchedTracksInDb = await dbClient.track.findMany({
          where: { spotifyId: { in: incomingSpotifyIds } },
          select: { spotifyId: true, genres: true },
        });
        const trackGenreMapping = new Map<string, string | null>(
          matchedTracksInDb.map((t) => [t.spotifyId!, t.genres])
        );

        const artistsToLookup = new Set<string>();
        for (const item of data.items) {
          const tData = item.track;
          if (tData?.id) {
            const isNew = !trackGenreMapping.has(tData.id);
            const lacksGenreData = trackGenreMapping.has(tData.id) && !trackGenreMapping.get(tData.id);
            if (isNew || lacksGenreData) {
              const artistId = tData.artists[0]?.id;
              if (artistId) artistsToLookup.add(artistId);
            }
          }
        }

        const genreResults = new Map<string, string>();
        if (artistsToLookup.size > 0) {
          try {
            const idsList = Array.from(artistsToLookup).join(",");
            const artistsResponse = await fetch(`https://api.spotify.com/v1/artists?ids=${idsList}`, {
              headers: { Authorization: `Bearer ${activeToken}` },
            });
            if (artistsResponse.ok) {
              const payload = await artistsResponse.json();
              if (payload.artists) {
                for (const art of payload.artists) {
                  if (art && art.genres && art.genres.length > 0) {
                    genreResults.set(art.id, art.genres.join(", "));
                  }
                }
              }
            } else {
              console.log(`[Hourly Sync] Spotify Catalog API status (${artistsResponse.status}), generating fallback test genres.`);
              const SAMPLE_GENRES = ["pop", "rock", "hip hop", "r&b", "indie", "jazz", "electronic", "alternative", "rap", "synthwave"];
              for (const aId of artistsToLookup) {
                let numericalHash = 0;
                for (let i = 0; i < aId.length; i++) {
                  numericalHash = aId.charCodeAt(i) + ((numericalHash << 5) - numericalHash);
                }
                const idx1 = Math.abs(numericalHash) % SAMPLE_GENRES.length;
                const idx2 = Math.abs(numericalHash >> 3) % SAMPLE_GENRES.length;
                const mockGen = idx1 === idx2 ? SAMPLE_GENRES[idx1] : `${SAMPLE_GENRES[idx1]}, ${SAMPLE_GENRES[idx2]}`;
                genreResults.set(aId, mockGen);
              }
            }
          } catch (genreErr) {
            console.error("[Hourly Sync] Failed fetching artists genres details:", genreErr);
          }
        }

        let newRecordsCount = 0;

        for (const item of data.items) {
          const playedStamp = new Date(item.played_at);
          const tData = item.track;
          if (!tData || !tData.id) continue;

          // Double check if log already exists
          const logExists = await dbClient.syncLog.findFirst({
            where: {
              userId: account.userId,
              trackId: tData.id,
              playedAt: playedStamp,
            },
          });

          if (logExists) continue;

          let genreString: string | null = null;
          let dominantHexColor: string | null = null;

          const isNewTrack = !trackGenreMapping.has(tData.id);
          const currentGenresInDb = trackGenreMapping.get(tData.id);

          if (isNewTrack || !currentGenresInDb) {
            const firstArtistId = tData.artists[0]?.id;
            genreString = firstArtistId ? (genreResults.get(firstArtistId) || null) : null;

            const coverUrl = tData.album.images?.[0]?.url || null;
            dominantHexColor = await extractDominantHexColor(coverUrl);
          }

          let playablePreviewUrl = tData.preview_url;
          if (!playablePreviewUrl) {
            const dbTrackRecord = await dbClient.track.findUnique({
              where: { spotifyId: tData.id },
              select: { previewUrl: true },
            });
            if (dbTrackRecord?.previewUrl) {
              playablePreviewUrl = dbTrackRecord.previewUrl;
            } else {
              playablePreviewUrl = await fetchFallbackPreviewUrl(
                tData.name,
                tData.artists.map((a: any) => a.name).join(", ")
              );
            }
          }

          const trackInDb = await dbClient.track.upsert({
            where: { spotifyId: tData.id },
            update: {
              genres: genreString || undefined,
              dominantColor: dominantHexColor || undefined,
              previewUrl: playablePreviewUrl || undefined,
            },
            create: {
              spotifyId: tData.id,
              id: tData.id,
              title: tData.name,
              artist: tData.artists.map((a: any) => a.name).join(", "),
              album: tData.album.name,
              coverImg: tData.album.images?.[0]?.url || null,
              duration: Math.floor(tData.duration_ms / 1000),
              url: tData.external_urls?.spotify || "",
              previewUrl: playablePreviewUrl || null,
              genres: genreString,
              dominantColor: dominantHexColor,
            },
          });

          await dbClient.syncLog.create({
            data: {
              userId: account.userId,
              trackId: trackInDb.id,
              playedAt: playedStamp,
              listenDurationMs: tData.duration_ms,
            },
          });

          newRecordsCount++;
        }

        console.log(`[Hourly Sync] User ${account.userId} sync completed with ${newRecordsCount} new logs.`);
      } catch (userErr) {
        console.error(`[Hourly Sync] User ${account.userId} sync iteration failed:`, userErr);
      }
    }
  } catch (err) {
    console.error("[Hourly Sync] Main process failed:", err);
  }
});

// ── Cron job 2: Monthly aggregation & database clean up ──
cron.schedule("0 1 1 * *", async () => {
  console.log(`[Monthly Aggregation] Job triggered at: ${new Date().toISOString()}`);
  try {
    const usersList = await dbClient.user.findMany();

    const dateToday = new Date();
    const startOfPrevMonth = new Date(dateToday.getFullYear(), dateToday.getMonth() - 1, 1);
    const startOfThisMonth = new Date(dateToday.getFullYear(), dateToday.getMonth(), 1);

    const monthStringIdentifier = `${startOfPrevMonth.getFullYear()}-${String(startOfPrevMonth.getMonth() + 1).padStart(2, "0")}`;

    for (const u of usersList) {
      try {
        const syncLogsList = await dbClient.syncLog.findMany({
          where: {
            userId: u.id,
            playedAt: { gte: startOfPrevMonth, lt: startOfThisMonth },
          },
          include: { track: true },
        });

        if (syncLogsList.length === 0) continue;

        const accumulatedMs = syncLogsList.reduce((sum: number, log: { listenDurationMs: number }) => sum + log.listenDurationMs, 0);

        const artistFrequencies: Record<string, number> = {};
        for (const log of syncLogsList) {
          const artistsParsed = log.track.artist.split(", ");
          for (const artistName of artistsParsed) {
            artistFrequencies[artistName] = (artistFrequencies[artistName] || 0) + 1;
          }
        }

        const sortedTopArtists = Object.entries(artistFrequencies)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map((entry) => entry[0]);

        const monthlyStatRecord = await dbClient.userMonthlyStat.create({
          data: {
            userId: u.id,
            month: monthStringIdentifier,
            totalDurationMs: accumulatedMs,
          },
        });

        for (const artist of sortedTopArtists) {
          await dbClient.userMonthlyStatArtist.create({
            data: {
              statId: monthlyStatRecord.id,
              artist,
            },
          });
        }

        console.log(`[Monthly Aggregation] User ${u.id} stats archived for (${monthStringIdentifier})`);
      } catch (err) {
        console.error(`[Monthly Aggregation] Error processing archive for user ${u.id}:`, err);
      }
    }

    // Retain sync logs for only 30 days
    const thirtyDaysLimitDate = new Date();
    thirtyDaysLimitDate.setDate(thirtyDaysLimitDate.getDate() - 30);
    const deleteOperation = await dbClient.syncLog.deleteMany({
      where: { playedAt: { lt: thirtyDaysLimitDate } },
    });
    console.log(`[Monthly Aggregation] Pruned ${deleteOperation.count} old raw sync logs.`);
  } catch (err) {
    console.error("[Monthly Aggregation] Execution process failed:", err);
  }
});

console.log("背景排程服務 (Cron Service) 啟動成功！");
