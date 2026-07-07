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
  readonly links?: {
    readonly spotify?: string;
    readonly wikipedia?: string;
    readonly website?: string;                          // 註冊官網網址，供動態域名 Lint 檢驗
  };
  readonly confidence?: EntityConfidence;               // 資料可信度
  readonly metadata?: {
    readonly activeYears?: readonly [number, number];   // 活躍年份區間，供時空年代一致性校驗使用
    readonly birthYear?: number;                        // 出生年份或成立年份，供一致性校驗
    readonly deathYear?: number;                        // 逝世年份或解散年份，供一致性校驗
    readonly genres?: readonly string[];
    readonly year?: string;
    readonly artistId?: string;
    readonly parentCompany?: string;
    readonly location?: string;
    readonly genre?: string;
  };
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
    metadata: {
      genres: ["pop", "R&B"],
      birthYear: 1991,
      activeYears: [2009, 2026]
    },
  }),
  createEntity("newjeans", "NewJeans", "artist", {
    aliases: ["뉴진斯"],
    country: "KR",
    roles: ["group", "artist"],
    confidence: "verified",
    links: {
      spotify: "https://open.spotify.com/artist/6HvZYsbF6eHj6i7j2gU4J9",
      wikipedia: "https://en.wikipedia.org/wiki/NewJeans",
      website: "https://newjeans.kr"
    },
    metadata: {
      genres: ["K-pop", "R&B"],
      birthYear: 2022,
      activeYears: [2022, 2026]
    },
  }),
  createEntity("taylor_swift", "Taylor Swift", "artist", {
    country: "US",
    roles: ["singer", "songwriter", "producer"],
    confidence: "verified",
    links: {
      spotify: "https://open.spotify.com/artist/06HL4z0CvFAxyCO2G7ao2g",
      wikipedia: "https://en.wikipedia.org/wiki/Taylor_Swift",
    },
    metadata: {
      genres: ["pop", "country", "indie folk"],
      birthYear: 1989,
      activeYears: [2004, 2026]
    },
  }),
  createEntity("lorde", "Lorde", "artist", {
    country: "NZ",
    roles: ["singer", "songwriter"],
    confidence: "verified",
    links: {
      spotify: "https://open.spotify.com/artist/1U1el3k54VvRc3HYyIB9R6",
      wikipedia: "https://en.wikipedia.org/wiki/Lorde",
    },
    metadata: {
      genres: ["indie pop", "electropop"],
      birthYear: 1996,
      activeYears: [2012, 2026]
    },
  }),
  createEntity("michael_jackson", "Michael Jackson", "artist", {
    country: "US",
    roles: ["singer", "dancer", "pop icon"],
    confidence: "verified",
    links: {
      spotify: "https://open.spotify.com/artist/3fMbdgg4jU18Zmc07G3v5s",
      wikipedia: "https://en.wikipedia.org/wiki/Michael_Jackson",
    },
    metadata: {
      genres: ["pop", "rock", "soul"],
      birthYear: 1958,
      deathYear: 2009,
      activeYears: [1964, 2009]
    }
  }),
  createEntity("tame_impala", "Tame Impala", "artist", {
    country: "AU",
    roles: ["band", "psych rock", "producer"],
    confidence: "verified",
    links: {
      spotify: "https://open.spotify.com/artist/585ndrvwb7w74k3c332882",
      wikipedia: "https://en.wikipedia.org/wiki/Tame_Impala",
    },
    metadata: {
      genres: ["psychedelic rock", "indie pop"],
      birthYear: 2007,
      activeYears: [2007, 2026]
    }
  }),
  createEntity("sza", "SZA", "artist", {
    country: "US",
    roles: ["singer", "songwriter"],
    confidence: "verified",
    links: {
      spotify: "https://open.spotify.com/artist/7tYKF4w9nCwtIM7hn4k68C",
      wikipedia: "https://en.wikipedia.org/wiki/SZA",
    },
    metadata: {
      genres: ["R&B", "pop"],
      birthYear: 1989,
      activeYears: [2012, 2026]
    }
  }),
  createEntity("lin_jj", "JJ Lin (林俊傑)", "artist", {
    country: "SG",
    roles: ["singer", "composer", "producer"],
    confidence: "verified",
    links: {
      spotify: "https://open.spotify.com/artist/7gAppzs7UB5UBII4n5nB2R",
      wikipedia: "https://en.wikipedia.org/wiki/JJ_Lin",
    },
    metadata: {
      genres: ["mandopop"],
      birthYear: 1981,
      activeYears: [2003, 2026]
    }
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
    metadata: {
      birthYear: 1982,
      activeYears: [2010, 2026]
    }
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
    metadata: {
      birthYear: 1984,
      activeYears: [2000, 2026]
    }
  }),

  // Labels（唱片公司）
  createEntity("ador", "ADOR", "label", {
    aliases: ["All Doors One Room"],
    country: "KR",
    confidence: "verified",
    links: {
      wikipedia: "https://en.wikipedia.org/wiki/ADOR",
      website: "https://ador.world"
    },
    metadata: { parentCompany: "HYBE", birthYear: 2021 },
  }),
  createEntity("republic_records", "Republic Records", "label", {
    country: "US",
    confidence: "verified",
    links: {
      wikipedia: "https://en.wikipedia.org/wiki/Republic_Records",
    },
    metadata: { parentCompany: "Universal Music Group", birthYear: 1995 },
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

  // === Hidden Musicological Entities ===
  createEntity("ppong", "PPONG (250 Album)", "album", {
    confidence: "verified",
    metadata: { year: "2022", artistId: "250", genre: "Electronic/Techo/Traditional" },
  }),
  createEntity("haruomi_hosono", "Haruomi Hosono (細野晴臣)", "artist", {
    country: "JP",
    roles: ["musician", "composer", "producer"],
    confidence: "verified",
    metadata: {
      birthYear: 1947,
      activeYears: [1969, 2026]
    }
  }),
  createEntity("ymo", "Yellow Magic Orchestra (YMO)", "artist", {
    country: "JP",
    roles: ["band", "electronic pioneers"],
    confidence: "verified",
    metadata: {
      birthYear: 1978,
      activeYears: [1978, 1983]
    }
  }),

  // === Hidden Musicological Entities for DB Users ===
  createEntity("radiohead", "Radiohead", "artist", {
    country: "UK",
    roles: ["band", "alternative rock", "art rock"],
    confidence: "verified",
    metadata: {
      birthYear: 1985,
      activeYears: [1985, 2026]
    }
  }),
  createEntity("daydreaming", "Daydreaming", "song", {
    confidence: "verified",
    metadata: { year: "2016", artistId: "radiohead" },
  }),
  createEntity("erik_satie", "Erik Satie", "artist", {
    country: "FR",
    roles: ["composer", "pianist", "minimalist pioneer"],
    confidence: "verified",
    metadata: {
      birthYear: 1866,
      deathYear: 1925,
      activeYears: [1884, 1925]
    }
  }),
  createEntity("gymnopedie_1", "Gymnopédie No. 1", "song", {
    confidence: "verified",
    metadata: { year: "1888", artistId: "erik_satie" },
  }),
  createEntity("furniture_music", "Furniture Music (Musique d'ameublement)", "event", {
    confidence: "verified",
    roles: ["musical concept", "ambient origin"],
    metadata: { year: "1917" }
  }),
  createEntity("berlioz", "berlioz", "artist", {
    country: "UK",
    roles: ["producer", "jazz house"],
    confidence: "verified",
    metadata: {
      birthYear: 1996,
      activeYears: [2018, 2026]
    }
  }),
  createEntity("debussy", "Claude Debussy", "artist", {
    country: "FR",
    roles: ["composer", "impressionism"],
    confidence: "verified",
    metadata: {
      birthYear: 1862,
      deathYear: 1918,
      activeYears: [1884, 1918]
    }
  }),
  createEntity("nujabes", "Nujabes", "artist", {
    country: "JP",
    roles: ["producer", "dj", "jazz hop pioneer"],
    confidence: "verified",
    metadata: {
      birthYear: 1974,
      deathYear: 2010,
      activeYears: [1995, 2010]
    }
  }),
  createEntity("atcq", "A Tribe Called Quest", "artist", {
    country: "US",
    roles: ["hip hop group", "jazz rap pioneers"],
    confidence: "verified",
    metadata: {
      birthYear: 1985,
      activeYears: [1985, 2017]
    }
  }),

  // === Dynamic Fact Entities for User 李彥龍 (411121217@gms.ndhu.edu.tw) ===
  createEntity("jpegmafia", "JPEGMAFIA", "artist", {
    country: "US",
    roles: ["rapper", "producer", "experimental hip hop"],
    confidence: "verified",
    metadata: {
      birthYear: 1989,
      activeYears: [2007, 2026]
    }
  }),
  createEntity("frnk", "FRNK (of XXX)", "producer", {
    country: "KR",
    roles: ["producer", "electronic beats"],
    confidence: "verified",
    metadata: {
      birthYear: 1993,
      activeYears: [2013, 2026]
    }
  }),
  createEntity("xxx_band", "XXX (Korean Duo)", "artist", {
    country: "KR",
    roles: ["electronic rap duo"],
    confidence: "verified",
    metadata: {
      birthYear: 2015,
      activeYears: [2015, 2020]
    }
  }),
  createEntity("quincy_jones", "Quincy Jones", "producer", {
    country: "US",
    roles: ["legendary producer", "arranger"],
    confidence: "verified",
    metadata: {
      birthYear: 1933,
      deathYear: 2024,
      activeYears: [1951, 2024]
    }
  }),
  createEntity("bruno_mars", "Bruno Mars", "artist", {
    country: "US",
    roles: ["singer", "producer", "funk soul icon"],
    confidence: "verified",
    metadata: {
      birthYear: 1985,
      activeYears: [2004, 2026]
    }
  }),
  createEntity("cyndi_wang", "Cyndi Wang (王心凌)", "artist", {
    country: "TW",
    roles: ["mandopop singer", "c-pop idol"],
    confidence: "verified",
    metadata: {
      birthYear: 1982,
      activeYears: [2003, 2026]
    }
  }),
  createEntity("orange_range", "Orange Range (橘子新樂園)", "artist", {
    country: "JP",
    roles: ["alternative rock band", "j-rock pioneers"],
    confidence: "verified",
    metadata: {
      birthYear: 2001,
      activeYears: [2001, 2026]
    }
  }),
  createEntity("xin_dian_xin", "心電心 (Xin Dian Xin)", "song", {
    confidence: "verified",
    metadata: { year: "2009", artistId: "cyndi_wang" },
  }),
  createEntity("yixin_dianxin", "以心電信 (Ishin Denshin)", "song", {
    confidence: "verified",
    metadata: { year: "2004", artistId: "orange_range" },
  }),

  // === Dynamic Fact Entities for User aaronlee0715@gmail.com ===
  createEntity("pharrell_williams", "Pharrell Williams", "artist", {
    country: "US",
    roles: ["singer", "producer", "fashion designer"],
    confidence: "verified",
    metadata: {
      birthYear: 1973,
      activeYears: [1992, 2026]
    }
  }),
  createEntity("supernatural_song", "Supernatural", "song", {
    confidence: "verified",
    metadata: { year: "2024", artistId: "newjeans" },
  }),
  createEntity("juggernaut_song", "JUGGERNAUT", "song", {
    confidence: "verified",
    metadata: { year: "2021", artistId: "tyler_creator" },
  }),
  createEntity("justin_bieber", "Justin Bieber", "artist", {
    country: "CA",
    roles: ["singer", "pop icon"],
    confidence: "verified",
    metadata: {
      birthYear: 1994,
      activeYears: [2007, 2026]
    }
  }),
  createEntity("bad_guy_remix", "bad guy (with Justin Bieber)", "song", {
    confidence: "verified",
    metadata: { year: "2019", artistId: "billie_eilish" },
  }),
  createEntity("snooze_remix", "Snooze (Acoustic feat. Justin Bieber)", "song", {
    confidence: "verified",
    metadata: { year: "2023", artistId: "sza" },
  }),
  createEntity("something_to_rap_about", "Something to Rap About", "song", {
    confidence: "verified",
    metadata: { year: "2020", artistId: "freddie_gibbs" },
  }),
  createEntity("tyler_creator", "Tyler, The Creator", "artist", {
    country: "US",
    roles: ["rapper", "producer", "creative director"],
    confidence: "verified",
    metadata: {
      birthYear: 1991,
      activeYears: [2007, 2026]
    }
  }),
  createEntity("puppet", "PUPPET", "song", {
    confidence: "verified",
    metadata: { year: "2019", artistId: "tyler_creator" },
  }),
  createEntity("olivia_rodrigo", "Olivia Rodrigo", "artist", {
    country: "US",
    roles: ["singer", "songwriter"],
    confidence: "verified",
    metadata: {
      birthYear: 2003,
      activeYears: [2015, 2026]
    }
  }),
  createEntity("freddie_gibbs", "Freddie Gibbs", "artist", {
    country: "US",
    roles: ["rapper"],
    confidence: "verified",
    metadata: {
      birthYear: 1982,
      activeYears: [2004, 2026]
    }
  }),
  createEntity("alchemist", "The Alchemist", "artist", {
    country: "US",
    roles: ["producer", "dj", "sample master"],
    confidence: "verified",
    metadata: {
      birthYear: 1977,
      activeYears: [1991, 2026]
    }
  }),
  createEntity("kendrick_lamar", "Kendrick Lamar", "artist", {
    country: "US",
    roles: ["rapper", "songwriter", "pulitzer winner"],
    confidence: "verified",
    metadata: {
      birthYear: 1987,
      activeYears: [2004, 2026]
    }
  }),
  createEntity("pride_song", "PRIDE.", "song", {
    confidence: "verified",
    metadata: { year: "2017", artistId: "kendrick_lamar" },
  }),
  createEntity("billie_eilish", "Billie Eilish", "artist", {
    country: "US",
    roles: ["singer", "songwriter"],
    confidence: "verified",
    metadata: {
      birthYear: 2001,
      activeYears: [2015, 2026]
    }
  }),
  createEntity("everything_i_wanted", "everything i wanted", "song", {
    confidence: "verified",
    metadata: { year: "2019", artistId: "billie_eilish" },
  }),
  createEntity("robert_smith", "Robert Smith", "artist", {
    country: "UK",
    roles: ["singer", "guitarist", "goth icon"],
    confidence: "verified",
    metadata: {
      birthYear: 1959,
      activeYears: [1972, 2026]
    }
  }),
  createEntity("whats_wrong_with_me", "what’s wrong with me", "song", {
    confidence: "verified",
    metadata: { year: "2024", artistId: "olivia_rodrigo" },
  }),
  createEntity("hans_zimmer", "Hans Zimmer", "artist", {
    country: "DE",
    roles: ["film composer", "producer"],
    confidence: "verified",
    metadata: {
      birthYear: 1957,
      activeYears: [1977, 2026]
    }
  }),
  createEntity("sanctuary_tour", "Sanctuary World Tour (聖所巡演)", "event", {
    confidence: "verified",
    metadata: { year: "2018" }
  }),
  createEntity("no_time_to_die", "No Time to Die", "song", {
    confidence: "verified",
    metadata: { year: "2020", artistId: "billie_eilish" },
  }),
  createEntity("rihanna", "Rihanna", "artist", {
    country: "BB",
    roles: ["singer", "fashion mogul"],
    confidence: "verified",
    metadata: {
      birthYear: 1988,
      activeYears: [2003, 2026]
    }
  }),
  createEntity("same_ol_mistakes", "Same Ol' Mistakes", "song", {
    confidence: "verified",
    metadata: { year: "2016", artistId: "rihanna" },
  }),
  createEntity("loyalty_song", "LOYALTY. (feat. Rihanna)", "song", {
    confidence: "verified",
    metadata: { year: "2017", artistId: "kendrick_lamar" },
  }),
  createEntity("jennie", "JENNIE (제니)", "artist", {
    country: "KR",
    roles: ["singer", "rapper", "pop star"],
    confidence: "verified",
    metadata: {
      birthYear: 1996,
      activeYears: [2016, 2026]
    }
  }),
] as const;
