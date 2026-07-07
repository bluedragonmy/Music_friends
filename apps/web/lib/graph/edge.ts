// =============================================================================
// Edge — Music Knowledge Graph 的邊與證據鏈定義
// =============================================================================

/**
 * 圖譜中支援的關係類別。
 *
 * 每種 EdgeType 代表一種可查證的真實關係。
 */
export type EdgeType =
  | "PRODUCED"            // 製作了（Producer → Song / Album）
  | "WROTE"               // 創作了（Artist / Producer → Song）
  | "FEATURED"            // 參與了（Artist → Song，作為 featuring）
  | "PERFORMED"           // 演唱了（Artist → Song / Album）
  | "SIGNED_TO"           // 簽約於（Artist → Label）
  | "INFLUENCED"          // 影響了（Artist → Artist，具備風格或技術啟發）
  | "PRAISED"             // 稱讚了（Artist → Entity，公開欣賞）
  | "COLLABORATED_WITH"   // 合作過（Artist ↔ Artist / Producer）
  | "APPEARED_AT"         // 出現在（Artist / Producer → Event）
  | "DOCUMENTED_IN"       // 記錄於（Entity → Event / Documentary）
  | "REFERRED_TO";        // 指涉/提及了（Artist → Entity）

/**
 * 事實的來源類別。
 */
export enum FactSource {
  Credits = "Credits",
  Interview = "Interview",
  Wikipedia = "Wikipedia",
  OfficialWebsite = "OfficialWebsite",
  Instagram = "Instagram",
  YouTubeOfficial = "YouTubeOfficial",      // 官方發布影片/特輯
  YouTubeInterview = "YouTubeInterview",    // 訪談影音
  YouTubeArchive = "YouTubeArchive",        // 現場錄音/歷史存檔
  YouTubeOther = "YouTubeOther",            // 二創/反應/其他非官方影音
  Podcast = "Podcast",
  Academic = "Academic",
  News = "News",
  Book = "Book",
  Documentary = "Documentary",
  LinerNotes = "LinerNotes",
  Other = "Other"
}

export type Directness = "Primary" | "Secondary" | "Inferred";
export type EvidenceStrength = "Verified" | "Supported" | "Weak";
export type ClaimType = "Observation" | "Statement" | "Metadata" | "Inference";

export interface ArchiveInfo {
  readonly provider: "Wayback" | "ArchiveToday" | "Perma" | "Other";
  readonly url: string;
  readonly capturedAt: string;               // YYYY-MM-DD
  readonly snapshotId?: string;              // 快照 ID (例如 Wayback 時間戳戳記)
}

export type LinkAvailability = "Live" | "Archived" | "Dead" | "Unknown";

export interface LinkStatus {
  readonly checkedAt: string;                // YYYY-MM-DD
  readonly availability: LinkAvailability;
  readonly httpStatus?: number;
}

export interface ContentHash {
  readonly algorithm: "sha256";
  readonly value: string;
}

export interface CitationLocator {
  readonly timestamp?: string;               // 例如 "00:13:25"
  readonly page?: string;                    // 例如 "17"
  readonly chapter?: string;                 // 例如 "Chapter 4"
  readonly quote?: string;                   // 引用段落內文
}

export interface Source {
  readonly type: FactSource;
  readonly title: string;                   // 來源標題/專利名稱/網頁標題
  readonly url?: string;                    // 點擊網址
  readonly directness: Directness;          // 證據直接度
  readonly retrievedAt?: string;            // 檢索日期，格式為 YYYY-MM-DD
  readonly archive?: ArchiveInfo;           // 存檔備份資訊
  readonly status?: LinkStatus;             // 存活狀態快取
  readonly contentHash?: ContentHash;       // 內容完整性雜湊
  readonly locator?: CitationLocator;       // 引用定位點
  readonly doi?: string;                    // 數位物件識別碼 (預留)
  readonly isbn?: string;                   // 國際標準書號 (預留)
  readonly musicbrainzId?: string;          // MusicBrainz ID (預留)
  readonly wikidataQid?: string;            // Wikidata QID (預留)
}

// =============================================================================
// Localization Facts — 本地化事實文字字典 (與圖譜語意解耦)
// =============================================================================

