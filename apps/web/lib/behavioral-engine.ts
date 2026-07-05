import { prisma } from "./prisma";

export interface ObservedLog {
  trackId: string;
  playedAt: Date;
  listenDurationMs: number;
  genres: string | null;
  popularity: number | null;
  audioFeature: {
    acousticness: number;
    danceability: number;
    energy: number;
    instrumentalness: number;
    liveness: number;
    loudness: number;
    speechiness: number;
    tempo: number;
    valence: number;
  } | null;
}

// 1. Observe Phase: Retrieve raw listening records
export async function observeListeningHistory(
  userId: string,
  startDate: Date | null,
  endDate: Date
): Promise<ObservedLog[]> {
  const whereClause: any = { userId };
  if (startDate) {
    whereClause.playedAt = {
      gte: startDate,
      lte: endDate,
    };
  } else {
    whereClause.playedAt = {
      lte: endDate,
    };
  }

  const logs = await prisma.syncLog.findMany({
    where: whereClause,
    orderBy: { playedAt: "asc" },
    include: {
      track: {
        include: {
          audioFeature: true,
        },
      },
    },
  });

  return logs.map((log) => ({
    trackId: log.trackId,
    playedAt: log.playedAt,
    listenDurationMs: log.listenDurationMs,
    genres: log.track.genres,
    popularity: log.track.popularity,
    audioFeature: log.track.audioFeature
      ? {
          acousticness: log.track.audioFeature.acousticness,
          danceability: log.track.audioFeature.danceability,
          energy: log.track.audioFeature.energy,
          instrumentalness: log.track.audioFeature.instrumentalness,
          liveness: log.track.audioFeature.liveness,
          loudness: log.track.audioFeature.loudness,
          speechiness: log.track.audioFeature.speechiness,
          tempo: log.track.audioFeature.tempo,
          valence: log.track.audioFeature.valence,
        }
      : null,
  }));
}

// 2. Measure Phase: Individual metrics implementation

// 2.1 Measure Novelty: 0.0 ~ 1.0
export function measureNovelty(
  targetLogs: ObservedLog[],
  userHistoryTrackIdsPrior: Set<string>
): number {
  if (targetLogs.length === 0) return 0.0;

  const uniqueTracksInPeriod = new Set(targetLogs.map((log) => log.trackId));
  let novelTracksCount = 0;

  for (const trackId of uniqueTracksInPeriod) {
    if (!userHistoryTrackIdsPrior.has(trackId)) {
      novelTracksCount++;
    }
  }

  return novelTracksCount / uniqueTracksInPeriod.size;
}

// 2.2 Measure Repeat Rate: 0.0 ~ 1.0
export function measureRepeatRate(targetLogs: ObservedLog[]): number {
  const totalPlays = targetLogs.length;
  if (totalPlays === 0) return 0.0;

  const playCounts: Record<string, number> = {};
  for (const log of targetLogs) {
    playCounts[log.trackId] = (playCounts[log.trackId] || 0) + 1;
  }

  // Definition: Sum of play counts of tracks played 3 or more times
  let repeatedPlays = 0;
  for (const count of Object.values(playCounts)) {
    if (count >= 3) {
      repeatedPlays += count;
    }
  }

  return repeatedPlays / totalPlays;
}

// 2.3 Measure Genre Diversity: 0.0 ~ 1.0
export function measureGenreDiversity(targetLogs: ObservedLog[]): number {
  const genreCounts: Record<string, number> = {};
  let totalGenresCount = 0;

  for (const log of targetLogs) {
    if (log.genres) {
      const genresList = log.genres.split(",").map((g) => g.trim());
      for (const g of genresList) {
        if (g) {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
          totalGenresCount++;
        }
      }
    }
  }

  if (totalGenresCount === 0) return 0.0;

  // Calculate Shannon Entropy
  let entropy = 0.0;
  for (const count of Object.values(genreCounts)) {
    const p = count / totalGenresCount;
    entropy -= p * Math.log2(p);
  }

  // Normalize using maximum expected entropy of 5.0
  const maxExpectedEntropy = 5.0;
  return Math.min(1.0, entropy / maxExpectedEntropy);
}

// 2.4 Measure Peak Listening Hour: 0 ~ 23
export function measurePeakListeningHour(targetLogs: ObservedLog[]): number {
  if (targetLogs.length === 0) return 0;

  // 24 bins for local hours
  const hourlyDistribution = new Array(24).fill(0);

  for (const log of targetLogs) {
    // get user local hour (we fall back to system time here, presentation layers should adjust local timezone)
    const localHour = log.playedAt.getHours();
    hourlyDistribution[localHour] += log.listenDurationMs;
  }

  let maxDuration = 0;
  let peakHour = 0;

  for (let i = 0; i < 24; i++) {
    const windowSum = hourlyDistribution[i] + hourlyDistribution[(i + 1) % 24];
    if (windowSum > maxDuration) {
      maxDuration = windowSum;
      peakHour = i;
    }
  }

  return peakHour;
}

