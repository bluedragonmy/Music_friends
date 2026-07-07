# Evidence of Surprise — μ(sic)

此文件記錄了真實使用者對於 **Revelation {揭露}** 刺激的具體反應（Reaction）與行為證據（Evidence）。

我們不只記錄成功（驚喜），更記錄失敗（無感）。這是訓練與校準 **Curiosity Engine {好奇心引擎}** 的唯一養分。

---

## Surprise Log {驚喜與無感紀錄}

### R001 — Charlie Puth ↔ 250 ↔ NewJeans
- **User**: P03 (Beta Tester)
- **Path**: `Charlie Puth` --(APPEARED_AT)--> `Podcast` --(MENTIONED_IN)--> `250` --(COLLABORATED_WITH)--> `NewJeans`
- **Result**: **Hit (驚喜)**
- **User Reaction**: 「真的假的？他有寄 demo 給 NewJeans 的製作人？」
- **Behavioral Evidence**: 
  1. 停留於該頁面 28 秒。
  2. 主動在手機瀏覽器搜尋該 Podcast 與 250 的維基百科。
  3. 截圖並分享至通訊軟體群組。
- **Actionable Decision**: 導致決策 [D002](DECISIONS.md)（將 Event 作為核心圖節點）。

---

### R002 — Taylor Swift ↔ Jack Antonoff ↔ Lorde
- **User**: P01 (Self-Observation)
- **Path**: `Taylor Swift` --(COLLABORATED_WITH)--> `Jack Antonoff` <--(COLLABORATED_WITH)-- `Lorde`
- **Result**: **Hit (驚喜)**
- **User Reaction**: 「這兩人的歌我聽了好幾年，但我以前從來不知道他們都是找同一個製作人做完整張專輯...」
- **Behavioral Evidence**: 
  1. 在 Jack Antonoff 作品節點停留探索了 12 分鐘。
  2. 表示以後聽這兩人的歌會主動注意 Credits。
- **Actionable Decision**: 導致決策 [D003](DECISIONS.md)（將 Credits/Producer 放進未來 Traversal 重點）。

---

### R003 — Taylor Swift ↔ Republic Records ↔ Charlie Puth
- **User**: P07 (Tester)
- **Path**: `Taylor Swift` --(SIGNED_TO)--> `Republic Records` <--(SIGNED_TO)-- `Charlie Puth`
- **Result**: **Miss (無感)**
- **User Reaction**: 「喔。」
- **Behavioral Evidence**: 
  1. 停頓 2 秒，直接關閉卡片。
  2. 沒有產生任何點擊或回饋。
  3. 指出：「這兩個人都在環球旗下的廠牌，很正常吧，沒什麼好驚訝的。」
- **Actionable Decision**: 導致決策 [D004](DECISIONS.md)（Curiosity Evaluator 應過濾掉純 Label 簽約關係，因為新穎度與稀有度過低）。

---

### R004 — NewJeans ↔ ADOR ↔ HYBE
- **User**: P02 (Tester)
- **Path**: `NewJeans` --(SIGNED_TO)--> `ADOR` --(PARENT_COMPANY)--> `HYBE`
- **Result**: **Miss (無感)**
- **User Reaction**: 「大家都知道啊。」
- **Behavioral Evidence**: 
  1. 停留 1.5 秒即關閉。
  2. 指出：「這太常識了，根本不算隱秘關聯。」
- **Actionable Decision**: 導致決策 [D004](DECISIONS.md)（Curiosity Evaluator 應大幅降低常識性節點的 Popularity 分數）。
