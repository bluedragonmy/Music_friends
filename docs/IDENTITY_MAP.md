# μ(sic) Identity Map {身份地圖}

本文件定義 Listening Identity {聆聽身份} 與客觀聆聽行為指標（Behaviors）之間的加權映射關係，以及系統如何衡量推論的 **Confidence {信賴度}**。

> **Identity is a lens, not a label.**
>
> 每一個 Listening Identity 是用來觀察使用者音樂行為的一面鏡頭，而非對使用者貼上的標籤。

---

## 1. Listening Identity 加權公式模型 (Identity Weighting Formulas)

聆聽身份是多個客觀行為指標的加權線性組合（Weighted Combination）。所有指標在計算前皆須先常態化至 `[0, 1]` 區間。每一項身份的得分最終將落在 `[0, 1]`。

### 1.1 Explorer {探索者}
- **核心定義**：積極開拓音樂疆界、對未知的旋律富有強烈好奇心的聆聽者。
- **加權公式**：
  $$\text{Explorer Score} = \text{Novelty Index} \times 0.35 + \text{Genre Diversity} \times 0.25 + \text{Artist Diversity} \times 0.20 - \text{Repeat Rate} \times 0.15 + \text{Session Pattern} \times 0.05$$
- **說明**：
  - `Novelty Index` {原創性指數} 與 `Genre Diversity` {曲風多樣性} 是主力貢獻指標。
  - `Repeat Rate` {重聽率} 帶有負權重，因為高循環播放意味著探索度降低。

### 1.2 Collector {收集者}
- **核心定義**：偏好建立自己熟悉的音樂舒適圈，對喜愛的歌曲進行深度重複與收藏的聆聽者。
- **加權公式**：
  $$\text{Collector Score} = \text{Repeat Rate} \times 0.40 + \text{Session Length (Familiar Tracks)} \times 0.25 - \text{Novelty Index} \times 0.20 + \text{Saved Songs Ratio} \times 0.15$$
- **說明**：
  - `Repeat Rate` {重聽率} 權重最高。
  - `Novelty Index` {原創性指數} 帶有負權重。

### 1.3 Night Owl {夜貓子}
- **核心定義**：深夜時段與音樂連結最深的聆聽者。
- **加權公式**：
  $$\text{Night Owl Score} = \text{Late Night Ratio (22:00 ~ 04:00)} \times 0.80 + \text{Session Length (Late Night)} \times 0.20$$
- **說明**：
  - 高度偏向時間分布指標，當使用者在深夜（本地時間 22:00 到凌晨 04:00）的播放量與時間占比越高，夜貓子屬性越強烈。

### 1.4 Emotion Driven {情緒驅動者}
- **核心定義**：聽歌情境高度依賴當下情感起伏，播放清單內歌曲的聲學屬性（Valence 愉悅度、Energy 能量）呈現高度集中或劇烈變異的聆聽者。
- **加權公式**：
  $$\text{Emotion Driven Score} = \text{Valence Variance (Within Session)} \times 0.40 + \text{Tempo Consistency} \times 0.30 + \text{Energy Distribution} \times 0.30$$

---

## 2. Confidence {信賴度} 機制

**Transparent AI {透明化人工智慧} 的底線：不隨便猜測。**

若使用者的聽歌數據不足，即使算出高分聆聽身份，系統也必須降低其 **Confidence {信賴度}**，並在 Dashboard 介面上對使用者坦誠「目前的數據還不夠了解你」。

### 2.1 信賴度計算公式
信賴度數值為 `0.0 ~ 1.0`，基於四個因子乘積：

$$\text{Confidence} = Coverage \times Consistency \times Recency \times Representativeness$$

* 因子定義：
  - `Coverage` {覆蓋度}：聽歌總數占最低要求之比例。
  - `Consistency` {一致性}：聽歌天數在觀察視窗天數中的占比。
  - `Recency` {近距性}：對近期播放事件進行時間衰減權重計量。
  - `Representativeness` {代表性}：衡量使用者的聆聽行為是否足以代表其真實偏好，避免偶發性或單一重播導致指標偏差。

### 2.2 Dashboard 呈現標準
信賴度不以精確百分比數字呈現，而是轉換為使用者可讀的語意標籤：
- `Confident`：Confidence ≥ 0.7
- `Growing`：0.3 ≤ Confidence < 0.7
- `Emerging`：Confidence < 0.3
