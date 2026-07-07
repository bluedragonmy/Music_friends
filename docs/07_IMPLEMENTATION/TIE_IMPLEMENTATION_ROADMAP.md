# Taste Intelligence Model (TIM) — Implementation Roadmap v1.2

本開發路線圖將 TIM 的落地過程拆分為四個階段（Sprints），從 MVP 基礎架構演進至 v1.0 生產環境發布。

---

## 📅 開發階段規劃 (Roadmap Sprints)

```
┌────────────────────────────────────────────────────────┐
│                        TIM MVP                         │
│ Sprint 1: Memory Layer (記憶地基模組)                   │
│ - Project Skeleton & Unified Entities                 │
│ - Independent Resolver & Immutable Graph Builder       │
│ - Graph Query APIs & Subgraph Cache Layer              │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                        TIM Beta                        │
│ Sprint 2: Inference & Ranking (推理與決策核心)          │
│ - Rule Loader & Rule Executor Engine                   │
│ - Hypothesis Generator & Evidence Verifier             │
│ - Bayesian Ranker (with e^-λt Decay)                   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                       TIM Release                      │
│ Sprint 3: Communication (故事敘事與用戶反饋)            │
│ - Narrator LLM Generation (Strict context limit)      │
│ - Interactive Feedback Loop and Prior Update           │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                       TIM v1.0+                        │
│ Sprint 4: Evolution & Cross-domain Framework           │
│ - Render dynamic taste evolution timeline UI           │
│ - Generalize to Taste Intelligence Framework           │
└────────────────────────────────────────────────────────┘
```

---

## 🎯 Sprint 1 完成定義 (Definition of Done - DoD)

只有在完全滿足以下 7 項工程指標時，我們才會宣布 **「Sprint 1 完成，TIM 的 Memory 模組已穩固建立」**：

*   `[ ]` **DoD 1: Unified Entity Resolution** — 任一 Spotify Track、MusicBrainz 與 Discogs 實體能成功解析並對齊為唯一的 `UnifiedEntity`。
*   `[ ]` **DoD 2: Metadata Schema Integrity** — 所有實體皆具備穩定的 ID、明確的資料來源（Provenance）與多平台 Identifier Mapping。
*   `[ ]` **DoD 3: Immutable Graph State** — `ImmutableGraph` 可建立並在運行期間保持唯讀，禁止任何直接寫入。
*   `[ ]` **DoD 4: Rich Graph Query API** — `QueryAPI` 支持節點、鄰居、路徑（BFS/DFS）與識別符查詢。
*   `[ ]` **DoD 5: Golden Dataset Regression Pass** — 核心 Golden Dataset 測試案例（包含 Radiohead 關係鏈、250 關係鏈等）$100\%$ 通過。
*   `[ ]` **DoD 6: Graph Health Clean** — `tim doctor` 檢查無 Critical Errors（無孤立節點、無缺失 Provenance、無衝突邊）。
*   `[ ]` **DoD 7: Subgraph Cache Hit** — 快取層能正確命中常用子圖查詢，並保持與主圖譜的一致性。
