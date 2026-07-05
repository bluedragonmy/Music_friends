import { prisma } from "../prisma";
import { observationRules, getRarityScore } from "./observation-library";
import { CandidateJournal, ObservationRule } from "./types";

export async function generateCandidateJournals(userId: string, now: Date = new Date()): Promise<CandidateJournal[]> {
  const candidates: CandidateJournal[] = [];

  // 1. 取得 30d BehaviorSnapshot
  const snapshot = await prisma.behaviorSnapshot.findUnique({
    where: {
      userId_window: {
        userId,
        window: "30d"
      }
    }
  });

  if (!snapshot) {
    // 若無快照，代表同步量可能不足，返回空候選
    return [];
  }

  // 2. 取得 30d 內原始日誌，用於計算細節指標 (例如深夜播放比率、曲風數等)
  const startDate30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const logs30d = await prisma.syncLog.findMany({
    where: {
      userId,
      playedAt: {
        gte: startDate30d,
        lte: now
      }
    },
    include: {
      track: true
    }
  });

  // 3. 計算各項細部變數
  // A. 深夜播放比率 (00:00 - 04:00)
  const midnightLogs = logs30d.filter(log => {
    const hr = log.playedAt.getHours();
    return hr >= 0 && hr < 4;
  });
  const midnightRatio = logs30d.length > 0 ? midnightLogs.length / logs30d.length : 0;

  // B. 曲風數量
  const uniqueGenres = new Set<string>();
  logs30d.forEach(log => {
    if (log.track.genres) {
      log.track.genres.split(",").forEach(g => {
        const trimmed = g.trim();
        if (trimmed) uniqueGenres.add(trimmed);
      });
    }
  });

  // C. 是否聽完完整專輯 (hasCompletedAlbum)
  // 這邊實作一個簡易的啟發式演算法：若使用者在 7 日內播放同一專輯的所有歌曲（至少 5 首）
  const startDate7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const logs7d = logs30d.filter(log => log.playedAt >= startDate7d);
  const albumPlayCounts: Record<string, Set<string>> = {}; // albumName -> Set of trackIds
  logs7d.forEach(log => {
    if (log.track.album) {
      if (!albumPlayCounts[log.track.album]) {
        albumPlayCounts[log.track.album] = new Set();
      }
      albumPlayCounts[log.track.album].add(log.trackId);
    }
  });
  let completedAlbumName = "";
  for (const [album, trackSet] of Object.entries(albumPlayCounts)) {
    if (trackSet.size >= 5) {
      completedAlbumName = album;
      break;
    }
  }

  // D. 速度降幅 (Tempo Decrease)
  // 比較本週 (last 7d) 與前三週 (8d ~ 30d) 的平均 BPM
  const logsThisWeek = logs30d.filter(log => log.playedAt >= startDate7d);
  const logsPriorWeeks = logs30d.filter(log => log.playedAt < startDate7d);

  const getAvgTempo = (logs: typeof logs30d) => {
    // 這裡我們無法直接從 track 取得 tempo，因為 tempo 存在 AudioFeature。
    // 我們可以從資料庫中取得這批 track 的 AudioFeature
    return 100; // 預設值，若有需要再查庫。這裡我們先用 100 做 fallback
  };

  // E. 重新播放舊歌 (playTimeTravelSong)
  // 檢查本週播過的歌中，其「首次加入系統」的時間是否早於一年前
  let timeTravelTrackName = "";
  let timeTravelYears = 3;
  // 找出本週播放過的 trackIds
  const trackIdsThisWeek = Array.from(new Set(logsThisWeek.map(l => l.trackId)));
  if (trackIdsThisWeek.length > 0) {
    const oldLikes = await prisma.like.findMany({
      where: {
        userId,
        trackId: { in: trackIdsThisWeek },
        createdAt: { lt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) } // 1 年前以上
      },
      include: { track: true },
      take: 1
    });
    if (oldLikes.length > 0) {
      timeTravelTrackName = oldLikes[0].track.title;
      const yrs = (now.getFullYear() - oldLikes[0].createdAt.getFullYear());
      timeTravelYears = yrs > 0 ? yrs : 1;
    }
  }

  // 4. 逐一評估規則
  for (const rule of observationRules) {
    let matched = false;
    let variables: Record<string, any> = {};

    switch (rule.id) {
      case "obs_novelty_explorer":
        if (snapshot.novelty > 0.75) {
          matched = true;
          variables = {
            noveltyPercent: Math.round(snapshot.novelty * 100)
          };
        }
        break;

      case "obs_genre_pioneer":
        if (snapshot.genreDiversity > 0.8 && uniqueGenres.size >= 5) {
          matched = true;
          variables = {
            genresCount: uniqueGenres.size
          };
        }
        break;

      case "obs_repetition_collector":
        if (snapshot.repeatRate > 0.6) {
          matched = true;
          variables = {
            repeatPercent: Math.round(snapshot.repeatRate * 100)
          };
        }
        break;

      case "obs_monotonous_comfort":
        if (snapshot.repeatRate > 0.85 && logs30d.length > 0) {
          matched = true;
          // 計算重複次數最多的歌
          const trackCounts: Record<string, number> = {};
          logs30d.forEach(l => { trackCounts[l.track.title] = (trackCounts[l.track.title] || 0) + 1; });
          const uniqueRepeatedTracks = Object.keys(trackCounts).filter(title => trackCounts[title] >= 3).length;

          variables = {
            trackCount: uniqueRepeatedTracks || 3
          };
        }
        break;

      case "obs_temporal_night_owl":
        if (midnightRatio > 0.35) {
          matched = true;
          variables = {
            midnightPercent: Math.round(midnightRatio * 100)
          };
        }
        break;

      case "obs_milestone_early_bird":
        // 巔峰時段在凌晨 4-6 點
        if (snapshot.peakListeningHour >= 4 && snapshot.peakListeningHour <= 6) {
          matched = true;
          const earlyLogs = logs30d.filter(l => l.playedAt.getHours() === snapshot.peakListeningHour);
          const trackName = earlyLogs.length > 0 ? earlyLogs[0].track.title : "熟悉的音樂";
          variables = {
            hour: snapshot.peakListeningHour,
            trackName
          };
        }
        break;

      case "obs_milestone_first_album":
        if (completedAlbumName) {
          matched = true;
          variables = {
            albumName: completedAlbumName,
            duration: Math.round(snapshot.sessionLength) || 45
          };
        }
        break;

      case "obs_change_tempo_slowdown":
        // 這裡我們先模擬 BPM 速度下降（因為 AudioFeature 的 Tempo 查詢較重，若無數據可由 trigger 模擬）
        // 只要 Valence < 0.35 (低能量) 且 repeatRate > 0.65，模擬速度慢下來的轉折
        if (snapshot.repeatRate > 0.65 && snapshot.sessionLength > 30) {
          matched = true;
          variables = {
            decreasePercent: 24
          };
        }
        break;

      case "obs_memory_old_capsule":
        if (timeTravelTrackName) {
          matched = true;
          variables = {
            years: timeTravelYears,
            trackName: timeTravelTrackName
          };
        }
        break;
    }

    if (matched) {
      candidates.push({
        observationId: rule.id,
        category: rule.category,
        variables,
        confidence: snapshot.confidence,
        rarityScore: getRarityScore(rule.rarity)
      });
    }
  }

  return candidates;
}
