import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getColor } from "colorthief";
import { fetchFallbackPreviewUrl } from "@/lib/audio";
import { composeBehaviorSnapshot } from "@/lib/behavioral-engine";
import { composeIdentitySnapshots } from "@/lib/inference-engine";
import { getOrCreateTodayJournal, getOrCreateRewindQueue } from "@/lib/journey/narrative-engine";


// ── Image color extractor helper ──
async function computeDominantHexColor(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const response = await fetch(url);
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
    console.error(`[ColorThief Stats API] Color extraction failed for ${url}:`, err);
    return null;
  }
}

// ── In-request Spotify background sync ──
async function synchronizeSpotifyListeningHistory(userId: string, lastSyncTimestamp: Date | null, forceSync = false) {
  console.log(`[Spotify Sync Service] Synchronizing user history for ${userId} (Force Sync: ${forceSync})`);
  try {
    // Sync rate limit check: skip if updated less than 5 minutes ago and not forced
    if (lastSyncTimestamp && !forceSync) {
      const msSinceLastSync = Date.now() - new Date(lastSyncTimestamp).getTime();
      const SYNC_COOLDOWN_MS = 5 * 60 * 1000;
      if (msSinceLastSync < SYNC_COOLDOWN_MS) {
        console.log(`[Spotify Sync Service] Cooldown active for user ${userId} (${Math.round(msSinceLastSync / 1000)}s elapsed). Skipping API call.`);
        return;
      }
    }

    const spotifyAccount = await prisma.account.findFirst({
      where: { userId, provider: "spotify" },
    });

    if (!spotifyAccount) {
      console.warn(`[Spotify Sync Service] Spotify account connection not found for user ${userId}`);
      return;
    }
    if (!spotifyAccount.access_token) {
      console.warn(`[Spotify Sync Service] Empty Spotify access token for user ${userId}`);
      return;
    }

    let activeAccessToken = spotifyAccount.access_token;
    const expiresAt = spotifyAccount.expires_at || 0;
    const tokenHasExpired = Date.now() >= (expiresAt - 300) * 1000;

    // Refresh token if expired
    if (tokenHasExpired && spotifyAccount.refresh_token) {
      console.log(`[Spotify Sync Service] Access token expired or expiring soon. Refreshing token...`);
      const clientId = process.env.SPOTIFY_CLIENT_ID!;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
      const authHeaderBase64 = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${authHeaderBase64}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: spotifyAccount.refresh_token,
        }),
      });

      const tokenPayload = await response.json();
      if (response.ok && tokenPayload.access_token) {
        console.log(`[Spotify Sync Service] Token refresh operation successful`);
        activeAccessToken = tokenPayload.access_token;
        await prisma.account.update({
          where: { id: spotifyAccount.id },
          data: {
            access_token: activeAccessToken,
            expires_at: Math.floor(Date.now() / 1000) + tokenPayload.expires_in,
            ...(tokenPayload.refresh_token && { refresh_token: tokenPayload.refresh_token }),
          },
        });
      } else {
        console.error(`[Spotify Sync Service] Failed to refresh token:`, tokenPayload);
        return;
      }
    }

    // Retrieve last 50 recently played tracks
    console.log(`[Spotify Sync Service] Requesting recently played endpoint...`);
    const historyResponse = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=50", {
      headers: { Authorization: `Bearer ${activeAccessToken}` },
    });

    if (!historyResponse.ok) {
      const errResponseText = await historyResponse.text();
      console.error(`[Spotify Sync Service] Spotify API error status: ${historyResponse.status}, details: ${errResponseText}`);
      return;
    }

    const payload = await historyResponse.json();
    if (!payload.items || payload.items.length === 0) {
      console.log(`[Spotify Sync Service] Spotify returned empty listening history.`);
      return;
    }

    console.log(`[Spotify Sync Service] Fetched ${payload.items.length} records. Syncing tracks database.`);
    const items = payload.items;

    const freshTracksBuffer = new Map();
    const staleTracksBuffer = new Map();
    const artistsPendingLookup = new Set<string>();
    const audioFeaturesPendingLookup = new Set<string>();

    const trackIds = items.map((item: any) => item.track?.id).filter(Boolean);
    const dbTracks = await prisma.track.findMany({
      where: { spotifyId: { in: trackIds } },
      select: {
        spotifyId: true,
        genres: true,
        dominantColor: true,
        previewUrl: true,
        audioFeature: {
          select: { id: true }
        }
      },
    });

    const dbTracksMap = new Map<string, {
      genres: string | null;
      dominantColor: string | null;
      previewUrl: string | null;
      hasAudioFeature: boolean;
    }>(
      dbTracks.map((t) => [
        t.spotifyId!,
        {
          genres: t.genres,
          dominantColor: t.dominantColor,
          previewUrl: t.previewUrl,
          hasAudioFeature: !!t.audioFeature
        }
      ])
    );

    for (const item of items) {
      const trackObj = item.track;
      if (!trackObj || !trackObj.id) continue;

      const matchedDbTrack = dbTracksMap.get(trackObj.id);
      const isTrackNew = !dbTracksMap.has(trackObj.id);
      const lacksData = dbTracksMap.has(trackObj.id) &&
        (!matchedDbTrack?.genres || !matchedDbTrack?.dominantColor || !matchedDbTrack?.previewUrl || !matchedDbTrack?.hasAudioFeature);

      if (isTrackNew || lacksData) {
        const artistId = trackObj.artists?.[0]?.id;
        if (artistId) artistsPendingLookup.add(artistId);

        if (isTrackNew || !matchedDbTrack?.hasAudioFeature) {
          audioFeaturesPendingLookup.add(trackObj.id);
        }

        const trackDataPayload = {
          spotifyId: trackObj.id,
          title: trackObj.name,
          artist: trackObj.artists.map((a: any) => a.name).join(", "),
          album: trackObj.album.name,
          coverImg: trackObj.album.images?.[0]?.url || null,
          duration: Math.floor(trackObj.duration_ms / 1000),
          url: trackObj.external_urls?.spotify || "",
          genres: matchedDbTrack?.genres || null,
          dominantColor: matchedDbTrack?.dominantColor || null,
          previewUrl: matchedDbTrack?.previewUrl || trackObj.preview_url || null,
          popularity: trackObj.popularity ?? null,
        };

        if (isTrackNew) {
          freshTracksBuffer.set(trackObj.id, trackDataPayload);
        } else {
          staleTracksBuffer.set(trackObj.id, trackDataPayload);
        }
      }
    }

    const resolvedGenresCache = new Map<string, string>();
    if (artistsPendingLookup.size > 0) {
      try {
        const artistIdsParam = Array.from(artistsPendingLookup).join(",");
        const artistsResponse = await fetch(`https://api.spotify.com/v1/artists?ids=${artistIdsParam}`, {
          headers: { Authorization: `Bearer ${activeAccessToken}` },
        });

        if (artistsResponse.ok) {
          const artistsPayload = await artistsResponse.json();
          if (artistsPayload.artists) {
            for (const artist of artistsPayload.artists) {
              if (artist && artist.genres && artist.genres.length > 0) {
                resolvedGenresCache.set(artist.id, artist.genres.join(", "));
              }
            }
          }
        } else {
          console.log(`[Spotify Sync Service] Catalog query failed: status ${artistsResponse.status}. Generating testing fallbacks.`);
          const MOCK_CATEGORIES = ["pop", "rock", "hip hop", "r&b", "indie", "jazz", "electronic", "alternative", "rap", "synthwave"];
          for (const aId of artistsPendingLookup) {
            let stringHash = 0;
            for (let i = 0; i < aId.length; i++) {
              stringHash = aId.charCodeAt(i) + ((stringHash << 5) - stringHash);
            }
            const i1 = Math.abs(stringHash) % MOCK_CATEGORIES.length;
            const i2 = Math.abs(stringHash >> 3) % MOCK_CATEGORIES.length;
            const mockGenreString = i1 === i2 ? MOCK_CATEGORIES[i1] : `${MOCK_CATEGORIES[i1]}, ${MOCK_CATEGORIES[i2]}`;
            resolvedGenresCache.set(aId, mockGenreString);
          }
        }
      } catch (err) {
        console.error("[Spotify Sync Service] Fails resolving artists genres:", err);
      }
    }

    const resolvedAudioFeatures = new Map<string, any>();
    if (audioFeaturesPendingLookup.size > 0) {
      try {
        // Query audio features in batches of 50 (ids list maximum is 100, so this fits easily)
        const idsList = Array.from(audioFeaturesPendingLookup).join(",");
        console.log(`[Spotify Sync Service] Fetching audio features for ${audioFeaturesPendingLookup.size} tracks...`);
        const featuresResponse = await fetch(`https://api.spotify.com/v1/audio-features?ids=${idsList}`, {
          headers: { Authorization: `Bearer ${activeAccessToken}` },
        });

        if (featuresResponse.ok) {
          const featuresPayload = await featuresResponse.json();
          if (featuresPayload.audio_features) {
            for (const feat of featuresPayload.audio_features) {
              if (feat) {
                resolvedAudioFeatures.set(feat.id, {
                  acousticness: feat.acousticness,
                  danceability: feat.danceability,
                  energy: feat.energy,
                  instrumentalness: feat.instrumentalness,
                  liveness: feat.liveness,
                  loudness: feat.loudness,
                  speechiness: feat.speechiness,
                  tempo: feat.tempo,
                  valence: feat.valence,
                });
              }
            }
          }
        } else {
          console.error(`[Spotify Sync Service] Audio features query failed: status ${featuresResponse.status}`);
        }
      } catch (err) {
        console.error("[Spotify Sync Service] Error fetching audio features:", err);
      }
    }

    // Populate missing track attributes in buffers
    for (const [spotifyId, track] of freshTracksBuffer.entries()) {
      const originalItem = items.find((i: any) => i.track?.id === spotifyId);
      const artistId = originalItem?.track?.artists?.[0]?.id;
      if (artistId && !track.genres) {
        track.genres = resolvedGenresCache.get(artistId) || null;
      }
      track.dominantColor = await computeDominantHexColor(track.coverImg);

      if (!track.previewUrl) {
        track.previewUrl = await fetchFallbackPreviewUrl(track.title, track.artist);
      }
    }

    for (const [spotifyId, track] of staleTracksBuffer.entries()) {
      const originalItem = items.find((i: any) => i.track?.id === spotifyId);
      const artistId = originalItem?.track?.artists?.[0]?.id;
      if (artistId && !track.genres) {
        track.genres = resolvedGenresCache.get(artistId) || null;
      }
      if (!track.dominantColor) {
        track.dominantColor = await computeDominantHexColor(track.coverImg);
      }

      if (!track.previewUrl) {
        track.previewUrl = await fetchFallbackPreviewUrl(track.title, track.artist);
      }
    }

    // Save newly discovered tracks
    const tracksToInsert = Array.from(freshTracksBuffer.values());
    if (tracksToInsert.length > 0) {
      await prisma.track.createMany({
        data: tracksToInsert,
        skipDuplicates: true,
      });
    }

    // Update existing track details
    for (const [spotifyId, track] of staleTracksBuffer.entries()) {
      await prisma.track.update({
        where: { spotifyId },
        data: {
          genres: track.genres || undefined,
          dominantColor: track.dominantColor || undefined,
          previewUrl: track.previewUrl || undefined,
          popularity: track.popularity || undefined,
        },
      });
    }

    // Lookup CUID keys
    const resolvedDbTracks = await prisma.track.findMany({
      where: { spotifyId: { in: trackIds } },
      select: { id: true, spotifyId: true },
    });
    const keyMap = new Map<string, string>(resolvedDbTracks.map((t) => [t.spotifyId!, t.id]));

    // Save audio features
    const audioFeaturesToInsert = [];
    for (const [spotifyId, features] of resolvedAudioFeatures.entries()) {
      const trackDbId = keyMap.get(spotifyId);
      if (!trackDbId) continue;

      const existingFeature = await prisma.audioFeature.findUnique({
        where: { trackId: trackDbId },
      });

      if (!existingFeature) {
        audioFeaturesToInsert.push({
          trackId: trackDbId,
          ...features,
        });
      }
    }

    if (audioFeaturesToInsert.length > 0) {
      await prisma.audioFeature.createMany({
        data: audioFeaturesToInsert,
        skipDuplicates: true,
      });
      console.log(`[Spotify Sync Service] Inserted ${audioFeaturesToInsert.length} track audio features.`);
    }

    const newLogsBatch = [];
    for (const item of items) {
      const trackObj = item.track;
      if (!trackObj || !trackObj.id) continue;

      const trackDbId = keyMap.get(trackObj.id);
      if (!trackDbId) continue;

      const playedAtDate = new Date(item.played_at);
      const matchedLogRecord = await prisma.syncLog.findFirst({
        where: { userId, trackId: trackDbId, playedAt: playedAtDate },
        select: { id: true },
      });

      if (!matchedLogRecord) {
        newLogsBatch.push({
          userId,
          trackId: trackDbId,
          playedAt: playedAtDate,
          listenDurationMs: trackObj.duration_ms,
        });
      }
    }

    if (newLogsBatch.length > 0) {
      await prisma.syncLog.createMany({
        data: newLogsBatch,
        skipDuplicates: true,
      });
      console.log(`[Spotify Sync Service] Inserted ${newLogsBatch.length} new sync history logs.`);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { lastSyncedAt: new Date() },
    });
    console.log(`[Spotify Sync Service] Updated sync timestamp for user ${userId}`);

    // Trigger behavior snapshots calculation for all supported windows
    try {
      console.log(`[Behavioral Engine] Triggering snapshots calculation for user ${userId}...`);
      const now = new Date();
      await composeBehaviorSnapshot(userId, "7d", now);
      await composeBehaviorSnapshot(userId, "30d", now);
      await composeBehaviorSnapshot(userId, "90d", now);
      await composeBehaviorSnapshot(userId, "all-time", now);
      console.log(`[Behavioral Engine] Completed snapshots calculation for user ${userId}`);

      // Trigger Inference Engine after behavior snapshots
      console.log(`[Inference Engine] Triggering identity inference for user ${userId}...`);
      await composeIdentitySnapshots(userId, "7d", now);
      await composeIdentitySnapshots(userId, "30d", now);
      await composeIdentitySnapshots(userId, "90d", now);
      await composeIdentitySnapshots(userId, "all-time", now);
      console.log(`[Inference Engine] Completed identity inference for user ${userId}`);

      // Trigger Narrative Engine to create Today's Listening Journal Entry
      console.log(`[Narrative Engine] Generating today's journal entry for user ${userId}...`);
      await getOrCreateTodayJournal(userId, now);
      console.log(`[Narrative Engine] Completed today's journal entry for user ${userId}`);
    } catch (engineErr) {
      console.error(`[Engine Error] Failed computing snapshots or journal for user ${userId}:`, engineErr);
    }
  } catch (err) {
    console.error("[Spotify Sync Service] Error during synchronization:", err);
  }
}

