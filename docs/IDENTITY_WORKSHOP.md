# μ(sic) Identity Workshop {認同工作坊}

本文件記錄 μ(sic) **Mission III: Identity Layer {身份層}** 啟動前的工作坊討論成果。本階段聚焦於將底層的 Listening Behaviors {聆聽行為} 轉譯為使用者能產生共鳴的 **Listening Identities {聆聽身份}**，同時維持學術等級的 Traceability {可追溯性}。

> **Identity is a lens, not a label.**
>
> 我們不是說「你就是 Explorer」。
>
> 我們是說：「透過 Explorer 這個鏡頭，來看你的音樂行為。」

---

## 1. Listening Identity 候選目錄 (Identity Candidate Registry)

以下列出 **十個** 候選 Listening Identity {聆聽身份}。Mission III 第一版將實作前四個（標記為 **[v1]**），其餘六個預先命名並定義語意，為後續 Mission 保留擴展空間。

### [v1] 1. Explorer {探索者}
- **語意**：主動尋求新的音樂視角與多樣刺激，對未知旋律及風格有高度開放度。
- **行為依賴圖 (Rule Graph)**：
  ```text
  Explorer
    ├── depends on: Novelty Index (正相關, 權重 0.6)
    ├── depends on: Genre Diversity (正相關, 權重 0.4)
    └── inversely: Repeat Rate (反指標)
  ```
- **推論公式**：$ExplorerScore = Novelty \times 0.6 + GenreDiversity \times 0.4$
- **Why 模板**：「Because you frequently discover new songs and explore across different genres.」
- **Reflection**：*When was the last time a song changed your perspective?*

### [v1] 2. Collector {收集者}
- **語意**：傾向於建立高度個人化的音樂安全感，透過重複聆聽來進行情感錨定與回憶存檔。
- **行為依賴圖 (Rule Graph)**：
  ```text
  Collector
    ├── depends on: Repeat Rate (正相關, 權重 1.0)
    └── inversely: Novelty Index (反指標)
  ```
- **推論公式**：$CollectorScore = RepeatRate$
- **Why 模板**：「Because you return to specific songs repeatedly, building a personal archive of meaningful sounds.」
- **Reflection**：*Which song has stayed with you the longest?*

### [v1] 3. Night Owl {夜貓子}
- **語意**：深夜是其與音樂連結最深、最容易進入反思性思考的情境。
- **行為依賴圖 (Rule Graph)**：
  ```text
  Night Owl
    └── depends on: Peak Listening Hour (時間區間判斷)
  ```
- **推論公式**：
  - 若 $22 \le PeakHour \le 23$ 或 $0 \le PeakHour \le 5$，$NightOwlScore = 1.0$
  - 若 $20 \le PeakHour \le 21$ 或 $6 \le PeakHour \le 7$，$NightOwlScore = 0.5$
  - 其餘時段為 $0.0$
- **Why 模板**：「Because your listening peaks during the quiet hours of the night.」
- **Reflection**：*Why do quiet hours feel different with music?*

### [v1] 4. Emotion Driven {情緒驅動者}
- **語意**：將旋律與聲學氣氛作為情緒投射與調節的模板。
- **行為依賴圖 (Rule Graph)**：
  ```text
  Emotion Driven
    ├── depends on: Acousticness (AudioFeature 平均, 權重 0.3)
    ├── depends on: Valence inverse (1.0 - Valence 平均, 權重 0.4)
    └── depends on: Energy inverse (1.0 - Energy 平均, 權重 0.3)
  ```
- **推論公式**：$EmotionDrivenScore = Acousticness \times 0.3 + (1.0 - Valence) \times 0.4 + (1.0 - Energy) \times 0.3$
- **Why 模板**：「Because your music choices lean toward acoustic, introspective sounds that echo inner emotional states.」
- **Reflection**：*Do you choose music, or does your mood choose it for you?*

---

### [future] 5. Routine Listener {規律聆聽者}
- **語意**：擁有穩定的聆聽節奏，每天在固定時段、固定時長聆聽音樂。
- **行為依賴**：Session Length 穩定度、日間聆聽時段一致性。
- **Reflection**：*Is your daily rhythm reflected in your playlists?*

