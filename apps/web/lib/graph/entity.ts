// =============================================================================
// Entity — Music Knowledge Graph 的節點定義
// =============================================================================

/**
 * 圖譜中支援的實體類別。
 *
 * v1.2 聚焦在真實音樂世界的客觀實體與事件。
 */
export type EntityType = "artist" | "producer" | "album" | "song" | "label" | "genre" | "event";

/**
 * 實體的可信度 (Confidence)。
 *
 * 未來 Discovery Card 可以讓使用者一眼看清資料的可信來源。
 */
export type EntityConfidence = "verified" | "unverified" | "community_contributed";

/**
 * 圖譜中的一個節點。
 *
 * 每個 Entity 代表一個真實存在的音樂世界實體或事件。
 */
export interface Entity {
  readonly id: string;
  readonly name: string;
  readonly type: EntityType;
  readonly aliases?: readonly string[];                 // 別名，例如 ["이오공"]
  readonly country?: string;                            // 國家，例如 "KR", "US"
  readonly roles?: readonly string[];                   // 角色，例如 ["producer", "dj"]
  readonly links?: Record<string, string>;              // 外部連結，例如 { spotify: "...", wikipedia: "..." }
  readonly confidence?: EntityConfidence;               // 資料可信度
  readonly metadata?: Record<string, string | string[]>; // 其它擴充元資料
}

/** 建立一個 Entity，提供型別安全的工廠函式。 */
export function createEntity(
  id: string,
  name: string,
  type: EntityType,
  fields?: Partial<Omit<Entity, "id" | "name" | "type">>,
): Entity {
  return { id, name, type, ...fields };
}

// =============================================================================
// Seed Data — 硬編碼的真實音樂事實
// =============================================================================

export const SEED_ENTITIES: readonly Entity[] = [
  // Artists（藝人）
  createEntity("charlie_puth", "Charlie Puth", "artist", {
    country: "US",
    roles: ["singer", "songwriter", "producer"],
    confidence: "verified",
    links: {
      spotify: "https://open.spotify.com/artist/6VuMaCRBhv20otuGbgM4Rb",
      wikipedia: "https://en.wikipedia.org/wiki/Charlie_Puth",
    },
    metadata: { genres: ["pop", "R&B"] },
  }),
  createEntity("newjeans", "NewJeans", "artist", {
    aliases: ["뉴진스"],
    country: "KR",
    roles: ["group", "artist"],
    confidence: "verified",
    links: {
      spotify: "https://open.spotify.com/artist/6HvZYsbF6eHj6i7j2gU4J9",
      wikipedia: "https://en.wikipedia.org/wiki/NewJeans",
    },
    metadata: { genres: ["K-pop", "R&B"] },
  }),
  createEntity("taylor_swift", "Taylor Swift", "artist", {
    country: "US",
    roles: ["singer", "songwriter", "producer"],
    confidence: "verified",
    links: {
      spotify: "https://open.spotify.com/artist/06HL4z0CvFAxyCO2G7ao2g",
      wikipedia: "https://en.wikipedia.org/wiki/Taylor_Swift",
    },
    metadata: { genres: ["pop", "country", "indie folk"] },
  }),
  createEntity("lorde", "Lorde", "artist", {
    country: "NZ",
    roles: ["singer", "songwriter"],
    confidence: "verified",
    links: {
      spotify: "https://open.spotify.com/artist/1U1el3k54VvRc3HYyIB9R6",
      wikipedia: "https://en.wikipedia.org/wiki/Lorde",
    },
    metadata: { genres: ["indie pop", "electropop"] },
  }),

  // Producers（製作人）
  createEntity("250", "250", "producer", {
    aliases: ["이오공", "Gigi Shin"],
    country: "KR",
    roles: ["producer", "dj", "composer"],
    confidence: "verified",
    links: {
      spotify: "https://open.spotify.com/artist/1nNuD7f1J4wVEXYdD268eC",
      wikipedia: "https://ko.wikipedia.org/wiki/250_(%EC%9D%8C%EC%95%85_%ED%94%84%EB%A1%9C%EB%93%80%EC%84%9C)",
    },
  }),
  createEntity("jack_antonoff", "Jack Antonoff", "producer", {
    aliases: ["Bleachers"],
    country: "US",
    roles: ["producer", "songwriter", "musician"],
    confidence: "verified",
    links: {
      spotify: "https://open.spotify.com/artist/2e4DweT5v2W52x5jT30nux",
      wikipedia: "https://en.wikipedia.org/wiki/Jack_Antonoff",
    },
  }),

  // Labels（唱片公司）
  createEntity("ador", "ADOR", "label", {
    aliases: ["All Doors One Room"],
    country: "KR",
    confidence: "verified",
    links: {
      wikipedia: "https://en.wikipedia.org/wiki/ADOR",
    },
    metadata: { parentCompany: "HYBE" },
  }),
  createEntity("republic_records", "Republic Records", "label", {
    country: "US",
    confidence: "verified",
    links: {
      wikipedia: "https://en.wikipedia.org/wiki/Republic_Records",
    },
    metadata: { parentCompany: "Universal Music Group" },
  }),

  // Songs（歌曲）
  createEntity("hype_boy", "Hype Boy", "song", {
    confidence: "verified",
    metadata: { year: "2022", artistId: "newjeans" },
  }),
  createEntity("attention", "Attention", "song", {
    confidence: "verified",
    metadata: { year: "2022", artistId: "newjeans" },
  }),

  // Albums（專輯）
  createEntity("1989", "1989", "album", {
    confidence: "verified",
    metadata: { year: "2014", artistId: "taylor_swift" },
  }),
  createEntity("melodrama", "Melodrama", "album", {
    confidence: "verified",
    metadata: { year: "2017", artistId: "lorde" },
  }),
  createEntity("pure_heroine", "Pure Heroine", "album", {
    confidence: "verified",
    metadata: { year: "2013", artistId: "lorde" },
  }),

  // Events（事件）
  createEntity("charlie_puth_demo_to_250", "Charlie Puth sends demos to 250", "event", {
    confidence: "verified",
    roles: ["podcast interview", "demo submission"],
    links: {
      youtube: "https://www.youtube.com/watch?v=example",
    },
    metadata: { year: "2023", medium: "podcast" },
  }),
  createEntity("grammy_2024", "66th Grammy Awards", "event", {
    confidence: "verified",
    roles: ["award show"],
    metadata: { year: "2024", location: "Los Angeles" },
  }),
  createEntity("coachella_2022", "Coachella 2022", "event", {
    confidence: "verified",
    roles: ["music festival"],
    metadata: { year: "2022", location: "Indio, California" },
  }),
] as const;
