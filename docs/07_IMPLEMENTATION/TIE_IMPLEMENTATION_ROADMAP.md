# Taste Intelligence Engine (TIE) — Implementation Roadmap v1.0

本開發路線圖將 TIE 的落地過程拆分為四個階段（Sprints），從 MVP 基礎架構演進至 v1.0 生產環境發布。

---

## 📅 開發階段規劃 (Roadmap Sprints)

```
┌────────────────────────────────────────────────────────┐
│                        TIE MVP                         │
│ Sprint 1: World Model & Entity Resolution             │
│ - Establish Unified Song Entity                       │
│ - Integrate Spotify History & Metadata                │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                        TIE Beta                        │
│ Sprint 2: Hypothesis Core & Bayesian Ranking           │
│ - Implement Generator & Verifier                       │
│ - Calculate Surprise & Information Gain                │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                       TIE Release                      │
│ Sprint 3: Narrative & Interactive Feedback             │
│ - Hook up LLM for structured explanation templates     │
│ - Build Feedback Loop and Prior probability updates    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                        TIE v1.0                        │
│ Sprint 4: Performance & Latent Trajectory              │
│ - Render dynamic taste evolution timeline UI           │
│ - Optimize query response times                       │
└────────────────────────────────────────────────────────┘
```

---

## 🎯 階段里程碑與驗收標準 (Milestones & Acceptance Criteria)

### Sprint 1: MVP 基礎架構 {實體與世界模型建立}
*   **目標**：打通多來源數據管道，建立 Unified Song Entity。
*   **產出物**：
    *   `UnifiedSong` 數據標準化映射模組。
    *   `MusicWorldModel` 與 `PersonalTasteGraph` 的記憶體圖譜查詢 API。
*   **驗收標準**：
    *   Spotify 歌曲能成功關聯至 MusicBrainz 與 Discogs 的製作與風格元數據。

### Sprint 2: Beta 推論引擎 {假說生成與貝氏排序核心}
*   **目標**：實作 TIE 推論大腦。
*   **產出物**：
    *   `HypothesisGenerator`：實作 Type I 至 Type V 假說的動態生成。
    *   `EvidenceVerifier`：檢索圖譜路徑並計算證據強度，過濾無事實支持假說。
    *   `taste_ranker`：根據驚奇度（Surprise）與後驗機率對假說進行貝氏排序。
*   **驗收標準**：
    *   給予模擬用戶數據，系統能自動壓低顯而易見的常識假說（如：你常聽某歌手因為你喜歡該流派），並排序出高驚奇度、高證據強度的假說。

### Sprint 3: Release 敘事與閉環 {故事渲染與用戶反饋學習}
*   **目標**：輸出可讀性強的品味故事，並加入使用者反饋更新機制。
*   **產出物**：
    *   `Narrator` 模組：整合 LLM（如 Gemini API / Claude API）以結構化模板生成品味解析故事，防止幻覺。
    *   `FeedbackLoop`：前端收集 `Correct` / `Incorrect` 反饋，並反向更新貝氏排序的先驗機率。
*   **驗收標準**：
    *   LLM 生成的故事 100% 基於傳入的 `EvidenceChain`，無任何自行捏造的音樂史實。

### Sprint 4: v1.0 優化發布 {品味軌跡渲染與性能調優}
*   **目標**：性能優化與動態品味演化軌跡 UI 渲染。
*   **產出物**：
    *   `TasteTrajectory` 軌跡分析：輸出隨時間變化的隱性品味特徵變動。
    *   前端 `Dashboard Timeline` UI：以動態時間軸與折線圖呈現使用者品味的演化軌跡。
*   **驗收標準**：
    *   圖譜大數據下的推論延遲小於 200ms。