### [future] 6. Memory Keeper {記憶守護者}
- **語意**：傾向聆聽特定年代或過去時期的音樂，喚起回憶而非追求新鮮感。
- **行為依賴**：Track 發行年份分布偏移、長期重聽同一批曲目。
- **Reflection**：*What memory plays when you hear that song?*

### [future] 7. Mood Regulator {情緒調節者}
- **語意**：有意識地用音樂來改變或維持自身情緒狀態（例如低潮時聽振奮的歌）。
- **行為依賴**：Valence 與 Energy 在 Session 內的變化方向與趨勢。
- **Reflection**：*When you feel down, do you reach for bright sounds or dark ones?*

### [future] 8. Album Listener {專輯聆聽者}
- **語意**：傾向完整聆聽整張專輯而非單曲跳播。
- **行為依賴**：連續播放同一專輯的 Track 序列比例。
- **Reflection**：*When was the last time you listened to an album from start to finish?*

### [future] 9. Genre Hopper {類型跳躍者}
- **語意**：在單一 Session 內頻繁切換不同音樂類型，風格跳動極快。
- **行為依賴**：Session 內 Genre 切換頻率（Genre Transition Rate）。
- **Reflection**：*Does your music taste feel like a conversation or a collage?*

### [future] 10. Comfort Seeker {安心追尋者}
- **語意**：在壓力或不確定時刻，回歸最熟悉的聲音以尋找心理安全感。
- **行為依賴**：在特定時間壓力期（如深夜或密集聆聽期）的 Repeat Rate 突增。
- **Reflection**：*Which sound makes you feel like you're home?*

---

## 2. Dashboard 呈現：程度標籤而非百分比

Dashboard 第一眼不顯示精確的數字百分比，而是以語意化的**程度標籤 (Level Label)** 呈現：

| 分數範圍 (Raw Score) | 顯示標籤 (Display Label) |
| :--- | :--- |
| `≥ 0.7` | **High** |
| `0.3 ~ 0.69` | **Moderate** |
| `< 0.3` | **Low** |

Confidence 同樣以語意呈現：

| Confidence 範圍 | 顯示標籤 |
| :--- | :--- |
| `≥ 0.7` | **Confident** |
| `0.3 ~ 0.69` | **Growing** |
| `< 0.3` | **Emerging** |

---

## 3. 信賴度升級：Representativeness {代表性} 引入

為防範武斷推論，我們在原本的 Confidence {信賴度} 公式中，引入第四個乘積項：

$$Confidence = Coverage \times Consistency \times Recency \times Representativeness$$

### Representativeness {代表性} 計算設計
- **定義**：衡量當前時間窗口內，用戶的聆聽行為是否足以代表其真實偏好，避免偶發性或單一重播導致指標偏差。
- **計算方法**：
  $$Representativeness = \min\left(1.0, \frac{\text{Unique Tracks Count}}{\min(\text{Total Play Count}, 10)}\right)$$
- **邏輯說明**：
  - 若使用者在 7 天內聽了 50 首歌，但這 50 首歌全部都是同一首曲子（Unique Tracks = 1），Representativeness 僅為 0.1，信賴度會急遽下降。

---

## 4. Dashboard UX 四層展開流程

每個 Listening Identity 卡片遵循 **四層 Collapsible {可折疊}** 互動設計：

```text
┌─────────────────────────────────────────────┐
│ Explorer                             High   │
│                                  Confident  │
│                                             │
│ [▼ Why?]                                    │
└─────────────────────────────────────────────┘
                    │  (展開後)
                    ▼
┌─────────────────────────────────────────────┐
│ Explorer                             High   │
│                                  Confident  │
│                                             │
│ Why?                                        │
│ Because you frequently discover new songs   │
│ and explore across different genres.         │
│                                             │
│ Evidence:                                   │
│ • Novelty Index: 83%                        │
│   (42 new songs discovered this week)       │
│ • Genre Diversity: 72%                      │
│   (8 different styles explored)             │
│                                             │
│ Reflection:                                 │
│ "When was the last time a song              │
│  changed your perspective?"                 │
└─────────────────────────────────────────────┘
```

此四層流程為：
1. **Identity {身份}**：名稱 + 程度（High / Moderate / Low）+ 信賴度語意標籤。
2. **Why {為什麼}**：一句自然語言的人類可讀解釋。
3. **Evidence {證據}**：底層的 Measure 指標數值。
4. **Reflection {反思}**：與該身份對應的自省問句。