// 2.5 Measure Session Length: minutes (Float)
export function measureSessionLength(targetLogs: ObservedLog[]): number {
  if (targetLogs.length === 0) return 0.0;

  // Sort logs chronologically
  const sortedLogs = [...targetLogs].sort(
    (a, b) => a.playedAt.getTime() - b.playedAt.getTime()
  );

  const sessions: number[] = [];
  let currentStart = sortedLogs[0].playedAt;
  let currentEnd = new Date(currentStart.getTime() + sortedLogs[0].listenDurationMs);

  const SESSION_GAP_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
  const MAX_SESSION_LENGTH_MINUTES = 240.0; // 4 hour cap to exclude background loops

  for (let i = 1; i < sortedLogs.length; i++) {
    const log = sortedLogs[i];
    const logStart = log.playedAt;

    if (logStart.getTime() - currentEnd.getTime() <= SESSION_GAP_THRESHOLD_MS) {
      currentEnd = new Date(logStart.getTime() + log.listenDurationMs);
    } else {
      // Conclude session, calculate minutes, apply cap
      const sessionMin = (currentEnd.getTime() - currentStart.getTime()) / 60000;
      sessions.push(Math.min(MAX_SESSION_LENGTH_MINUTES, Math.max(0.1, sessionMin)));

      currentStart = logStart;
      currentEnd = new Date(logStart.getTime() + log.listenDurationMs);
    }
  }

  const lastSessionMin = (currentEnd.getTime() - currentStart.getTime()) / 60000;
  sessions.push(Math.min(MAX_SESSION_LENGTH_MINUTES, Math.max(0.1, lastSessionMin)));

  const sum = sessions.reduce((acc, val) => acc + val, 0);
  return sum / sessions.length;
}

// 2.6 Calculate Confidence: 0.0 ~ 1.0 (Coverage * Consistency * Recency)
export function calculateConfidence(
  targetLogs: ObservedLog[],
  windowDays: number,
  now: Date
): number {
  if (targetLogs.length === 0) return 0.0;

  // Coverage: minimum 50 track play events in the window to be 100% covered
  const coverage = Math.min(1.0, targetLogs.length / 50);

  // Consistency: number of unique active days in this window divided by active expectation
  const activeDays = new Set(
    targetLogs.map((log) => log.playedAt.toDateString())
  ).size;
  const expectedDays = Math.min(windowDays, 30);
  const consistency = Math.min(1.0, activeDays / expectedDays);

  // Recency: decay confidence if user has not listened recently (half-life of 7 days)
  const latestLog = targetLogs[targetLogs.length - 1];
  const daysSinceLatestLog = Math.max(
    0,
    (now.getTime() - latestLog.playedAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const recency = Math.exp(-daysSinceLatestLog / 7.0);

  return coverage * consistency * recency;
}

// 3. Compose Phase: calculate all and upsert BehaviorSnapshot
export async function composeBehaviorSnapshot(
  userId: string,
  window: "7d" | "30d" | "90d" | "all-time",
  now: Date = new Date()
) {
  let startDate: Date | null = null;
  let windowDays = 30;

  if (window === "7d") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    windowDays = 7;
  } else if (window === "30d") {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    windowDays = 30;
  } else if (window === "90d") {
    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    windowDays = 90;
  } else if (window === "all-time") {
    startDate = null;
    windowDays = 365; // fall back to 1 year for expectation
  }

  // Observe
  const targetLogs = await observeListeningHistory(userId, startDate, now);

  // Load user track history prior to this window for novelty detection
  const priorLogs = await prisma.syncLog.findMany({
    where: {
      userId,
      ...(startDate && { playedAt: { lt: startDate } }),
    },
    select: { trackId: true },
  });
  const priorTrackIds = new Set(priorLogs.map((l) => l.trackId));

  // Measure
  const novelty = measureNovelty(targetLogs, priorTrackIds);
  const repeatRate = measureRepeatRate(targetLogs);
  const genreDiversity = measureGenreDiversity(targetLogs);
  const sessionLength = measureSessionLength(targetLogs);
  const peakListeningHour = measurePeakListeningHour(targetLogs);
  const confidence = calculateConfidence(targetLogs, windowDays, now);

  // Persist
  const snapshot = await prisma.behaviorSnapshot.upsert({
    where: {
      userId_window: {
        userId,
        window,
      },
    },
    update: {
      novelty,
      repeatRate,
      genreDiversity,
      sessionLength,
      peakListeningHour,
      confidence,
      calculatedAt: now,
    },
    create: {
      userId,
      window,
      novelty,
      repeatRate,
      genreDiversity,
      sessionLength,
      peakListeningHour,
      confidence,
      calculatedAt: now,
    },
  });

  return snapshot;
}