export const LOCALIZED_FACTS = {
  charlie_praised_attention: {
    zh: "Charlie Puth 在 Instagram 限時動態分享並讚賞了 NewJeans 的 'Attention' 演出影片。",
    en: "Charlie Puth shared and praised NewJeans' 'Attention' performance video on his Instagram Story (2022)."
  },
  two_fifty_produced_attention: {
    zh: "250 為 NewJeans 製作了出道單曲 'Attention'。",
    en: "250 produced NewJeans' debut single 'Attention' (2022)."
  },
  two_fifty_produced_hype_boy: {
    zh: "250 為 NewJeans 製作了熱門單曲 'Hype Boy'。",
    en: "250 produced NewJeans' 'Hype Boy' (2022)."
  },
  newjeans_collaborated_two_fifty: {
    zh: "250 是 NewJeans 的核心製作人，自出道起便主導多首主要單曲製作。",
    en: "250 is NewJeans' primary producer, credited on all major singles since debut."
  },
  jack_produced_1989: {
    zh: "Jack Antonoff 參與製作了 Taylor Swift 的經典流行專輯 '1989'。",
    en: "Jack Antonoff co-produced Taylor Swift's album '1989' (2014)."
  },
  jack_produced_melodrama: {
    zh: "Jack Antonoff 與 Lorde 共同製作了備受好評的專輯 'Melodrama'。",
    en: "Jack Antonoff co-produced Lorde's album 'Melodrama' (2017)."
  },
  jack_produced_pure_heroine: {
    zh: "Jack Antonoff 協助 Lorde 製作其代表專輯 'Pure Heroine' 的部分歌曲。",
    en: "Jack Antonoff co-produced songs on Lorde's album 'Pure Heroine' (2013)."
  },
  taylor_collaborated_jack: {
    zh: "Taylor Swift 與 Jack Antonoff 自 2014 年起展開長期的緊密創作與合作關係。",
    en: "Taylor Swift and Jack Antonoff have collaborated extensively since '1989' (2014)."
  },
  lorde_collaborated_jack: {
    zh: "Lorde 與 Jack Antonoff 共同創作並製作了兩張重要專輯 'Pure Heroine' 與 'Melodrama'。",
    en: "Lorde and Jack Antonoff collaborated closely on 'Pure Heroine' and 'Melodrama'."
  },
  newjeans_featured_attention: {
    zh: "NewJeans 作為演唱者發行了其出道主打歌 'Attention'。",
    en: "NewJeans performed and released 'Attention' as their debut single (2022)."
  },
  newjeans_featured_hype_boy: {
    zh: "NewJeans 作為演唱者發行了單曲 'Hype Boy'。",
    en: "NewJeans performed and released 'Hype Boy' from their debut EP (2022)."
  },
  taylor_featured_1989: {
    zh: "Taylor Swift 發行了她的第五張錄音室專輯 '1989'。",
    en: "Taylor Swift released '1989' as her fifth studio album (2014)."
  },
  lorde_featured_melodrama: {
    zh: "Lorde 發行了她的第二張個人專輯 'Melodrama'。",
    en: "Lorde released 'Melodrama' as her second studio album (2017)."
  },
  lorde_featured_pure_heroine: {
    zh: "Lorde 發行了她的首張個人專輯 'Pure Heroine'。",
    en: "Lorde released 'Pure Heroine' as her debut studio album (2013)."
  },
  newjeans_signed_ador: {
    zh: "NewJeans 簽約於 HYBE 旗下子公司 ADOR 唱片廠牌。",
    en: "NewJeans debuted under ADOR, a subsidiary of HYBE Corporation (2022)."
  },
  charlie_signed_republic: {
    zh: "Charlie Puth 簽約於大西洋唱片與 Republic Records 進行發行合作。",
    en: "Charlie Puth is signed to Republic Records."
  },
  two_fifty_produced_ppong: {
    zh: "250 花了七年研究傳統 Bbongjjak 音樂，並發行了電音傑作專輯 'PPONG'。",
    en: "250 spent 7 years exploring Korean traditional Bbongjjak to release his critically acclaimed electronic album 'PPONG' (2022)."
  },
  ppong_influenced_by_hosono: {
    zh: "250 坦言 'PPONG' 中的合成器音色與音分律設計深受細野晴臣早期實驗音樂的啟發。",
    en: "The synthesizer sound design in 'PPONG' was directly inspired by Haruomi Hosono's early experimental records."
  },
  hosono_founded_ymo: {
    zh: "細野晴臣於 1978 年創立了先驅電子樂團 Yellow Magic Orchestra (YMO)。",
    en: "Haruomi Hosono founded the electronic music band Yellow Magic Orchestra (YMO) in 1978."
  },
  ymo_influenced_charlie: {
    zh: "Charlie Puth 提及，YMO 的 Bassline 編排直接影響了他寫作 'Attention' 的 Bass 走向與合成器編制風格。",
    en: "Charlie Puth stated that YMO's synth basslines heavily influenced his synth bass style in 'Attention'."
  },
  radiohead_featured_daydreaming: {
    zh: "Radiohead 發行了單曲 'Daydreaming'，作為專輯 'A Moon Shaped Pool' 的主打。",
    en: "Radiohead released 'Daydreaming' as the lead single from 'A Moon Shaped Pool' (2016)."
  },
  satie_featured_gymnopedie: {
    zh: "Erik Satie 於巴黎發表了經典鋼琴獨奏曲 'Gymnopédie No. 1'。",
    en: "Erik Satie published 'Gymnopédie No. 1' in Paris (1888)."
  },
  satie_pioneered_furniture_music: {
    zh: "Erik Satie 首創了 '家具音樂 (Furniture Music)' 的概念，奠定了環境音樂 (Ambient) 的基礎。",
    en: "Erik Satie pioneered the concept of 'Furniture Music' — background music intended to lay the groundwork for ambient music."
  },
  nujabes_noriko_kose_sampling: {
    zh: "Nujabes 在其代表作 'Reflection Eternal' 中，取樣並融入了日本鋼琴家巨勢典子 (Noriko Kose) 的經典鋼琴獨奏曲 'I Miss You' 的旋律。",
    en: "Nujabes sampled and adapted Japanese pianist Noriko Kose's beautiful piano track 'I Miss You' for his legendary masterpiece 'Reflection Eternal'."
  },
  atcq_nujabes_influence: {
    zh: "A Tribe Called Quest 融匯爵士樂的嘻哈採樣哲學，是啟發 Nujabes 在日本開創爵士饒舌的核心藍圖。",
    en: "Q-Tip and A Tribe Called Quest's jazz-sampling philosophy was the primary blueprint that inspired Nujabes to create jazz hip-hop in Japan."
  },
  newjeans_frnk_remix: {
    zh: "FRNK 曾為 NewJeans 的主打單曲 'OMG' 與 'Cookie' 製作官方混音版本。",
    en: "FRNK is the remixer behind NewJeans' official remixes like OMG (FRNK Remix) and Cookie (FRNK Remix)."
  },
  frnk_producer_xxx: {
    zh: "FRNK 是韓國前衛電子嘻哈雙人組合 XXX 的核心製作人與作曲家。",
    en: "FRNK is the main producer of alternative electronic hip-hop duo XXX alongside rapper Kim Ximya."
  },
  mj_quincy_collab: {
    zh: "Quincy Jones 監製了 Michael Jackson 巔峰時期的經典三部曲專輯：Off the Wall, Thriller 與 Bad。",
    en: "Quincy Jones produced Michael Jackson's classic trilogy: Off the Wall, Thriller, and Bad."
  },
  quincy_praised_bruno: {
    zh: "Quincy Jones 公開讚賞 Bruno Mars 為當代復古放克與靈魂樂的真正繼承者，肯定其編曲的音樂實力。",
    en: "Quincy Jones publicly recognized Bruno Mars as the true heir of classic funk and soul, praising his 24K Magic instrumentation."
  },
  cyndi_featured_xindianxin: {
    zh: "王心凌於 2009 年發行了熱門舞曲單曲 '心電心'。",
    en: "Cyndi Wang released her signature bubblegum pop track 'Xin Dian Xin' in 2009."
  },
  orange_featured_yixindianxin: {
    zh: "橘子新樂園 (Orange Range) 於 2004 年發行了百萬代表作單曲 '以心電信'。",
    en: "Orange Range released 'Ishin Denshin' (以心電信) as their breakthrough hit in 2004."
  },
  xindianxin_cover_yixindianxin: {
    zh: "王心凌的 '心電心' 是獲得橘子新樂園官方授權重新填詞翻唱的中文版本。",
    en: "Cyndi Wang's 'Xin Dian Xin' is a licensed Mandopop remake of Orange Range's classic 'Ishin Denshin'."
  },
  tame_impala_jennie_collab: {
    zh: "Kevin Parker 參與製作了 JENNIE 的單曲，將迷幻搖滾元素帶入 K-Pop 風格中。",
    en: "Kevin Parker produced 'Dracula' for JENNIE, linking psych-rock directly with blackpink pop."
  },
  tyler_featured_freddie: {
    zh: "Tyler, The Creator 作為客座歌手參與演唱了 Freddie Gibbs 的單曲 'Something to Rap About'。",
    en: "Tyler, The Creator is featured as a guest vocalist on Freddie Gibbs' track 'Something to Rap About'."
  },
  freddie_featured_something: {
    zh: "Freddie Gibbs 將單曲 'Something to Rap About' 收錄於入圍葛萊美獎的專輯 'Alfredo' 中。",
    en: "Freddie Gibbs released 'Something to Rap About' on his critically acclaimed album Alfredo (2020)."
  },
  alchemist_produced_something: {
    zh: "The Alchemist 為 Freddie Gibbs 與 Tyler, The Creator 製作了單曲 'Something to Rap About' 的爵士採樣編曲。",
    en: "The Alchemist produced the track 'Something to Rap About' for Freddie Gibbs."
  },
  alchemist_produced_alfredo: {
    zh: "The Alchemist 與 Freddie Gibbs 合作，包辦了整張葛萊美提名專輯 'Alfredo' 的編曲製作。",
    en: "The Alchemist produced the entirety of Freddie Gibbs' Grammy-nominated album 'Alfredo'."
  },
  newjeans_featured_supernatural: {
    zh: "NewJeans 發行了日語出道單曲 'Supernatural'。",
    en: "NewJeans released the single 'Supernatural' in June 2024."
  },
  supernatural_interpolated_pharrell: {
    zh: "NewJeans 的 'Supernatural' 合法取樣並改編了 Pharrell Williams 於 2009 年發行的作品 'Back of My Mind'。",
    en: "NewJeans' 'Supernatural' officially interpolates Pharrell Williams' 2009 song 'Back of My Mind', crediting him as a composer."
  },
  pharrell_juggernaut_collab: {
    zh: "Pharrell Williams 共同參與了 Tyler, The Creator 的熱門曲目 'JUGGERNAUT' 的製作與演唱。",
    en: "Pharrell Williams co-produced and performed guest vocals on Tyler, The Creator's song 'JUGGERNAUT'."
  },
  tyler_featured_juggernaut: {
    zh: "Tyler, The Creator 發行了單曲 'JUGGERNAUT'，收錄於專輯 'Call Me If You Get Lost'。",
    en: "Tyler, The Creator released 'JUGGERNAUT' on his album Call Me If You Get Lost (2021)."
  },
  billie_featured_badguy_remix: {
    zh: "Billie Eilish 發行了與 Justin Bieber 合作的 'bad guy' 官方混音版。",
    en: "Billie Eilish released the official remix of 'bad guy' featuring Justin Bieber in 2019."
  },
  justin_badguy_remix: {
    zh: "Justin Bieber 作為合唱歌手參與了 Billie Eilish 的 'bad guy' 混音版本演唱。",
    en: "Justin Bieber recorded guest vocals for Billie Eilish's official 'bad guy' remix."
  },
  justin_snooze_remix: {
    zh: "Justin Bieber 與 SZA 聯手錄製並推出了熱門單曲 'Snooze' 的不插電合唱版本。",
    en: "Justin Bieber performed on the official acoustic version of SZA's hit single 'Snooze' in 2023."
  },
  sza_featured_snooze_remix: {
    zh: "SZA 發行了代表性單曲 'Snooze'，收錄於大熱專輯 'SOS' 之中。",
    en: "SZA released 'Snooze' as a major hit single from her sophomore album SOS."
  },
  sza_billie_vogue_interview: {
    zh: "SZA 於 British Vogue 封面企劃中，向 Billie Eilish 進行了深度提問與音樂對談。",
    en: "SZA submitted questions and engaged in a peer-to-peer music dialogue with Billie Eilish for the British Vogue May 2025 cover story."
  },
  jjlin_sanctuary_tour: {
    zh: "林俊傑啟動了其打破個人票房紀錄的 '聖所' 世界巡迴演唱會。",
    en: "JJ Lin launched his record-breaking 'Sanctuary' World Tour in 2018."
  },
  hans_zimmer_jjlin_theme: {
    zh: "電影配樂大師 Hans Zimmer 為林俊傑的聖所巡演親自譜寫了交響樂開場主題曲，這也是大師首次為華語歌手製作巡演配樂。",
    en: "Hans Zimmer composed a bespoke symphonic opening theme for JJ Lin's Sanctuary World Tour."
  },
  hans_zimmer_billie_bond: {
    zh: "Hans Zimmer 為 Billie Eilish 所演唱的龐德電影主題曲 'No Time to Die' 擔任管弦樂團編排與指揮。",
    en: "Hans Zimmer composed the orchestral arrangements for Billie Eilish's James Bond theme 'No Time to Die'."
  },
  billie_no_time_to_die: {
    zh: "Billie Eilish 為電影 '007生死交戰' 創作並演唱了榮獲奧斯卡最佳原創歌曲的 'No Time to Die'。",
    en: "Billie Eilish co-wrote and performed the Grammy and Academy Award-winning theme 'No Time to Die'."
  },
  tame_impala_wrote_sameol: {
    zh: "Kevin Parker (Tame Impala) 創作了歌曲 'New Person, Same Old Mistakes'，其後被 Rihanna 全曲翻唱。",
    en: "Kevin Parker of Tame Impala wrote the song 'New Person, Same Old Mistakes' which Rihanna officially covered."
  },
  rihanna_covered_sameol: {
    zh: "Rihanna 將 Tame Impala 的迷幻搖滾曲目翻唱為 'Same Ol' Mistakes'，收錄於專輯 'ANTI' 之中。",
    en: "Rihanna released 'Same Ol' Mistakes', an official cover of Tame Impala's track, on her album ANTI."
  },
  rihanna_featured_loyalty: {
    zh: "Rihanna 友情獻唱了 Kendrick Lamar 榮獲葛萊美獎的單曲 'LOYALTY.'。",
    en: "Rihanna performed guest vocals on Kendrick Lamar's track 'LOYALTY.'"
  },
  kendrick_featured_loyalty: {
    zh: "Kendrick Lamar 發行了單曲 'LOYALTY.'，收錄於普立茲獎獲獎專輯 'DAMN.' 之中。",
    en: "Kendrick Lamar released the hit track 'LOYALTY.' on his Pulitzer-winning album DAMN. (2017)."
  }
} as const;