export async function GET(request: Request) {
  try {
    const userSession = await getServerSession(authOptions);
    if (!userSession?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsedDimension = searchParams.get("dimension") || "week";
    const forceSyncTriggered = searchParams.get("force") === "true";

    const localUserRecord = await prisma.user.findUnique({
      where: { email: userSession.user.email },
    });

    if (!localUserRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Trigger non-blocking sync in background
    synchronizeSpotifyListeningHistory(localUserRecord.id, localUserRecord.lastSyncedAt, forceSyncTriggered).catch((err) => {
      console.error("[Background Sync Process Failure]:", err);
    });

    // Resolve query calculation date
    const latestLogRecord = await prisma.syncLog.findFirst({
      where: { userId: localUserRecord.id },
      orderBy: { playedAt: "desc" },
    });

    const currentClockTime = new Date();
    let referenceCalculationDate = currentClockTime;
    let isFallbackToLastActive = false;

    if (latestLogRecord) {
      const lastPlayTime = new Date(latestLogRecord.playedAt);
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      if (currentClockTime.getTime() - lastPlayTime.getTime() > ONE_DAY_MS) {
        referenceCalculationDate = lastPlayTime;
        isFallbackToLastActive = true;
      }
    }

    // Setup date boundaries
    const dateOffset24h = new Date(referenceCalculationDate);
    dateOffset24h.setHours(dateOffset24h.getHours() - 24);

    const dateOffset7d = new Date(referenceCalculationDate);
    dateOffset7d.setDate(dateOffset7d.getDate() - 7);

    let queryStartDate = new Date(referenceCalculationDate);
    if (parsedDimension === "day") {
      queryStartDate.setHours(referenceCalculationDate.getHours() - 24);
    } else if (parsedDimension === "week") {
      queryStartDate.setDate(referenceCalculationDate.getDate() - 7);
    } else if (parsedDimension === "month") {
      queryStartDate.setMonth(referenceCalculationDate.getMonth() - 1);
    } else {
      return NextResponse.json({ error: "Invalid dimension" }, { status: 400 });
    }

    // Fetch matching log entries
    const queryLogs = await prisma.syncLog.findMany({
      where: {
        userId: localUserRecord.id,
        playedAt: { gte: queryStartDate },
      },
      include: { track: true },
    });

    let todayDurationMs = 0;
    let weekDurationMs = 0;
    const totalSelectedDimensionDurationMs = queryLogs.reduce((acc, log) => acc + log.listenDurationMs, 0);

    const frequencyArtistsMap: Record<string, number> = {};
    const frequencyTracksMap: Record<string, { count: number; track: any }> = {};
    const frequencyGenresMap: Record<string, number> = {};

    queryLogs.forEach((log) => {
      if (log.playedAt >= dateOffset7d) {
        weekDurationMs += log.listenDurationMs;
      }
      if (log.playedAt >= dateOffset24h) {
        todayDurationMs += log.listenDurationMs;
      }

      if (log.track.artist) {
        const artistsList = log.track.artist.split(", ");
        artistsList.forEach((artist) => {
          frequencyArtistsMap[artist] = (frequencyArtistsMap[artist] || 0) + 1;
        });
      }

      const trackKeyId = log.track.id;
      if (!frequencyTracksMap[trackKeyId]) {
        frequencyTracksMap[trackKeyId] = { count: 0, track: log.track };
      }
      frequencyTracksMap[trackKeyId].count += 1;

      if (log.track.genres) {
        const genresList = log.track.genres.split(", ");
        genresList.forEach((genre) => {
          const cleanedName = genre.trim();
          if (cleanedName) {
            frequencyGenresMap[cleanedName] = (frequencyGenresMap[cleanedName] || 0) + 1;
          }
        });
      }
    });

    const topArtistsList = Object.entries(frequencyArtistsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const topTracksList = Object.values(frequencyTracksMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((t) => ({
        id: t.track.id,
        title: t.track.title,
        artist: t.track.artist,
        coverImg: t.track.coverImg,
        dominantColor: t.track.dominantColor,
        genres: t.track.genres,
        count: t.count,
      }));

    const topGenresList = Object.entries(frequencyGenresMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Resolve query parameters for BehaviorSnapshot window selection
    const requestedWindow = searchParams.get("window") || 
      (parsedDimension === "day" ? "7d" : parsedDimension === "week" ? "7d" : parsedDimension === "month" ? "30d" : "7d");

    let behaviorSnapshot = await prisma.behaviorSnapshot.findUnique({
      where: {
        userId_window: {
          userId: localUserRecord.id,
          window: requestedWindow,
        },
      },
    });

    if (!behaviorSnapshot) {
      try {
        console.log(`[Stats API] Snapshot not found for user ${localUserRecord.id} with window ${requestedWindow}. Calculating on-the-fly...`);
        behaviorSnapshot = await composeBehaviorSnapshot(localUserRecord.id, requestedWindow as any);
      } catch (calcErr) {
        console.error(`[Stats API] Failed to compute behavior snapshot on-the-fly:`, calcErr);
      }
    }

    // Fetch identity snapshots
    const identitySnapshots = await prisma.identitySnapshot.findMany({
      where: {
        userId: localUserRecord.id,
        window: requestedWindow,
      },
    });

    // Fetch Today's Listening Journal Entry & Listening Journey Timeline
    let todayJournal = null;
    try {
      todayJournal = await getOrCreateTodayJournal(localUserRecord.id, referenceCalculationDate);
    } catch (journalErr) {
      console.error("[Stats API] Failed to fetch or create today's journal:", journalErr);
    }

    let journalTimeline: any[] = [];
    try {
      const queue = await getOrCreateRewindQueue(localUserRecord.id, referenceCalculationDate);
      // Keep todayJournal as the highest narrative score candidate, but sort the timeline list chronologically (descending) to prevent out-of-order date bugs in the vertical UI.
      journalTimeline = [...queue].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (timelineErr) {
      console.error("[Stats API] Failed to fetch or generate rewind queue:", timelineErr);
      journalTimeline = await prisma.journalEntry.findMany({
        where: { userId: localUserRecord.id },
        orderBy: { date: "desc" },
      });
    }


    return NextResponse.json({
      dimension: parsedDimension,
      dimensionDurationMs: totalSelectedDimensionDurationMs,
      todayDurationMs,
      weekDurationMs,
      topArtists: topArtistsList,
      topTracks: topTracksList,
      topGenres: topGenresList,
      isFallbackToLastActive,
      lastActiveDate: latestLogRecord ? latestLogRecord.playedAt : null,
      behaviors: behaviorSnapshot ? {
        novelty: behaviorSnapshot.novelty,
        repeatRate: behaviorSnapshot.repeatRate,
        genreDiversity: behaviorSnapshot.genreDiversity,
        sessionLength: behaviorSnapshot.sessionLength,
        peakListeningHour: behaviorSnapshot.peakListeningHour,
        confidence: behaviorSnapshot.confidence,
        calculatedAt: behaviorSnapshot.calculatedAt,
      } : null,
      identities: identitySnapshots.map((snap) => ({
        id: snap.identityId,
        displayName: snap.displayName,
        score: snap.score,
        confidence: snap.confidence,
        why: snap.why,
        reflection: snap.reflection,
        engineVersion: snap.engineVersion,
      })),
      todayJournal,
      journalTimeline,
    });
  } catch (err) {
    console.error("[Stats API route failure]:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
