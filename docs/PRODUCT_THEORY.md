# Product Theory — Reveal Engine

此文件列出了目前我們對產品價值的核心猜想與假設。任何內容皆可被推翻。

> **"Fall in love with the user's reaction, not with your own theory."**
> *(愛上使用者的反應，而非你自己的理論。)*

---

## Hypotheses Tracker {產品假說追蹤表}

| ID | Hypothesis {假說描述} | Confidence {置信度} | Status {狀態} | Evidence {佐證證據} |
| :--- | :--- | :--- | :--- | :--- |
| **H001** | 使用者比起純粹的聽歌紀錄（stats.fm/Wrapped），更在乎音樂背後的隱秘故事、幕後關係與脈絡。 | **Low** | Testing | 無 (待驗證) |
| **H002** | 透過製作人 (Producer)、事件 (Event) 等幕後 Credits 串起的驚喜連結，其驚喜感高於單純的主唱藝人 (Artist) 合作關係。 | **Low** | Testing | 無 (待驗證) |
| **H003** | 一個能讓使用者發出「真的假的？」的 Reveal (揭露)，其價值與長期回看率大於十個聽歌統計圖表。 | **Low** | Testing | 無 (待驗證) |
| **H004** | 使用者更信任且更願意分享附帶明確可查出處（Wikipedia, Credits, Podcast）的真實事實，而非 AI 生成的故事。 | **Low** | Testing | 無 (待驗證) |

---

## Detailed Hypotheses {假說細節}

### H001: Context Over Log {脈絡大於日誌}
- **Metrics to Track**: `Revelation Rate`（使用者看到 Discovery 時，點擊「真的假的？」並按讚或收藏的機率）。
- **Expected Behavior**: 使用者主動點擊或截圖這些故事，而不是看一眼就滑掉。

### H002: Producer & Credits Surprise {幕後製作人關聯的驚喜感}
- **Metrics to Track**: `Rabbit Hole Rate`（使用者看完一張 Card 後，繼續沿著 Producer、Songwriter 或 Event 鏈路往下點擊探索的深度）。
- **Expected Behavior**: 使用者點入 250 或 Jack Antonoff 等原本不熟悉的幕後工作人員，並探索其作品。

### H003: Cognitive Expansion Over Curation {認知邊界的擴張}
- **Metrics to Track**: `Knowledge Expansion`（追蹤使用者個人圖譜 User Graph 中已探索/認知節點的增長幅度和主動回看率）。
- **Expected Behavior**: 使用者能藉由系統，在短時間內認識其原本不知道的音樂關聯，並主動記憶下來。

### H004: Evidence Over Authority {可查證證據大於權威推薦}
- **Metrics to Track**: `Share Rate` / `Verification Click`（點擊來源查證的頻率）。
- **Expected Behavior**: 使用者因為「有證據、有來源」而願意將這張卡片分享給朋友，不再擔心這是 AI 胡說八道的內容。

---

## Validation Log {驗證記錄檔}

- **2026-07-07**: Music Journal (V0.1) 經實際測試後判定無法解決核心問題，宣告被推翻。其負向事實記錄於 [docs/PRODUCT_GRAVEYARD.md](PRODUCT_GRAVEYARD.md) 歸檔。重啟 Reveal Engine 路線。
