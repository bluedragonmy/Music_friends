# Taste Intelligence Engine (TIE) — AI Agent Task List v1.0

本文件將 TIE 的實作拆解為具體、獨立且具備明確輸入與輸出的開發任務（Tasks）。每個任務規模控制在 200–500 行程式碼，便於 AI Coding Agent 逐步且高品質地完成。

---

## 📋 開發任務清單 (Task Checklist)

### 1. Sprint 1: MVP Data & World Model (數據與世界模型)

#### `[ ]` Task 1.1: 實作 Unified Song Entity 數據標準化與映射
*   **目標**：建立 `apps/web/lib/graph/song.ts`，實作 `UnifiedSong` 的型別定義，並寫入從 Spotify JSON、MusicBrainz API JSON 與 Discogs Credit JSON 提取欄位並對齊的 Normalization 邏輯。
*   **輸入**：原始多來源 JSON 數據。
*   **輸出**：標準化的 `UnifiedSong` 物件。

#### `[ ]` Task 1.2: 建立 Music World Model 的記憶體查詢 API
*   **目標**：在 `apps/web/lib/graph/world-model.ts` 中建立 `MusicWorldModel` 類別，封裝圖譜節點與邊的查詢方法（例如：`findProducersBySong(songId)`、`findInfluencedArtists(artistId)`），並實作 Evidence 溯源物件的 Provenance 欄位讀取。
*   **輸入**：`SEED_EDGES` 與 `SEED_ENTITIES` 資料庫。
*   **輸出**：回傳具備 Provenance 的圖譜子結構。

---

### 2. Sprint 2: Inference & Ranking (推論與貝氏排序)

#### `[ ]` Task 2.1: 實作 Hypothesis Generator (品味假說生成器)
*   **目標**：在 `apps/web/lib/graph/hypothesis-generator.ts` 中實作假說衍生邏輯。基於使用者的 Top Tracks 與聽歌習慣，掃描圖譜中潛在的 Observable、Structural、Stylistic 等五類品味關係，自動生成 50 個以上的假說候選。
*   **輸入**：User Listening Profile。
*   **輸出**：`CandidateHypothesis[]`。

#### `[ ]` Task 2.2: 實作 Evidence Verifier (證據驗證器)
*   **目標**：在 `apps/web/lib/graph/evidence-verifier.ts` 中，對每一個候選假說進行圖譜驗證。透過尋找真實的 `Credits` 或 `Interview` 路徑來計算 `Evidence Strength`，剔除無法證實的假說，並為留存的假說建構完整的 `EvidenceChain`。
*   **輸入**：`CandidateHypothesis[]`。
*   **輸出**：`VerifiedHypothesis[]`。

#### `[ ]` Task 2.3: 實作 taste_ranker 貝氏排序模組
*   **目標**：在 `apps/web/lib/graph/taste_ranker.ts` 中實作貝氏更新與目標函數排序。根據使用者的聽歌機率更新假說的後驗機率 $P(H|D)$，計算 $KL$ 散度以量化 **Surprise Score {驚奇分數}**，並結合可解釋性與複雜度懲罰，輸出最終的 Insight 排序。
*   **輸入**：`VerifiedHypothesis[]`。
*   **輸出**：排名的 `TasteInsight[]`。

---

### 3. Sprint 3: Narrative & Feedback (敘事與用戶反饋)

#### `[ ]` Task 3.1: 實作以 Evidence Chain 為核心的 Narrator 敘事引擎
*   **目標**：在 `apps/web/lib/presentation/narrator.ts` 中，整合 LLM 呼叫邏輯。將 `TasteInsight` 中的假說定義、證據鏈與置信度以嚴格的 System Prompt 輸入給 LLM，生成具有人文溫度但事實完全被 Evidence 限制的安全故事。
*   **輸入**：Top-ranked `TasteInsight`。
*   **輸出**：`Storytelling Output` 結構化字串。

#### `[ ]` Task 3.2: 實作 Feedback Loop (反饋學習環)
*   **目標**：實作前端 UI 反饋按鈕（如 "這個分析很準"、"我早就知道了"）的 API 端點，並在後端 `taste_ranker.ts` 中，根據反饋類別動態調整排序公式中的先驗機率與權重。
*   **輸入**：User Feedback Action。
*   **輸出**：更新後的 Bayesian Prior 狀態庫。

---

### 4. Sprint 4: Trajectory & UI (品味軌跡與視覺化)

#### `[ ]` Task 4.1: 實作 Latent Taste Trajectory 計算
*   **目標**：實作一個動態的時間滑動窗口分析。將使用者的播放歷史以 3 個月為單位切分 Era，計算每個 Era 中 Taste Ontology 概念特徵值的分布變動，輸出使用者品味隨時間演化的隱性軌跡向量。
*   **輸入**：時序性的 Spotify Playback Logs。
*   **輸出**：`TasteTrajectory` 數據陣列。

#### `[ ]` Task 4.2: 渲染 Dashboard Timeline 與視覺化圖表
*   **目標**：在 `apps/web/components/dashboard/` 下，使用 React & Chart.js/Recharts 渲染品味軌跡。繪製出使用者在不同品味維度（如 Minimalism、Analog Warmth）隨時間演化的折線圖，並可點擊特定時間節點展開當時的 Taste Insights 故事。
*   **輸入**：`TasteTrajectory` 數據。
*   **輸出**：互動式 Timeline React 元件。