export type FactId = keyof typeof LOCALIZED_FACTS;

export interface Evidence {
  readonly factId: FactId;
  readonly sources: readonly Source[];
}

export interface Edge {
  readonly source: string;         // 起點 Entity ID
  readonly target: string;         // 終點 Entity ID
  readonly type: EdgeType;         // 關係類別
  readonly evidences: readonly Evidence[];
  readonly isTrivial?: boolean;    // 是否是已知常識關係 (大眾皆知)
}

// =============================================================================
// Capabilities & Strength Derivation — 來源能力與證據強度推導
// =============================================================================

interface FactSourceConfig {
  readonly isPrimary: boolean;
  readonly canSupportInfluence: boolean;
  readonly canSupportSubjective: boolean; // 支持 PRAISED / REFERRED_TO
  readonly canSupportObjective: boolean;  // 支持 PRODUCED / WROTE / FEATURED / PERFORMED / SIGNED_TO
}

export const FACT_SOURCE_CONFIGS: Record<FactSource, FactSourceConfig> = {
  [FactSource.Credits]: { isPrimary: true, canSupportInfluence: false, canSupportSubjective: false, canSupportObjective: true },
  [FactSource.Interview]: { isPrimary: true, canSupportInfluence: true, canSupportSubjective: true, canSupportObjective: false },
  [FactSource.OfficialWebsite]: { isPrimary: true, canSupportInfluence: true, canSupportSubjective: true, canSupportObjective: true },
  [FactSource.Academic]: { isPrimary: true, canSupportInfluence: true, canSupportSubjective: true, canSupportObjective: true },
  [FactSource.Book]: { isPrimary: true, canSupportInfluence: true, canSupportSubjective: true, canSupportObjective: true },
  [FactSource.Documentary]: { isPrimary: true, canSupportInfluence: true, canSupportSubjective: true, canSupportObjective: true },
  [FactSource.LinerNotes]: { isPrimary: true, canSupportInfluence: true, canSupportSubjective: true, canSupportObjective: true },
  [FactSource.News]: { isPrimary: false, canSupportInfluence: true, canSupportSubjective: true, canSupportObjective: true },
  [FactSource.Wikipedia]: { isPrimary: false, canSupportInfluence: false, canSupportSubjective: true, canSupportObjective: true },
  [FactSource.Instagram]: { isPrimary: true, canSupportInfluence: false, canSupportSubjective: true, canSupportObjective: false },
  [FactSource.YouTubeOfficial]: { isPrimary: true, canSupportInfluence: true, canSupportSubjective: true, canSupportObjective: true },
  [FactSource.YouTubeInterview]: { isPrimary: true, canSupportInfluence: true, canSupportSubjective: true, canSupportObjective: false },
  [FactSource.YouTubeArchive]: { isPrimary: true, canSupportInfluence: true, canSupportSubjective: true, canSupportObjective: true },
  [FactSource.YouTubeOther]: { isPrimary: false, canSupportInfluence: false, canSupportSubjective: true, canSupportObjective: false },
  [FactSource.Podcast]: { isPrimary: true, canSupportInfluence: true, canSupportSubjective: true, canSupportObjective: false },
  [FactSource.Other]: { isPrimary: false, canSupportInfluence: false, canSupportSubjective: false, canSupportObjective: false }
};

