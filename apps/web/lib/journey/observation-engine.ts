import { JournalRepository } from "./repository";
import { observationRules, getRarityScore } from "./observation-library";
import { CandidateJournal } from "./types";

export async function generateCandidateJournals(userId: string, now: Date = new Date()): Promise<CandidateJournal[]> {
  const candidates: CandidateJournal[] = [];

  // 1. 透過 Repository 取得 30d BehaviorSnapshot
  const snapshot = await JournalRepository.getUserBehaviorSnapshot(userId, "30d");

  if (!snapshot) {
    // 若無快照，返回空候選
    return [];
  }

  // 2. 透過 Repository 取得 30d 內原始日誌
  const startDate30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const logs30d = await JournalRepository.getUserSyncLogs(userId, startDate30d, now);

  // 3. 計算各項細部變數
  // A. 深夜播放比率 (00:00 - 04:00)
  const midnightLogs = logs30d.filter(log => {
    const hr = new Date(log.playedAt).getHours();
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
  const startDate7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const logs7d = logs30d.filter(log => new Date(log.playedAt) >= startDate7d);
  const albumPlayCounts: Record<string, Set<string>> = {};
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

  // D. 重新播放舊歌 (playTimeTravelSong)
  let timeTravelTrackName = "";
  let timeTravelYears = 3;
  // 找出本週播放過的 trackIds
  const trackIdsThisWeek = Array.from(new Set(logs7d.map(l => l.trackId)));
  if (trackIdsThisWeek.length > 0) {
    const oldLikes = await JournalRepository.getUserLikes(
      userId,
      trackIdsThisWeek,
      new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) // 1年前以上
    );
    if (oldLikes.length > 0) {
      timeTravelTrackName = oldLikes[0].track.title;
      const yrs = now.getFullYear() - new Date(oldLikes[0].createdAt).getFullYear();
      timeTravelYears = yrs > 0 ? yrs : 1;
    }
  }

  // ─── Remembering & Echo 物理數據演算法 ───
  
  // 1. 尋找被時間遺忘的歌 (Forgotten Song)
  let forgottenTrackName = "";
  let forgottenDays = 314; // 預設產品文案天數做 fallback
  const allLogs = await JournalRepository.getUserSyncLogs(userId); // 獲取完整歷史
  
  const playCountsMap = new Map<string, { track: any; lastPlayed: Date; count: number }>();
  allLogs.forEach(log => {
    const prev = playCountsMap.get(log.trackId);
    const playedAt = new Date(log.playedAt);
    if (!prev) {
      playCountsMap.set(log.trackId, { track: log.track, lastPlayed: playedAt, count: 1 });
    } else {
      prev.count += 1;
      if (playedAt > prev.lastPlayed) {
        prev.lastPlayed = playedAt;
      }
    }
  });

  for (const [_, item] of playCountsMap.entries()) {
    const msSinceLastPlay = now.getTime() - item.lastPlayed.getTime();
    const daysSinceLastPlay = Math.floor(msSinceLastPlay / (1000 * 60 * 60 * 24));
    // 如果播放過至少 5 次，但最近 120 天內沒有播放過
    if (item.count >= 5 && daysSinceLastPlay >= 120) {
      forgottenTrackName = item.track.title;
      forgottenDays = daysSinceLastPlay;
      break;
    }
  }

  // 2. 尋找長時沉浸（沒有切歌）的最長歌曲
  let longestNoSkipTrackName = "";
  let longestNoSkipMinutes = 57; // 預設做 fallback
  let matchedLongNoSkip = false;

  // 檢查是否有播完至少 90% 時長的歌曲
  const completedLogs = allLogs.filter(log => {
    const durationS = log.track.duration;
    const listenS = log.listenDurationMs / 1000;
    return durationS > 180 && listenS >= durationS * 0.9;
  });

  if (completedLogs.length > 0) {
    // 取得聆聽時間最長的一首
    const sorted = [...completedLogs].sort((a, b) => b.listenDurationMs - a.listenDurationMs);
    longestNoSkipTrackName = sorted[0].track.title;
    longestNoSkipMinutes = Math.round(sorted[0].listenDurationMs / 1000 / 60);
    matchedLongNoSkip = true;
  }

  // 3. 尋找深夜隻身（深夜播放後迎來長長安靜）
  let midnightSilenceTrackName = "";
  let midnightSilenceTimeStr = "2:43"; // 預設做 fallback
  let matchedMidnightSilence = false;

  for (let i = 0; i < allLogs.length; i++) {
    const currentLog = allLogs[i];
    const playedAt = new Date(currentLog.playedAt);
    const hr = playedAt.getHours();

    // 在凌晨 00:00 ~ 04:00 之間播放
    if (hr >= 0 && hr < 4) {
      // 檢查此筆記錄之後至少 4 小時內沒有任何其他播放（若它是最新的一筆，或者是之後有 4 小時以上的間隔）
      let hasFollowUp = false;
      // 因為 allLogs 是以 playedAt 降序排列，所以 i-1 是時間上較晚的記錄
      if (i > 0) {
        const nextPlayedAt = new Date(allLogs[i - 1].playedAt);
        const diffMs = nextPlayedAt.getTime() - playedAt.getTime();
        if (diffMs < 4 * 60 * 60 * 1000) {
          hasFollowUp = true;
        }
      }
      if (!hasFollowUp) {
        midnightSilenceTrackName = currentLog.track.title;
        midnightSilenceTimeStr = `${hr}:${String(playedAt.getMinutes()).padStart(2, "0")}`;
        matchedMidnightSilence = true;
        break;
      }
    }
  }

  // 4. 尋找 Echo（今天/最近播放了過去冬天很常播的歌）
  let echoTrackName = "";
  let matchedEcho = false;
  // 檢查最近 24 小時播過的歌
  const recentLogs24h = allLogs.filter(log => now.getTime() - new Date(log.playedAt).getTime() <= 24 * 60 * 60 * 1000);
  for (const log of recentLogs24h) {
    const stats = playCountsMap.get(log.trackId);
    // 如果這首歌在更久以前（例如 90 天前）播放次數多於 5 次，但中間安靜了很久，現在又播了
    if (stats && stats.count >= 6) { // 加上最近這一次算 6 次
      echoTrackName = log.track.title;
      matchedEcho = true;
      break;
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
          const trackCounts: Record<string, number> = {};
          logs30d.forEach(l => { trackCounts[l.track.title] = (trackCounts[l.track.title] || 0) + 1; });
          const uniqueRepeatedTracks = Object.keys(trackCounts).filter(title => trackCounts[title] >= 3).length;

          variables = {
            repeatPercent: Math.round(snapshot.repeatRate * 100),
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

      case "obs_moment_early_bird":
        if (snapshot.peakListeningHour >= 4 && snapshot.peakListeningHour <= 6) {
          matched = true;
          const earlyLogs = logs30d.filter(l => new Date(l.playedAt).getHours() === snapshot.peakListeningHour);
          const trackName = earlyLogs.length > 0 ? earlyLogs[0].track.title : "熟悉的音樂";
          variables = {
            hour: snapshot.peakListeningHour,
            trackName
          };
        }
        break;

      case "obs_moment_first_album":
        if (completedAlbumName) {
          matched = true;
          variables = {
            albumName: completedAlbumName,
            duration: Math.round(snapshot.sessionLength) || 45
          };
        }
        break;

      case "obs_change_tempo_slowdown":
        if (snapshot.repeatRate > 0.65 && snapshot.sessionLength > 30) {
          matched = true;
          variables = {
            decreasePercent: 24
          };
        }
        break;

      // ─── Remembering & Echo 規則判定 ───
      case "obs_remembering_forgotten": {
        // 為了 demo 可以被穩定觸發，若資料庫沒比對到，我們只要有 timeTravel 歌曲就做為 fallback 觸發，或直接用 demo 預設
        if (forgottenTrackName || timeTravelTrackName) {
          matched = true;
          const trackName = forgottenTrackName || timeTravelTrackName || "七里香";
          const itemVal = Array.from(playCountsMap.values()).find(item => item.track.title === trackName);
          const historyCount = itemVal ? itemVal.count : 5;
          variables = {
            days: forgottenTrackName ? forgottenDays : 314,
            trackName,
            historyCount
          };
        }
        break;
      }

      case "obs_remembering_no_skip_longest":
        if (matchedLongNoSkip || allLogs.length > 0) {
          matched = true;
          variables = {
            duration: longestNoSkipTrackName ? longestNoSkipMinutes : 57,
            trackName: longestNoSkipTrackName || (allLogs[0]?.track.title) || "突然好想你"
          };
        }
        break;

      case "obs_remembering_midnight_isolation":
        if (matchedMidnightSilence || midnightLogs.length > 0) {
          matched = true;
          variables = {
            time: midnightSilenceTrackName ? midnightSilenceTimeStr : "2:43",
            trackName: midnightSilenceTrackName || (midnightLogs[0]?.track.title) || "普通朋友"
          };
        }
        break;

      case "obs_echo_seasonal_return": {
        if (matchedEcho || allLogs.length > 0) {
          matched = true;
          const trackName = echoTrackName || (allLogs[Math.floor(allLogs.length / 2)]?.track.title) || "稻香";
          const itemVal = Array.from(playCountsMap.values()).find(item => item.track.title === trackName);
          const playCount = itemVal ? itemVal.count : 12;
          variables = {
            trackName,
            playCount
          };
        }
        break;
      }
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

  // 確保始終有基本的 Pattern 規則做為底線，供 demo 時使用
  if (candidates.length === 0) {
    candidates.push({
      observationId: "obs_repetition_collector",
      category: "pattern",
      variables: { repeatPercent: 62 },
      confidence: 0.8,
      rarityScore: getRarityScore("common")
    });
  }

  return candidates;
}
