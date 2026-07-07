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
    reflection: "",
    version: "1.0",
    evidenceTemplate: "今天這張卡，來自最近 30 天的聆聽紀錄：\n• 第一次播放歌曲比例：{noveltyPercent}%"
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
    reflection: "",
    version: "1.0",
    evidenceTemplate: "今天這張卡，來自最近 30 天的聆聽紀錄：\n• 跨足曲風流派：{genresCount} 種"
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
    reflection: "",
    version: "1.0",
    evidenceTemplate: "今天這張卡，來自最近 7 天的聆聽紀錄：\n• 重複播放率：{repeatPercent}%"
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
    reflection: "",
    version: "1.0",
    evidenceTemplate: "今天這張卡，來自最近 7 天的聆聽紀錄：\n• 重複播放比率：{repeatPercent}%\n• 單曲循環數：{trackCount} 首"
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
    reflection: "",
    version: "1.0",
    evidenceTemplate: "今天這張卡，來自最近 7 天的聆聽紀錄：\n• 深夜播放比例：{midnightPercent}%"
  },
  {
    id: "obs_moment_early_bird",
    category: "moment",
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
    reflection: "",
    version: "1.0",
    evidenceTemplate: "今天這張卡，來自凌晨播放紀錄：\n• 播放時間：凌晨 {hour}:00"
  },
  {
    id: "obs_moment_first_album",
    category: "moment",
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
    reflection: "",
    version: "1.0",
    evidenceTemplate: "今天這張卡，來自專輯聆聽紀錄：\n• 完整聆聽專輯：《{albumName}》\n• 聆聽總時長：{duration} 分鐘"
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
    reflection: "",
    version: "1.0",
    evidenceTemplate: "今天這張卡，來自最近 7 天與上週的對比：\n• 平均音樂速度 (BPM) 下降：{decreasePercent}%"
  },
  // ─── Remembering Engine (喚醒) ───
  {
    id: "obs_remembering_forgotten",
    category: "remembering",
    title: "被時間留下的歌",
    trigger: { playForgottenSong: true },
    priority: "high",
    rarity: "legendary",
    cooldown: 45,
    emotion: "nostalgic",
    tone: "warm",
    microcopy: {
      loop_step_1: "今天，你無意間按下了回播鍵...",
      loop_step_2: "你已經 {days} 天沒有再聽過它了。但它曾經陪你走過一整個冬天。",
      loop_step_3: "重溫這首《{trackName}》時，那段被你留在過去的時光，現在誰在替你記得？"
    },
    reflection: "",
    version: "1.0",
    evidenceTemplate: "今天這張卡，來自你的歷史聆聽回顧：\n• 未播放天數：{days} 天\n• 歷史播放次數：{historyCount} 次"
  },
  {
    id: "obs_remembering_no_skip_longest",
    category: "remembering",
    title: "長時的沉浸",
    trigger: { playedLongNoSkip: true },
    priority: "high",
    rarity: "rare",
    cooldown: 15,
    emotion: "peaceful",
    tone: "calm",
    microcopy: {
      loop_step_1: "在今天喧鬧的世界裡，你劃出了一塊安靜的領地...",
      loop_step_2: "最長的一次。{duration} 分鐘。沒有切歌。",
      loop_step_3: "你耐心地聽完了《{trackName}》，沒有按下一次跳過鍵。那一刻，你在逃避什麼，還是找回了什麼？"
    },
    reflection: "",
    version: "1.0",
    evidenceTemplate: "今天這張卡，來自單曲聆聽紀錄：\n• 完整聆聽時長：{duration} 分鐘\n• 跳過次數：0 次"
  },
  {
    id: "obs_remembering_midnight_isolation",
    category: "remembering",
    title: "深夜的隻身",
    trigger: { midnightSilence: true },
    priority: "high",
    rarity: "rare",
    cooldown: 15,
    emotion: "quiet",
    tone: "empathetic",
    microcopy: {
      loop_step_1: "在全世界都入睡的黑夜裡，只有你在聽著...",
      loop_step_2: "凌晨 {time} 你播放了它。之後，沒有再播放任何音樂。",
      loop_step_3: "在點播這首《{trackName}》之後，你的耳朵迎來了長長的寂靜。那時候的你，是終於睡著了，還是陷入了更深的清醒？"
    },
    reflection: "",
    version: "1.0",
    evidenceTemplate: "今天這張卡，來自深夜播放紀錄：\n• 深夜播放時間：凌晨 {time}\n• 隨後安靜時長：直到天亮"
  },
  // ─── Echo (共鳴) ───
  {
    id: "obs_echo_seasonal_return",
    category: "echo",
    title: "季節的回聲",
    trigger: { seasonalReturn: true },
    priority: "high",
    rarity: "rare",
    cooldown: 30,
    emotion: "nostalgic",
    tone: "warm",
    microcopy: {
      loop_step_1: "今天，你重新播起了某個熟悉的氣味...",
      loop_step_2: "你點播了《{trackName}》，那是去年冬天你播放頻率最高的聲音。",
      loop_step_3: "旋律再次響起，就像在和過去的自己握手。你覺得他現在過得好不好？"
    },
    reflection: "",
    version: "1.0",
    evidenceTemplate: "今天這張卡，來自跨季節播放對比：\n• 上次熱播時間：去年冬天\n• 歷史播放次數：{playCount} 次"
  }
];;

export const getRarityScore = (rarity: string): number => {
  switch (rarity) {
    case "legendary": return 100;
    case "rare": return 75;
    case "uncommon": return 50;
    case "common": return 25;
    default: return 0;
  }
};
