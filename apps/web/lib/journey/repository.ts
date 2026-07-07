import { prisma } from "../prisma";

export const JournalRepository = {
  async getUserBehaviorSnapshot(userId: string, window: string) {
    return prisma.behaviorSnapshot.findUnique({
      where: { userId_window: { userId, window } },
    });
  },

  async getUserSyncLogs(userId: string, startDate?: Date, endDate?: Date) {
    return prisma.syncLog.findMany({
      where: {
        userId,
        playedAt: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      },
      include: {
        track: {
          include: {
            audioFeature: true,
          },
        },
      },
      orderBy: { playedAt: "desc" },
    });
  },

  async getUserLikes(userId: string, trackIds: string[], olderThan?: Date) {
    return prisma.like.findMany({
      where: {
        userId,
        trackId: { in: trackIds },
        ...(olderThan && { createdAt: { lt: olderThan } }),
      },
      include: { track: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async getJournalTimeline(userId: string) {
    return prisma.journalEntry.findMany({
      where: { userId },
      include: {
        analytics: true,
      },
      orderBy: { date: "desc" },
    });
  },

  async getJournalEntry(id: string) {
    return prisma.journalEntry.findUnique({
      where: { id },
      include: {
        analytics: true,
      },
    });
  },

  async createJournalEntry(data: {
    userId: string;
    date: Date;
    observationId: string;
    title: string;
    body: string;
    evidence: any;
    reflection: string;
  }) {
    return prisma.journalEntry.create({
      data: {
        userId: data.userId,
        date: data.date,
        observationId: data.observationId,
        title: data.title,
        body: data.body,
        evidence: data.evidence,
        reflection: data.reflection,
      },
    });
  },

  async updateJournalFeedback(id: string, feedback: string, evidenceUpdate?: any) {
    const updateData: any = {
      feedback,
      feedbackAt: new Date(),
    };
    if (evidenceUpdate) {
      updateData.evidence = evidenceUpdate;
    }
    return prisma.journalEntry.update({
      where: { id },
      data: updateData,
    });
  },

  async recordJournalView(journalId: string, readTimeMs: number) {
    const existing = await prisma.journalAnalytics.findUnique({
      where: { journalId },
    });

    if (!existing) {
      return prisma.journalAnalytics.create({
        data: {
          journalId,
          viewCount: 1,
          avgReadTime: readTimeMs / 1000,
          lastViewedAt: new Date(),
        },
      });
    } else {
      const newViewCount = existing.viewCount + 1;
      const newAvgReadTime = (existing.avgReadTime * existing.viewCount + (readTimeMs / 1000)) / newViewCount;
      return prisma.journalAnalytics.update({
        where: { journalId },
        data: {
          viewCount: newViewCount,
          avgReadTime: newAvgReadTime,
          lastViewedAt: new Date(),
        },
      });
    }
  },
};

// ── BehaviorBaselineProvider: SyncLog Rolling Window 實作 ──────
// Narrative Engine 不知道這個 Provider 的存在方式。
// 它只透過 BehaviorBaselineProvider interface 取得 baseline。
// 未來替換為 Redis / Cache / Materialized View 時，只換這個 class。

import type { BehaviorBaseline, BehaviorBaselineProvider } from "./types";
import {
  observeListeningHistory,
  measureNovelty,
  measureRepeatRate,
  measureGenreDiversity,
} from "../behavioral-engine";

export class SyncLogBaselineProvider implements BehaviorBaselineProvider {
  async getBaseline(userId: string, referenceDate: Date = new Date()): Promise<BehaviorBaseline> {
    const WINDOW_DAYS = 7;
    const WINDOW_COUNT = 4; // 4 個窗口 = 28 天歷史
    const totalDays = WINDOW_DAYS * WINDOW_COUNT;

    const windowStart = new Date(referenceDate.getTime() - totalDays * 24 * 60 * 60 * 1000);

    // 一次取出所有 28 天的 SyncLog
    const allLogs = await observeListeningHistory(userId, windowStart, referenceDate);

    if (allLogs.length === 0) {
      return {
        mean: { novelty: 0.5, repeatRate: 0.5, genreDiversity: 0.5 },
        std: { novelty: 0, repeatRate: 0, genreDiversity: 0 },
        sampleCount: 0,
      };
    }

    // 切分為 WINDOW_COUNT 個非重疊窗口
    const windows: { novelty: number; repeatRate: number; genreDiversity: number }[] = [];

    for (let i = 0; i < WINDOW_COUNT; i++) {
      const wStart = new Date(referenceDate.getTime() - (WINDOW_COUNT - i) * WINDOW_DAYS * 24 * 60 * 60 * 1000);
      const wEnd = new Date(wStart.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000);

      const windowLogs = allLogs.filter(
        (log) => log.playedAt >= wStart && log.playedAt < wEnd
      );

      if (windowLogs.length < 3) continue; // 太少紀錄的窗口跳過

      // 該窗口之前的所有曲目作為 prior（用於 novelty 計算）
      const priorTrackIds = new Set(
        allLogs.filter((log) => log.playedAt < wStart).map((log) => log.trackId)
      );

      windows.push({
        novelty: measureNovelty(windowLogs, priorTrackIds),
        repeatRate: measureRepeatRate(windowLogs),
        genreDiversity: measureGenreDiversity(windowLogs),
      });
    }

    if (windows.length === 0) {
      return {
        mean: { novelty: 0.5, repeatRate: 0.5, genreDiversity: 0.5 },
        std: { novelty: 0, repeatRate: 0, genreDiversity: 0 },
        sampleCount: 0,
      };
    }

    // 計算 Rolling Mean
    const mean = {
      novelty: windows.reduce((s, w) => s + w.novelty, 0) / windows.length,
      repeatRate: windows.reduce((s, w) => s + w.repeatRate, 0) / windows.length,
      genreDiversity: windows.reduce((s, w) => s + w.genreDiversity, 0) / windows.length,
    };

    // 計算 Rolling Std
    const std = {
      novelty: Math.sqrt(windows.reduce((s, w) => s + (w.novelty - mean.novelty) ** 2, 0) / windows.length),
      repeatRate: Math.sqrt(windows.reduce((s, w) => s + (w.repeatRate - mean.repeatRate) ** 2, 0) / windows.length),
      genreDiversity: Math.sqrt(windows.reduce((s, w) => s + (w.genreDiversity - mean.genreDiversity) ** 2, 0) / windows.length),
    };

    return { mean, std, sampleCount: windows.length };
  }
}

