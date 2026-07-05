/**
 * μ(sic) Inference Engine v1
 * 
 * Rule-based deterministic inference.
 * Every Listening Identity is an estimation, not a fact.
 * 
 * Architecture: BehaviorSnapshot → IdentityDefinition[] → IdentityResult[]
 * 
 * Adding a new Identity requires only adding a new IdentityDefinition.
 * The engine itself never needs modification.
 */

import { prisma } from "./prisma";

// ─── Types ──────────────────────────────────────────────────────────

export interface BehaviorInput {
  novelty: number;
  repeatRate: number;
  genreDiversity: number;
  sessionLength: number;
  peakListeningHour: number;
  confidence: number;
}

export interface AudioFeatureAverages {
  acousticness: number;
  danceability: number;
  energy: number;
  instrumentalness: number;
  liveness: number;
  loudness: number;
  speechiness: number;
  tempo: number;
  valence: number;
}

export interface BehaviorWeight {
  behavior: keyof BehaviorInput | string;
  weight: number;
  /** Custom resolver for behaviors that aren't simple linear weights */
  resolve?: (input: BehaviorInput, audio: AudioFeatureAverages | null) => number;
}

export interface IdentityDefinition {
  id: string;
  displayName: string;
  behaviors: BehaviorWeight[];
  why: (input: BehaviorInput, audio: AudioFeatureAverages | null) => string;
  reflection: string;
}

export interface IdentityResult {
  id: string;
  displayName: string;
  score: number;         // 0.0 ~ 1.0 raw
  confidence: number;    // 0.0 ~ 1.0 raw
  why: string;
  reflection: string;
  engineVersion: string;
}

// ─── Engine Version ─────────────────────────────────────────────────

export const ENGINE_VERSION = "v1";

// ─── Identity Definitions Registry ──────────────────────────────────

export const IDENTITY_DEFINITIONS: IdentityDefinition[] = [
  {
    id: "explorer",
    displayName: "Explorer",
    behaviors: [
      { behavior: "novelty", weight: 0.6 },
      { behavior: "genreDiversity", weight: 0.4 },
    ],
    why: (input) => {
      const noveltyPct = Math.round(input.novelty * 100);
      const diversityPct = Math.round(input.genreDiversity * 100);
      return `You often listen to unfamiliar artists (${noveltyPct}% new tracks) and maintain a broad genre range (${diversityPct}% diversity).`;
    },
    reflection: "When was the last time a song changed your perspective?",
  },
  {
    id: "collector",
    displayName: "Collector",
    behaviors: [
      { behavior: "repeatRate", weight: 1.0 },
    ],
    why: (input) => {
      const repeatPct = Math.round(input.repeatRate * 100);
      return `You return to specific songs repeatedly (${repeatPct}% repeat rate), building a personal archive of meaningful sounds.`;
    },
    reflection: "Which song has stayed with you the longest?",
  },
  {
    id: "night-owl",
    displayName: "Night Owl",
    behaviors: [
      {
        behavior: "peakListeningHour",
        weight: 1.0,
        resolve: (input) => {
          const hour = input.peakListeningHour;
          if ((hour >= 22 && hour <= 23) || (hour >= 0 && hour <= 5)) return 1.0;
          if ((hour >= 20 && hour <= 21) || (hour >= 6 && hour <= 7)) return 0.5;
          return 0.0;
        },
      },
    ],
    why: (input) => {
      const hour = input.peakListeningHour;
      const startStr = String(hour).padStart(2, "0");
      const endStr = String((hour + 2) % 24).padStart(2, "0");
      return `Your listening peaks during the quiet hours (${startStr}:00 ~ ${endStr}:00).`;
    },
    reflection: "Why do quiet hours feel different with music?",
  },
  {
    id: "emotion-driven",
    displayName: "Emotion Driven",
    behaviors: [
      {
        behavior: "audioFeatures",
        weight: 1.0,
        resolve: (_input, audio) => {
          if (!audio) return 0.0;
          return audio.acousticness * 0.3 + (1.0 - audio.valence) * 0.4 + (1.0 - audio.energy) * 0.3;
        },
      },
    ],
    why: (_input, audio) => {
      if (!audio) return "Insufficient audio data to determine emotional listening patterns.";
      const acousticPct = Math.round(audio.acousticness * 100);
      const valencePct = Math.round(audio.valence * 100);
      return `Your music choices lean toward acoustic sounds (${acousticPct}% acousticness) with introspective tones (${valencePct}% valence).`;
    },
    reflection: "Do you choose music, or does your mood choose it for you?",
  },
];

// ─── Representativeness Calculator ──────────────────────────────────

export function calculateRepresentativeness(
  totalPlayCount: number,
  uniqueTrackCount: number
): number {
  if (totalPlayCount === 0) return 0.0;
  return Math.min(1.0, uniqueTrackCount / Math.min(totalPlayCount, 10));
}

// ─── Core Inference Function ────────────────────────────────────────

