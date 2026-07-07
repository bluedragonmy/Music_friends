// =============================================================================
// ListeningRepository — 封裝資料庫存取，隔離 Prisma 與上層服務
// =============================================================================

import { PrismaClient } from "../../app/generated/prisma-new";

const prisma = new PrismaClient();

export interface TrackData {
  readonly id: string;
  readonly title: string;
  readonly artist: string;
  readonly album: string | null;
}

export interface PlaylistTrackWithTrack {
  readonly id: string;
  readonly track: TrackData;
}

export interface SyncLogWithTrack {
  readonly id: string;
  readonly track: TrackData;
}

export interface UserListeningProfile {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly playlistTracks: readonly PlaylistTrackWithTrack[];
  readonly syncLogs: readonly SyncLogWithTrack[];
}

export class ListeningRepository {
  /**
   * 獲取使用者的聆聽歷史與特定歌單歌曲 (用於計算 Known World)。
   */
  static async getListeningProfileByEmail(email: string): Promise<UserListeningProfile | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        playlists: {
          where: { name: "My Spotify Top Tracks" },
          include: {
            tracks: {
              include: { track: true }
            }
          }
        },
        syncLogs: {
          include: { track: true }
        }
      }
    });

    if (!user) return null;

    // 映射為無 Prisma 相依的乾淨介面
    const playlistTracks: PlaylistTrackWithTrack[] = (user.playlists?.[0]?.tracks || []).map((pt) => ({
      id: pt.id,
      track: {
        id: pt.track.id,
        title: pt.track.title,
        artist: pt.track.artist,
        album: pt.track.album,
      }
    }));

    const syncLogs: SyncLogWithTrack[] = (user.syncLogs || []).map((log) => ({
      id: log.id,
      track: {
        id: log.track.id,
        title: log.track.title,
        artist: log.track.artist,
        album: log.track.album,
      }
    }));

    return {
      id: user.id,
      email: user.email || "",
      name: user.name,
      playlistTracks,
      syncLogs,
    };
  }

  /**
   * 探索性的 Mock 方法，提供明日世界 (Tomorrow's World) 的通用擴展介面。
   */
  static async getRecentTracks(userId: string): Promise<readonly TrackData[]> {
    throw new Error("Method not implemented.");
  }

  static async getTopArtists(userId: string): Promise<readonly string[]> {
    throw new Error("Method not implemented.");
  }

  static async getTopAlbums(userId: string): Promise<readonly string[]> {
    throw new Error("Method not implemented.");
  }

  static async getListeningHistory(userId: string): Promise<readonly TrackData[]> {
    throw new Error("Method not implemented.");
  }
}