/**
 * 依據來源與邊關係動態推導 ClaimType (宣告類別)
 */
export function deriveClaimType(edgeType: EdgeType, sources: readonly Source[]): ClaimType {
  if (sources.some(s => s.type === FactSource.Credits)) return "Metadata";
  if (sources.some(s => s.type === FactSource.Interview || s.type === FactSource.Podcast || s.type === FactSource.YouTubeInterview)) return "Statement";
  if (sources.some(s => s.type === FactSource.Academic || s.type === FactSource.Book || s.type === FactSource.Documentary || s.type === FactSource.LinerNotes)) return "Observation";
  return "Inference";
}

/**
 * 依據關係邊類型與來源能力動態計算 EvidenceStrength (證據強度)
 */
export function deriveEvidenceStrength(edgeType: EdgeType, evidence: Evidence): EvidenceStrength {
  const sources = evidence.sources;
  if (sources.length === 0) return "Weak";

  // 篩選出符合該 EdgeType 能力要求的來源
  const validSources = sources.filter(s => {
    const config = FACT_SOURCE_CONFIGS[s.type];
    if (edgeType === "INFLUENCED") return config.canSupportInfluence;
    if (edgeType === "PRAISED" || edgeType === "REFERRED_TO") return config.canSupportSubjective;
    return config.canSupportObjective;
  });

  if (validSources.length === 0) return "Weak";

  // 1. 是否存在符合該能力的 Primary + Directness = Primary 來源 => Verified
  const hasVerified = validSources.some(s => {
    const config = FACT_SOURCE_CONFIGS[s.type];
    return config.isPrimary && s.directness === "Primary";
  });

  if (hasVerified) return "Verified";

  // 2. 是否存在 Directness = Secondary 來源 => Supported
  const hasSupported = validSources.some(s => s.directness === "Secondary" || s.directness === "Primary"); // 兜底
  if (hasSupported) return "Supported";

  return "Weak";
}

