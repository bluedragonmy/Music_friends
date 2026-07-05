import { ObservationRule } from "./types";

export const observationRules: ObservationRule[] = [
  {
    id: "obs_novelty_explorer",
    category: "pattern",
    title: "尋找未知的旅人",
    trigger: { noveltyIndexMin: 0.75 },
    priority: "medium",
    rarity: "uncommon",
    cooldown: 30,
    emotion: "curious",
    tone: "gentle",
    microcopy: {
      loop_step_1: "有一件事情，比我們原本預期的還要明顯...",
      loop_step_2: "過去 30 天，有 {noveltyPercent}% 的播放都是新歌曲。",
      loop_step_3: "我們很好奇，你是不是一直都在尋找新的東西？"
    },
    reflection: "這跟你現在的生活有關嗎？你同意嗎？"
  },
  {
    id: "obs_genre_pioneer",
    category: "pattern",
    title: "跨越邊界的耳朵",
    trigger: { genreDiversityMin: 0.8 },
    priority: "medium",
    rarity: "rare",
    cooldown: 30,
    emotion: "excited",
    tone: "poetic",
    microcopy: {
      loop_step_1: "我們在你的聆聽足跡中，看見了一幅無邊界的畫作...",
      loop_step_2: "你最近跨越了 {genresCount} 種不同的曲風流派。",
      loop_step_3: "你是一個不喜歡被單一規則定義的音樂開拓者嗎？"
    },
    reflection: "在日常生活中，你也是一個討厭邊界的人嗎？"
  },
  {
    id: "obs_repetition_collector",
    category: "pattern",
    title: "舊友的避風港",
    trigger: { repeatRateMin: 0.6 },
    priority: "medium",
    rarity: "common",
    cooldown: 30,
    emotion: "nostalgic",
    tone: "warm",
    microcopy: {
      loop_step_1: "你的播放清單裡，有一群非常有默契的舊朋友...",
      loop_step_2: "你這週有 {repeatPercent}% 的聆聽都交給了重複的旋律。",
      loop_step_3: "在海量的音樂中，你似乎更願意回到那些熟悉而安心的安全牌身邊。"
    },
    reflection: "看到這個觀察，你的第一個反應是什麼？"
  },
  {
    id: "obs_monotonous_comfort",
    category: "change",
    title: "熟悉的依戀",
    trigger: { repeatRateMin: 0.85 },
    priority: "high",
    rarity: "rare",
    cooldown: 14,
    emotion: "comforting",
    tone: "empathetic",
    microcopy: {
      loop_step_1: "最近，你的音樂世界開始變得比較單一...",
      loop_step_2: "你幾乎整天都在重複播放同樣的 {trackCount} 首歌曲。",
      loop_step_3: "不知道最近是不是有什麼事情，讓熟悉的旋律變得特別重要？"
    },
    reflection: "這段旋律，在為你分擔著什麼樣的情緒呢？"
  },
  {
    id: "obs_temporal_night_owl",
    category: "pattern",
    title: "午夜的對話者",
    trigger: { midnightRatioMin: 0.35 },
    priority: "high",
    rarity: "uncommon",
    cooldown: 30,
    emotion: "peaceful",
    tone: "calm",
    microcopy: {
      loop_step_1: "當白天的喧囂褪去，你的音樂世界才正要亮起...",
      loop_step_2: "你這週有 {midnightPercent}% 的播放時間都落在深夜與凌晨。",
      loop_step_3: "深夜的那些歌，你是在聽歌手唱的故事，還是在聽自己無法對他人訴說的獨白？"
    },
    reflection: "為什麼夜晚的音樂，聽起來總是比白天的更像是一種陪伴？"
  },
  {
    id: "obs_milestone_early_bird",
    category: "milestone",
    title: "晨光的序曲",
    trigger: { peakHourRange: [4, 6] },
    priority: "high",
    rarity: "rare",
    cooldown: 14,
    emotion: "hopeful",
    tone: "warm",
    microcopy: {
      loop_step_1: "今天，我們注意到了一道特別的光芒...",
      loop_step_2: "你在凌晨 {hour}:00 就按下播放鍵，比平常早了兩個小時。",
      loop_step_3: "在清晨的安靜中，那首 {trackName} 是為了開啟美好的一天，還是延續昨晚的餘溫？"
    },
    reflection: "早晨聽歌時的你，內心是平靜的還是充滿期待的？"
  },
  {
    id: "obs_milestone_first_album",
    category: "milestone",
    title: "一張專輯的旅程",
    trigger: { hasCompletedAlbum: true },
    priority: "high",
    rarity: "legendary",
    cooldown: 90,
    emotion: "focused",
    tone: "poetic",
    microcopy: {
      loop_step_1: "在這個零碎的串流時代，你做了一件很奢侈的事...",
      loop_step_2: "你今天完整聽完了整張專輯《{albumName}》。",
      loop_step_3: "花了整整 {duration} 分鐘，沒有跳過，這需要極大的專注與儀式感。"
    },
    reflection: "這張專輯吸引你的，是它的音樂性，還是它所講述的完整故事？"
  },
  {
    id: "obs_change_tempo_slowdown",
    category: "change",
    title: "慢下來的節奏",
    trigger: { tempoDecreaseMin: 0.2 },
    priority: "high",
    rarity: "rare",
    cooldown: 30,
    emotion: "quiet",
    tone: "gentle",
    microcopy: {
      loop_step_1: "你的音樂步調，似乎跟上週不太一樣了...",
      loop_step_2: "你播放曲目的平均 BPM 下降了 {decreasePercent}%。",
      loop_step_3: "旋律正在慢下來。你的生活，是不是也正在試圖尋找一個慢下來的空檔？"
    },
    reflection: "這個慢節奏，符合你目前的呼吸頻率嗎？"
  },
  {
    id: "obs_memory_old_capsule",
    category: "memory",
    title: "重啟的時空膠囊",
    trigger: { playTimeTravelSong: true },
    priority: "high",
    rarity: "legendary",
    cooldown: 45,
    emotion: "nostalgic",
    tone: "warm",
    microcopy: {
      loop_step_1: "今天，你打開了一個塵封已久的盒子...",
      loop_step_2: "你重播了一首 {years} 年前第一次加入收藏的歌：《{trackName}》。",
      loop_step_3: "這段旋律再次響起時，你是否也一瞬間回到了那個時空的某個角落？"
    },
    reflection: "當初收藏這首歌的你，和現在聽這首歌的你，有些什麼不同？"
  }
];

export const getRarityScore = (rarity: string): number => {
  switch (rarity) {
    case "legendary": return 100;
    case "rare": return 75;
    case "uncommon": return 50;
    case "common": return 25;
    default: return 0;
  }
};
