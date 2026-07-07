export interface Discovery {
  id: string;
  title: string;
  summary: string;
  entities: string[];
  path: string[];
  sources: string[];
  confidence: 'Low' | 'Medium' | 'High';
}

// 模擬 Today's Discovery 的獲取
export function getTodaysDiscovery(): Discovery {
  return {
    id: "disc_charlie_newjeans",
    title: "跨越流行與 K-Pop 的隱秘交會",
    summary: "你最近一直在聽 NewJeans。今天有件事你可能不知道：流行金曲製造機 Charlie Puth 曾主動將自己的 Demo 作品寄給 NewJeans 的總製作人 250，表達合作意願。這兩個看似處於完全不同音樂維度的世界，其實很早以前就在幕後產生了交會。",
    entities: ["Charlie Puth", "250", "NewJeans"],
    path: ["Charlie Puth", "250", "NewJeans"],
    sources: [
      "Wikipedia (250 Producer Credits)",
      "MMA (Melon Music Awards) Interview",
      "Korean Indie Podcast Spotlight"
    ],
    confidence: "High"
  };
}
