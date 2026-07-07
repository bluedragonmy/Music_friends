// =============================================================================
// UserProjection — 用戶已知世界投影 (動態投影，包含聽歌行為證據)
// =============================================================================

import { UserListeningProfile } from "../repositories/listening";
import { SEED_ENTITIES } from "./entity";

export interface ListeningEvidence {
  readonly type: "play_count" | "recency" | "playlist_presence";
  readonly value: string;      // 例如 "listened 43 times", "last listened yesterday"
  readonly timestamp: Date;
}

export interface KnownEntity {
  readonly entityId: string;
  readonly evidence: readonly ListeningEvidence[];
}

export interface UserProjection {
  readonly userId: string;
  readonly email: string;
  readonly entities: Record<string, KnownEntity>; // 投影出來的已知實體 ID 及其行為證據映射
}

export interface ProjectionOptions {
  readonly timeWindowDays?: number; // 投影時間窗口 (Time Window)
}

export class UserProjectionBuilder {
  /**
   * 核心產品概念：將原始聆聽歷史，動態投影 (Project) 到世界模型的節點上，並附加行為證據。
   */
  static buildProjection(
    profile: UserListeningProfile,
    options: ProjectionOptions = {}
  ): UserProjection {
    const entities: Record<string, { entityId: string; evidence: ListeningEvidence[] }> = {};

    // 設定時間篩選門檻
    let cutoffDate: Date | null = null;
    if (options.timeWindowDays) {
      cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - options.timeWindowDays);
    }

    function addEvidence(artistName: string, type: ListeningEvidence["type"], value: string, timestamp: Date) {
      if (cutoffDate && timestamp < cutoffDate) {
        return;
      }

      // 尋找世界模型中是否有對應藝人
      const matchedEntity = SEED_ENTITIES.find(
        (e) => e.name.toLowerCase() === artistName.toLowerCase() ||
               e.aliases?.some(a => a.toLowerCase() === artistName.toLowerCase())
      );

      if (matchedEntity) {
        if (!entities[matchedEntity.id]) {
          entities[matchedEntity.id] = {
            entityId: matchedEntity.id,
            evidence: [],
          };
        }
        
        entities[matchedEntity.id].evidence.push({
          type,
          value,
          timestamp,
        });
      }
    }

    // 1. 投影 Playlist Tracks (當作 30 天前的歷史行為，產生 playlist_presence 證據)
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 30);
    profile.playlistTracks.forEach((pt) => {
      addEvidence(
        pt.track.artist,
        "playlist_presence",
        `present in playlist "${pt.track.artist} - Top Tracks"`,
        baseDate
      );
    });

    // 2. 投影 Sync Logs (視為即時/當前聆聽行為，產生 play_count / recency 證據)
    const logDate = new Date();
    
    // 統計各藝人次數
    const syncCountMap: Record<string, number> = {};
    profile.syncLogs.forEach((log) => {
      syncCountMap[log.track.artist] = (syncCountMap[log.track.artist] || 0) + 1;
    });

    profile.syncLogs.forEach((log) => {
      addEvidence(
        log.track.artist,
        "recency",
        `last listened at ${logDate.toLocaleDateString()}`,
        logDate
      );
    });

    Object.entries(syncCountMap).forEach(([artist, count]) => {
      addEvidence(
        artist,
        "play_count",
        `listened ${count} times recently`,
        logDate
      );
    });

    return {
      userId: profile.id,
      email: profile.email,
      entities,
    };
  }
}