export function inferIdentity(
  definition: IdentityDefinition,
  behaviorInput: BehaviorInput,
  audioAverages: AudioFeatureAverages | null
): IdentityResult {
  let score = 0.0;

  for (const bw of definition.behaviors) {
    if (bw.resolve) {
      // Custom resolver (e.g. Night Owl hour-range logic, Emotion Driven audio features)
      score += bw.resolve(behaviorInput, audioAverages) * bw.weight;
    } else {
      // Standard linear weight from BehaviorInput
      const behaviorValue = behaviorInput[bw.behavior as keyof BehaviorInput];
      if (typeof behaviorValue === "number") {
        score += behaviorValue * bw.weight;
      }
    }
  }

  // Clamp to [0, 1]
  score = Math.max(0.0, Math.min(1.0, score));

  return {
    id: definition.id,
    displayName: definition.displayName,
    score,
    confidence: behaviorInput.confidence,
    why: definition.why(behaviorInput, audioAverages),
    reflection: definition.reflection,
    engineVersion: ENGINE_VERSION,
  };
}

// ─── Batch Inference ────────────────────────────────────────────────

export function inferAllIdentities(
  behaviorInput: BehaviorInput,
  audioAverages: AudioFeatureAverages | null,
  definitions: IdentityDefinition[] = IDENTITY_DEFINITIONS
): IdentityResult[] {
  return definitions.map((def) => inferIdentity(def, behaviorInput, audioAverages));
}

// ─── Audio Feature Averages Helper ──────────────────────────────────

export async function computeAudioFeatureAverages(
  userId: string,
  startDate: Date | null,
  endDate: Date
): Promise<AudioFeatureAverages | null> {
  const whereClause: any = { userId };
  if (startDate) {
    whereClause.playedAt = { gte: startDate, lte: endDate };
  } else {
    whereClause.playedAt = { lte: endDate };
  }

  const logs = await prisma.syncLog.findMany({
    where: whereClause,
    include: {
      track: {
        include: { audioFeature: true },
      },
    },
  });

  const features = logs
    .map((log) => log.track.audioFeature)
    .filter((f): f is NonNullable<typeof f> => f !== null);

  if (features.length === 0) return null;

  const sum = {
    acousticness: 0, danceability: 0, energy: 0, instrumentalness: 0,
    liveness: 0, loudness: 0, speechiness: 0, tempo: 0, valence: 0,
  };

  for (const f of features) {
    sum.acousticness += f.acousticness;
    sum.danceability += f.danceability;
    sum.energy += f.energy;
    sum.instrumentalness += f.instrumentalness;
    sum.liveness += f.liveness;
    sum.loudness += f.loudness;
    sum.speechiness += f.speechiness;
    sum.tempo += f.tempo;
    sum.valence += f.valence;
  }

  const n = features.length;
  return {
    acousticness: sum.acousticness / n,
    danceability: sum.danceability / n,
    energy: sum.energy / n,
    instrumentalness: sum.instrumentalness / n,
    liveness: sum.liveness / n,
    loudness: sum.loudness / n,
    speechiness: sum.speechiness / n,
    tempo: sum.tempo / n,
    valence: sum.valence / n,
  };
}

// ─── Full Pipeline: Compose Identity Snapshots ──────────────────────

export async function composeIdentitySnapshots(
  userId: string,
  window: "7d" | "30d" | "90d" | "all-time",
  now: Date = new Date()
) {
  // 1. Read behavior snapshot
  const snapshot = await prisma.behaviorSnapshot.findUnique({
    where: { userId_window: { userId, window } },
  });

  if (!snapshot) {
    console.log(`[Inference Engine] No BehaviorSnapshot found for user ${userId} window ${window}. Skipping.`);
    return [];
  }

  // 2. Compute audio feature averages
  let startDate: Date | null = null;
  if (window === "7d") startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  else if (window === "30d") startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  else if (window === "90d") startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const audioAverages = await computeAudioFeatureAverages(userId, startDate, now);

  // 3. Build behavior input
  const behaviorInput: BehaviorInput = {
    novelty: snapshot.novelty,
    repeatRate: snapshot.repeatRate,
    genreDiversity: snapshot.genreDiversity,
    sessionLength: snapshot.sessionLength,
    peakListeningHour: snapshot.peakListeningHour,
    confidence: snapshot.confidence,
  };

  // 4. Compute representativeness and upgrade confidence
  const logStats = await prisma.syncLog.aggregate({
    where: {
      userId,
      ...(startDate && { playedAt: { gte: startDate, lte: now } }),
    },
    _count: { id: true },
  });
  const uniqueTracksCount = await prisma.syncLog.findMany({
    where: {
      userId,
      ...(startDate && { playedAt: { gte: startDate, lte: now } }),
    },
    distinct: ["trackId"],
    select: { trackId: true },
  });

  const representativeness = calculateRepresentativeness(
    logStats._count.id,
    uniqueTracksCount.length
  );

  // Upgrade confidence with representativeness (4-factor)
  behaviorInput.confidence = behaviorInput.confidence * representativeness;

  // 5. Infer all identities
  const results = inferAllIdentities(behaviorInput, audioAverages);

  // 6. Persist to IdentitySnapshot
  for (const result of results) {
    await prisma.identitySnapshot.upsert({
      where: {
        userId_window_identityId: { userId, window, identityId: result.id },
      },
      update: {
        score: result.score,
        confidence: result.confidence,
        why: result.why,
        reflection: result.reflection,
        engineVersion: result.engineVersion,
        calculatedAt: now,
      },
      create: {
        userId,
        window,
        identityId: result.id,
        displayName: result.displayName,
        score: result.score,
        confidence: result.confidence,
        why: result.why,
        reflection: result.reflection,
        engineVersion: result.engineVersion,
        calculatedAt: now,
      },
    });
  }

  console.log(`[Inference Engine v1] Computed ${results.length} identities for user ${userId} window ${window}`);
  return results;
}
