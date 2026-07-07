# μ(sic) Research Log (Research Sprint 1)

本文件用於記錄所有 **Reveal Experiments {揭露實驗}** 中真實用戶的反應與後續決策。我們關注使用者的情緒反饋與驚喜瞬間，而非架構的精美。

## 評估反應指標 (Reaction Metrics)
*   🤯 **Surprised (驚奇)**: 「真的假的？我居然完全不知道這個關聯！」 (Aha-moment)
*   😮 **Interested (有趣)**: 「喔？原來他們有合作過，挺有意思的。」
*   😐 **Neutral (平淡)**: 「我知道他們有合作。這不算驚喜。」
*   😒 **Failed (無感/失敗)**: 「喔，所以呢？這兩個人我都不在乎。」
*   ❌ **No connection (無關聯)**: 無法為該用戶投影出任何路徑。

---

## Reveal Experiments Log (實驗日誌)

| Date | User ID | Reveal Experiment Path | Reaction | Evidence / User Quote | Decision |
| :--- | :--- | :--- | :---: | :--- | :--- |
| 2026-07-08 | U_TEST_B | NewJeans ↔ 250 ↔ PPONG ↔ 細野晴臣：製作人 250 牽線的幕後音色啟發路徑 | 🤯 | 「真的假的？原來 250 做了一張傳統結合電音的 PPONG，還受到了細野晴臣的啟發！」 | **Keep**: 深度成功，有極強 Aha-moment，予以保留。 |
| 2026-07-08 | test_silent | Radiohead ↔ 家具音樂 ↔ Erik Satie 雙已知連通閉環 | 🤯 | 「我超愛 Radiohead 跟 Erik Satie，但從來沒想過 Daydreaming 跟 Satie 的『家具音樂』概念在音樂學上有這種隱秘傳承！」 | **Keep (Golden)**: 完美的 A-B-C-A 閉環連通，引爆最高驚喜度。 |
| 2026-07-08 | U_TEST_D | Taylor Swift ↔ Lorde：製作人 Jack Antonoff 牽線的幕後路徑 | 😮 | 「我知道 Jack 幫她們都做過歌，但不知道是 Melodrama 的主要製作。」 | **Keep**: 事實有效，但新穎度中等，考慮引入更冷門的製作人。 |
| 2026-07-08 | U_TEST_E | (Jazz listener) | ❌ | (無關聯路徑產生) | **Optimize**: 加速擴充爵士與黑膠取樣事實庫，對接非流行樂迷。 |

---

## 研發背景：學術界與工業界的解決方案對照

針對本產品所解決的核心問題（如何在個人聆聽歷史與音樂世界間尋找有驚喜感、有解釋性的關聯），學術與工業界已有深厚的理論基礎。我們的 Pipeline 設計正是對以下主流技術路徑的工程實踐：

1.  **Serendipity Recommender (意外驚喜推薦)**：
    *   *Herlocker et al., 2004* 與 *Kaminskas & Bridge, 2016* 將 Serendipity 定義為 **Relevance (相關性) + Unexpectedness (意外感)** 的交集。純粹的準確度只會讓用戶困在「同溫層泡泡」中；完全無關的推薦又會被當成垃圾資訊。本產品利用已知投影（Relevance）透過世界模型尋找未知邊界（Unexpectedness），正是為此設計。
2.  **Meta-path Constraints (語意路徑剪枝)**：
    *   在知識圖譜遍歷中，*Shi et al., 2017* 指出，必須對遍歷路徑進行語意约束 (Meta-path constraints)。例如大唱片公司 (`label`) 這種樞紐節點 (Hub Nodes) 信息量極低（IC 偏低），若允許其傳播會稀釋關聯度，產生無意義的捷徑。這正是我們本輪加入的 **「DFS 語意路徑約束」** 所解決的關鍵問題。
3.  **Bisociative Search (雙向聯想尋訪)**：
    *   利用圖譜中的製作人（如 250、Jack Antonoff）或跨界事件作為橋樑（Bridge Node），去連通兩個本不相干的音樂子域（如 K-pop 與歐美 Indie），促成使用者的 Aha-moment。