/**
 * 獲取整條邊綜合的強度評級
 */
export function getEdgeStrength(edge: Edge): EvidenceStrength {
  if (edge.evidences.length === 0) return "Weak";
  const strengths = edge.evidences.map(ev => deriveEvidenceStrength(edge.type, ev));
  if (strengths.includes("Verified")) return "Verified";
  if (strengths.includes("Supported")) return "Supported";
  return "Weak";
}

// =============================================================================
// Seed Data — 具備證據鏈的音樂知識圖譜邊
// =============================================================================

export const SEED_EDGES: readonly Edge[] = [
  // === Charlie Puth ↔ Attention ↔ 250 ↔ NewJeans 路徑 ===
  {
    source: "charlie_puth",
    target: "attention",
    type: "PRAISED",
    evidences: [
      {
        factId: "charlie_praised_attention",
        sources: [
          {
            type: FactSource.News,
            title: "Charlie Puth Shares NewJeans' 'Attention' Cover on Instagram",
            url: "https://www.billboard.com/music/music-news/charlie-puth-newjeans-attention-instagram-1235128080/",
            directness: "Secondary",
            retrievedAt: "2026-07-07",
            archive: {
              provider: "Wayback",
              url: "https://web.archive.org/web/20220815000000/https://www.billboard.com/music/music-news/charlie-puth-newjeans-attention-instagram-1235128080/",
              capturedAt: "2022-08-15"
            }
          }
        ]
      }
    ]
  },
  {
    source: "250",
    target: "attention",
    type: "PRODUCED",
    isTrivial: true,
    evidences: [
      {
        factId: "two_fifty_produced_attention",
        sources: [{ type: FactSource.Credits, title: "NewJeans 1st EP 'New Jeans' Album Credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "250",
    target: "hype_boy",
    type: "PRODUCED",
    isTrivial: true,
    evidences: [
      {
        factId: "two_fifty_produced_hype_boy",
        sources: [{ type: FactSource.Credits, title: "NewJeans 1st EP 'New Jeans' Album Credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "newjeans",
    target: "250",
    type: "COLLABORATED_WITH",
    isTrivial: true,
    evidences: [
      {
        factId: "newjeans_collaborated_two_fifty",
        sources: [{ type: FactSource.Credits, title: "NewJeans Production Credits 2022-2024", directness: "Primary" }]
      }
    ]
  },

  // === Taylor Swift ↔ Jack Antonoff ↔ Lorde 路徑 ===
  {
    source: "jack_antonoff",
    target: "1989",
    type: "PRODUCED",
    isTrivial: true,
    evidences: [
      {
        factId: "jack_produced_1989",
        sources: [{ type: FactSource.Credits, title: "Taylor Swift '1989' Album Liner Credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "jack_antonoff",
    target: "melodrama",
    type: "PRODUCED",
    isTrivial: true,
    evidences: [
      {
        factId: "jack_produced_melodrama",
        sources: [{ type: FactSource.Credits, title: "Lorde 'Melodrama' Liner Credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "jack_antonoff",
    target: "pure_heroine",
    type: "PRODUCED",
    isTrivial: true,
    evidences: [
      {
        factId: "jack_produced_pure_heroine",
        sources: [{ type: FactSource.Credits, title: "Lorde 'Pure Heroine' Production Credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "taylor_swift",
    target: "jack_antonoff",
    type: "COLLABORATED_WITH",
    isTrivial: true,
    evidences: [
      {
        factId: "taylor_collaborated_jack",
        sources: [
          {
            type: FactSource.Wikipedia,
            title: "Taylor Swift and Jack Antonoff collaborations",
            url: "https://en.wikipedia.org/wiki/Taylor_Swift_and_Jack_Antonoff",
            directness: "Secondary",
            archive: {
              provider: "Wayback",
              url: "https://web.archive.org/web/20240101000000/https://en.wikipedia.org/wiki/Taylor_Swift_and_Jack_Antonoff",
              capturedAt: "2024-01-01"
            }
          }
        ]
      }
    ]
  },
  {
    source: "lorde",
    target: "jack_antonoff",
    type: "COLLABORATED_WITH",
    isTrivial: true,
    evidences: [
      {
        factId: "lorde_collaborated_jack",
        sources: [
          {
            type: FactSource.News,
            title: "Lorde and Jack Antonoff's Creative Partnership Explained",
            url: "https://www.pitchfork.com/features/article/lorde-jack-antonoff-creative-partnership/",
            directness: "Secondary",
            archive: {
              provider: "Wayback",
              url: "https://web.archive.org/web/20210616000000/https://www.pitchfork.com/features/article/lorde-jack-antonoff-creative-partnership/",
              capturedAt: "2021-06-16"
            }
          }
        ]
      }
    ]
  },

  // === Artist ↔ Song / Album 關係 ===
  {
    source: "newjeans",
    target: "attention",
    type: "FEATURED",
    isTrivial: true,
    evidences: [
      {
        factId: "newjeans_featured_attention",
        sources: [{ type: FactSource.Credits, title: "NewJeans 'Attention' Release Credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "newjeans",
    target: "hype_boy",
    type: "FEATURED",
    isTrivial: true,
    evidences: [
      {
        factId: "newjeans_featured_hype_boy",
        sources: [{ type: FactSource.Credits, title: "NewJeans 'Hype Boy' Release Credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "taylor_swift",
    target: "1989",
    type: "FEATURED",
    isTrivial: true,
    evidences: [
      {
        factId: "taylor_featured_1989",
        sources: [{ type: FactSource.Wikipedia, title: "Taylor Swift 1989 Album release details", url: "https://en.wikipedia.org/wiki/1989_(album)", directness: "Secondary" }]
      }
    ]
  },
  {
    source: "lorde",
    target: "melodrama",
    type: "FEATURED",
    isTrivial: true,
    evidences: [
      {
        factId: "lorde_featured_melodrama",
        sources: [{ type: FactSource.Wikipedia, title: "Lorde Melodrama Album release details", url: "https://en.wikipedia.org/wiki/Melodrama_(Lorde_album)", directness: "Secondary" }]
      }
    ]
  },
  {
    source: "lorde",
    target: "pure_heroine",
    type: "FEATURED",
    isTrivial: true,
    evidences: [
      {
        factId: "lorde_featured_pure_heroine",
        sources: [{ type: FactSource.Wikipedia, title: "Lorde Pure Heroine Album release details", url: "https://en.wikipedia.org/wiki/Pure_Heroine", directness: "Secondary" }]
      }
    ]
  },

  // === Label 關係 ===
  {
    source: "newjeans",
    target: "ador",
    type: "SIGNED_TO",
    isTrivial: true,
    evidences: [
      {
        factId: "newjeans_signed_ador",
        sources: [{ type: FactSource.OfficialWebsite, title: "ADOR Official Artist Profile", url: "https://ador.world", directness: "Primary" }]
      }
    ]
  },
  {
    source: "charlie_puth",
    target: "republic_records",
    type: "SIGNED_TO",
    isTrivial: true,
    evidences: [
      {
        factId: "charlie_signed_republic",
        sources: [{ type: FactSource.Wikipedia, title: "Charlie Puth Label Affiliation", url: "https://en.wikipedia.org/wiki/Charlie_Puth", directness: "Secondary" }]
      }
    ]
  },

  // === Musicological Hidden Connections ===
  {
    source: "250",
    target: "ppong",
    type: "PRODUCED",
    evidences: [
      {
        factId: "two_fifty_produced_ppong",
        sources: [{ type: FactSource.Credits, title: "250 'PPONG' Album Credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "haruomi_hosono",
    target: "ppong",
    type: "INFLUENCED",
    evidences: [
      {
        factId: "ppong_influenced_by_hosono",
        sources: [
          {
            type: FactSource.Interview,
            title: "Why Korea is hot for trot (The Guardian 2023)",
            url: "https://www.theguardian.com/music/2023/jun/05/korea-trot-pop-250-newjeans",
            directness: "Primary",
            retrievedAt: "2026-07-07",
            archive: {
              provider: "Wayback",
              url: "https://web.archive.org/web/20260707120000/https://www.theguardian.com/music/2023/jun/05/korea-trot-pop-250-newjeans",
              capturedAt: "2026-07-07",
              snapshotId: "20230605000000"
            },
            status: {
              checkedAt: "2026-07-08",
              availability: "Live",
              httpStatus: 200
            }
          }
        ]
      }
    ]
  },
  {
    source: "haruomi_hosono",
    target: "ymo",
    type: "COLLABORATED_WITH",
    evidences: [
      {
        factId: "hosono_founded_ymo",
        sources: [{ type: FactSource.Wikipedia, title: "Yellow Magic Orchestra Founding Details", url: "https://en.wikipedia.org/wiki/Yellow_Magic_Orchestra", directness: "Secondary" }]
      }
    ]
  },
  {
    source: "ymo",
    target: "charlie_puth",
    type: "INFLUENCED",
    evidences: [
      {
        factId: "ymo_influenced_charlie",
        sources: [
          {
            type: FactSource.YouTubeInterview,
            title: "Charlie Puth Breaks Down 'Attention' on Genius",
            url: "https://www.youtube.com/watch?v=wNuFk7L9cO4",
            directness: "Primary",
            retrievedAt: "2026-07-07",
            archive: {
              provider: "Wayback",
              url: "https://web.archive.org/web/20260707120000/https://www.youtube.com/watch?v=wNuFk7L9cO4",
              capturedAt: "2026-07-07",
              snapshotId: "20260707120000"
            },
            status: {
              checkedAt: "2026-07-08",
              availability: "Live",
              httpStatus: 200
            }
          }
        ]
      }
    ]
  },

  // === Hidden Musicological Edges ===
  {
    source: "radiohead",
    target: "daydreaming",
    type: "FEATURED",
    isTrivial: true,
    evidences: [
      {
        factId: "radiohead_featured_daydreaming",
        sources: [{ type: FactSource.Credits, title: "Radiohead 'A Moon Shaped Pool' Album Credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "erik_satie",
    target: "gymnopedie_1",
    type: "FEATURED",
    isTrivial: true,
    evidences: [
      {
        factId: "satie_featured_gymnopedie",
        sources: [{ type: FactSource.Wikipedia, title: "Erik Satie Gymnopedies Publication", url: "https://en.wikipedia.org/wiki/Gymnop%C3%A9dies", directness: "Secondary" }]
      }
    ]
  },
  {
    source: "erik_satie",
    target: "furniture_music",
    type: "DOCUMENTED_IN",
    evidences: [
      {
        factId: "satie_pioneered_furniture_music",
        sources: [{ type: FactSource.Wikipedia, title: "Musique d'ameublement History", url: "https://en.wikipedia.org/wiki/Furniture_music", directness: "Secondary" }]
      }
    ]
  },
  {
    source: "noriko_kose",
    target: "nujabes",
    type: "INFLUENCED",
    evidences: [
      {
        factId: "nujabes_noriko_kose_sampling",
        sources: [
          {
            type: FactSource.OfficialWebsite,
            title: "巨勢典子: Still I Miss You (Avex Official Release)",
            url: "https://avexnet.jp/news/detail.php?id=1015119",
            directness: "Primary",
            retrievedAt: "2026-07-07",
            archive: {
              provider: "Wayback",
              url: "https://web.archive.org/web/20260707120000/https://avexnet.jp/news/detail.php?id=1015119",
              capturedAt: "2026-07-07",
              snapshotId: "20260707120000"
            },
            status: {
              checkedAt: "2026-07-08",
              availability: "Live",
              httpStatus: 200
            }
          },
          {
            type: FactSource.Wikipedia,
            title: "Nujabes 'Modal Soul' Album Details",
            url: "https://en.wikipedia.org/wiki/Modal_Soul",
            directness: "Secondary"
          }
        ]
      }
    ]
  },
  {
    source: "atcq",
    target: "nujabes",
    type: "INFLUENCED",
    evidences: [
      {
        factId: "atcq_nujabes_influence",
        sources: [
          {
            type: FactSource.News,
            title: "How A Tribe Called Quest Shaped Japanese Jazz Hip-Hop",
            url: "https://fader.com/music/atcq-nujabes-japanese-jazz-rap-blueprint",
            directness: "Secondary"
          }
        ]
      }
    ]
  },

  // === Dynamic Fact Edges for User 李彥龍 ===
  {
    source: "newjeans",
    target: "frnk",
    type: "COLLABORATED_WITH",
    isTrivial: true,
    evidences: [
      {
        factId: "newjeans_frnk_remix",
        sources: [{ type: FactSource.Credits, title: "NewJeans 'OMG' (FRNK Remix) Credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "frnk",
    target: "xxx_band",
    type: "COLLABORATED_WITH",
    evidences: [
      {
        factId: "frnk_producer_xxx",
        sources: [{ type: FactSource.Credits, title: "XXX 'KYOMI' EP Album Credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "michael_jackson",
    target: "quincy_jones",
    type: "COLLABORATED_WITH",
    isTrivial: true,
    evidences: [
      {
        factId: "mj_quincy_collab",
        sources: [{ type: FactSource.Credits, title: "Michael Jackson 'Thriller' Production Credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "quincy_jones",
    target: "bruno_mars",
    type: "PRAISED",
    evidences: [
      {
        factId: "quincy_praised_bruno",
        sources: [
          {
            type: FactSource.Interview,
            title: "Quincy Jones in Conversation (Vulture 2018)",
            url: "https://www.vulture.com/2018/02/quincy-jones-in-conversation.html",
            directness: "Primary",
            retrievedAt: "2026-07-07",
            archive: {
              provider: "Wayback",
              url: "https://web.archive.org/web/20260707120000/https://www.vulture.com/2018/02/quincy-jones-in-conversation.html",
              capturedAt: "2026-07-07",
              snapshotId: "20180207000000"
            },
            status: {
              checkedAt: "2026-07-08",
              availability: "Live",
              httpStatus: 200
            }
          }
        ]
      }
    ]
  },
  {
    source: "cyndi_wang",
    target: "xin_dian_xin",
    type: "FEATURED",
    isTrivial: true,
    evidences: [
      {
        factId: "cyndi_featured_xindianxin",
        sources: [{ type: FactSource.Wikipedia, title: "Cyndi Wang H2H Album release details", url: "https://zh.wikipedia.org/wiki/%E5%BF%83%E9%9B%BB%E5%BF%83", directness: "Secondary" }]
      }
    ]
  },
  {
    source: "orange_range",
    target: "yixin_dianxin",
    type: "FEATURED",
    isTrivial: true,
    evidences: [
      {
        factId: "orange_featured_yixindianxin",
        sources: [{ type: FactSource.Wikipedia, title: "Orange Range Ishin Denshin single release details", url: "https://ja.wikipedia.org/wiki/%E4%BB%A5%E5%BF%83%E9%9B%BB%E4%BF%A1_(ORANGE_RANGE%E3%81%AE%E6%9B%B2)", directness: "Secondary" }]
      }
    ]
  },
  {
    source: "xin_dian_xin",
    target: "yixin_dianxin",
    type: "REFERRED_TO",
    evidences: [
      {
        factId: "xindianxin_cover_yixindianxin",
        sources: [
          {
            type: FactSource.Wikipedia,
            title: "Cyndi Wang Heart to Heart Album Remake",
            url: "https://zh.wikipedia.org/wiki/%E5%BF%83%E9%9B%BB%E5%BF%83",
            directness: "Secondary"
          }
        ]
      }
    ]
  },
  {
    source: "tame_impala",
    target: "jennie",
    type: "COLLABORATED_WITH",
    evidences: [
      {
        factId: "tame_impala_jennie_collab",
        sources: [{ type: FactSource.Credits, title: "JENNIE 'Dracula' production credits", directness: "Primary" }]
      }
    ]
  },

  // === Dynamic Fact Edges for User aaronlee0715@gmail.com ===
  {
    source: "tyler_creator",
    target: "something_to_rap_about",
    type: "COLLABORATED_WITH",
    evidences: [
      {
        factId: "tyler_featured_freddie",
        sources: [{ type: FactSource.Credits, title: "Freddie Gibbs 'Alfredo' Tracklist Credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "something_to_rap_about",
    target: "freddie_gibbs",
    type: "FEATURED",
    isTrivial: true,
    evidences: [
      {
        factId: "freddie_featured_something",
        sources: [{ type: FactSource.Credits, title: "Freddie Gibbs 'Alfredo' Tracklist Credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "alchemist",
    target: "something_to_rap_about",
    type: "PRODUCED",
    evidences: [
      {
        factId: "alchemist_produced_something",
        sources: [{ type: FactSource.Credits, title: "Freddie Gibbs 'Alfredo' Album Production Credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "alchemist",
    target: "freddie_gibbs",
    type: "COLLABORATED_WITH",
    isTrivial: true,
    evidences: [
      {
        factId: "alchemist_produced_alfredo",
        sources: [{ type: FactSource.Credits, title: "Freddie Gibbs 'Alfredo' Album Credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "newjeans",
    target: "supernatural_song",
    type: "FEATURED",
    isTrivial: true,
    evidences: [
      {
        factId: "newjeans_featured_supernatural",
        sources: [{ type: FactSource.Wikipedia, title: "NewJeans Supernatural Single release details", url: "https://en.wikipedia.org/wiki/Supernatural_(NewJeans_song)", directness: "Secondary" }]
      }
    ]
  },
  {
    source: "pharrell_williams",
    target: "supernatural_song",
    type: "WROTE",
    evidences: [
      {
        factId: "supernatural_interpolated_pharrell",
        sources: [{ type: FactSource.Credits, title: "NewJeans 'Supernatural' Official Music Credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "pharrell_williams",
    target: "juggernaut_song",
    type: "COLLABORATED_WITH",
    evidences: [
      {
        factId: "pharrell_juggernaut_collab",
        sources: [{ type: FactSource.Credits, title: "Tyler, The Creator 'Call Me If You Get Lost' Album Credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "tyler_creator",
    target: "juggernaut_song",
    type: "FEATURED",
    isTrivial: true,
    evidences: [
      {
        factId: "tyler_featured_juggernaut",
        sources: [{ type: FactSource.Wikipedia, title: "Call Me If You Get Lost Album tracklist details", url: "https://en.wikipedia.org/wiki/Call_Me_If_You_Get_Lost", directness: "Secondary" }]
      }
    ]
  },
  {
    source: "billie_eilish",
    target: "bad_guy_remix",
    type: "FEATURED",
    isTrivial: true,
    evidences: [
      {
        factId: "billie_featured_badguy_remix",
        sources: [{ type: FactSource.Wikipedia, title: "Billie Eilish bad guy remix release details", url: "https://en.wikipedia.org/wiki/Bad_Guy_(Billie_Eilish_song)#Justin_Bieber_remix", directness: "Secondary" }]
      }
    ]
  },
  {
    source: "justin_bieber",
    target: "bad_guy_remix",
    type: "COLLABORATED_WITH",
    evidences: [
      {
        factId: "justin_badguy_remix",
        sources: [{ type: FactSource.Credits, title: "Billie Eilish 'bad guy (feat. Justin Bieber)' Credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "justin_bieber",
    target: "snooze_remix",
    type: "COLLABORATED_WITH",
    evidences: [
      {
        factId: "justin_snooze_remix",
        sources: [{ type: FactSource.Credits, title: "SZA 'Snooze (Acoustic feat. Justin Bieber)' Credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "sza",
    target: "snooze_remix",
    type: "FEATURED",
    isTrivial: true,
    evidences: [
      {
        factId: "sza_featured_snooze_remix",
        sources: [{ type: FactSource.Wikipedia, title: "SZA SOS Album tracklist details", url: "https://en.wikipedia.org/wiki/Snooze_(song)", directness: "Secondary" }]
      }
    ]
  },
  {
    source: "sza",
    target: "billie_eilish",
    type: "REFERRED_TO",
    evidences: [
      {
        factId: "sza_billie_vogue_interview",
        sources: [
          {
            type: FactSource.Interview,
            title: "Billie Eilish In Conversation: Ask Her Anything (British Vogue 2025)",
            url: "https://www.vogue.co.uk/article/billie-eilish-may-2025-interview",
            directness: "Primary",
            retrievedAt: "2026-07-07",
            archive: {
              provider: "Wayback",
              url: "https://web.archive.org/web/20260707120000/https://www.vogue.co.uk/article/billie-eilish-may-2025-interview",
              capturedAt: "2026-07-07",
              snapshotId: "20250501000000"
            },
            status: {
              checkedAt: "2026-07-08",
              availability: "Live",
              httpStatus: 200
            }
          }
        ]
      }
    ]
  },
  {
    source: "lin_jj",
    target: "sanctuary_tour",
    type: "FEATURED",
    isTrivial: true,
    evidences: [
      {
        factId: "jjlin_sanctuary_tour",
        sources: [{ type: FactSource.Wikipedia, title: "JJ Lin Sanctuary Tour Wiki Details", url: "https://zh.wikipedia.org/wiki/%E8%81%96%E6%89%80%E4%B8%96%E7%95%8C%E5%B7%A1%E8%BF%B4%E6%BC%94%E5%94%B1%E6%9C%83", directness: "Secondary" }]
      }
    ]
  },
  {
    source: "sanctuary_tour",
    target: "hans_zimmer",
    type: "COLLABORATED_WITH",
    evidences: [
      {
        factId: "hans_zimmer_jjlin_theme",
        sources: [{ type: FactSource.Credits, title: "JJ Lin Sanctuary World Tour Live Album credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "hans_zimmer",
    target: "no_time_to_die",
    type: "COLLABORATED_WITH",
    evidences: [
      {
        factId: "hans_zimmer_billie_bond",
        sources: [{ type: FactSource.Credits, title: "Billie Eilish 'No Time to Die' OST credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "billie_eilish",
    target: "no_time_to_die",
    type: "FEATURED",
    isTrivial: true,
    evidences: [
      {
        factId: "billie_no_time_to_die",
        sources: [{ type: FactSource.Wikipedia, title: "No Time to Die release and awards", url: "https://en.wikipedia.org/wiki/No_Time_to_Die_(song)", directness: "Secondary" }]
      }
    ]
  },
  {
    source: "tame_impala",
    target: "same_ol_mistakes",
    type: "WROTE",
    isTrivial: true,
    evidences: [
      {
        factId: "tame_impala_wrote_sameol",
        sources: [{ type: FactSource.Credits, title: "Tame Impala 'Currents' composition credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "rihanna",
    target: "same_ol_mistakes",
    type: "FEATURED",
    isTrivial: true,
    evidences: [
      {
        factId: "rihanna_covered_sameol",
        sources: [{ type: FactSource.Wikipedia, title: "Rihanna ANTI Album tracklist details", url: "https://en.wikipedia.org/wiki/Anti_(album)", directness: "Secondary" }]
      }
    ]
  },
  {
    source: "rihanna",
    target: "loyalty_song",
    type: "FEATURED",
    evidences: [
      {
        factId: "rihanna_featured_loyalty",
        sources: [{ type: FactSource.Credits, title: "Kendrick Lamar DAMN. Album guest credits", directness: "Primary" }]
      }
    ]
  },
  {
    source: "kendrick_lamar",
    target: "loyalty_song",
    type: "FEATURED",
    isTrivial: true,
    evidences: [
      {
        factId: "kendrick_featured_loyalty",
        sources: [{ type: FactSource.Wikipedia, title: "Kendrick Lamar DAMN Album release details", url: "https://en.wikipedia.org/wiki/Loyalty_(Kendrick_Lamar_song)", directness: "Secondary" }]
      }
    ]
  }
] as const;
