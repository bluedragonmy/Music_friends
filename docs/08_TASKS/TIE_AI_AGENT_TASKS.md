# Taste Intelligence Model (TIM) — AI Agent Task List v1.3

本文件將 TIM 的實作拆解為具體、獨立且具備明確輸入與輸出的開發任務（Tasks）。每個任務規模控制在 200–500 行程式碼，便於 AI Coding Agent 逐步且高品質地完成。

---

## 📋 Sprint 1: Memory Layer (記憶地基模組)

### 📌 Phase A: Interface-first Contracts & Directory Skeleton

#### `[ ]` Task 1.0: 建立 TIM 系統骨架目錄與合約介面
*   **目標**：於 `apps/web/lib/tim/` 下建立完整目錄結構，並在 `contracts/` 下定義純 Interface 聲明。這是實作 **Interface-first Design** 的關鍵，確保即使未來底層存儲更換，上層推理大腦也無需更動。
    ```text
    apps/web/lib/tim/
        ├── contracts/ (合約介面定義 - 定義 graph.ts, query.ts, resolver.ts, cache.ts 等)
        ├── memory/ (記憶層實作)
        ├── ontology/ (語義層實作)
        ├── reasoning/ (大腦層推理實作)
        ├── evidence/ (證據倉庫實作)
        ├── ranking/ (貝氏決策實作)
        ├── narrator/ (自然語言敘事實作)
        └── cache/ (效能優化實作)
    ```
*   **驗收標準**：目錄與 TypeScript Contracts 介面定義完成，無編譯錯誤。

---

### 📌 Phase B: Unified Entity, Pipeline Builder & Resolver

#### `[ ]` Task 1.1: 實作 EntityType 列舉與繼承實體
*   **目標**：於 `apps/web/lib/tim/memory/entity.ts` 中，將 `EntityType` 定義為 `const enum`（包含 SONG, ARTIST, ALBUM, PRODUCER, ENGINEER, LABEL, STUDIO, GENRE），防止字串拼寫錯誤。實作 `UnifiedEntity` 介面，並衍生出對應子類別。
*   **輸入**：原始實體結構。
*   **輸出**：基於 `const enum` 構建的 `UnifiedEntity` 繼承型別。

#### `[ ]` Task 1.2: 實作 Stage Pipeline Identifier Resolver (識別符解析器)
*   **目標**：於 `apps/web/lib/tim/memory/resolver.ts` 中，實作 `resolver/spotify.ts`、`resolver/musicbrainz.ts` 與 `resolver/discogs.ts`。透過 `resolver.resolve()` 回傳 `UnifiedEntity`，解耦各平台欄位提取邏輯。
*   **輸入**：平台數據識別符。
*   **輸出**：已解析對齊的 `UnifiedEntity`。

#### `[ ]` Task 1.3: 實作 Pipeline Graph Builder (管線圖構建器)
*   **目標**：於 `apps/web/lib/tim/memory/builder.ts` 中，將圖譜的構建拆分為多個序列化的 Stage 管線：
    $$\text{Spotify} \xrightarrow{\quad \text{Normalize} \quad} \text{Resolve} \xrightarrow{\quad \text{Merge} \quad} \text{Validate} \xrightarrow{\quad \text{Graph} \quad} \text{Cache}$$
    一次性構建完全唯讀且不可變的 `ImmutableGraph` 實例。
*   **輸入**：種子資料。
*   **輸出**：唯讀 `ImmutableGraph` 實例。

---

### 📌 Phase C: Encapsulated Query, Cache & Verification

#### `[ ]` Task 1.4: 實作嚴格封裝的 Graph Query API (圖譜查詢介面)
*   **目標**：於 `apps/web/lib/tim/memory/query.ts` 實現對應合約。**嚴格禁止**對外 expose 圖譜本體資料結構，推理大腦僅能透過此 API 進行查詢：
    ```typescript
    findNode(id: string): UnifiedEntity | undefined;
    findNeighbors(id: string): readonly UnifiedEntity[];
    findShortestPath(sourceId: string, targetId: string): readonly GraphEdge[];
    findEdges(sourceId: string): readonly GraphEdge[];
    findByType(type: EntityType): readonly UnifiedEntity[];
    findByIdentifier(platform: string, id: string): UnifiedEntity | undefined;
    ```
*   **輸出**：受限且封裝的查詢結果。

#### `[ ]` Task 1.5: 實作獨立的 Evidence Repository (證據儲存庫)
*   **目標**：於 `apps/web/lib/tim/evidence/store.ts` 建立獨立的證據倉庫。將多重來源證據從 Edge 結構中解耦，允許同一個關係邊對應多個來自 `EvidenceStore` 的 Facts 與 Reliability 權重。
*   **輸出**：解耦後的 `EvidenceStore` 檢索介面。

#### `[ ]` Task 1.6: 實作 Subgraph Cache (子圖快取)
*   **目標**：於 `apps/web/lib/tim/cache/subgraph.ts` 中，針對高頻訪問的 `Producer`、`Studio`、`Artist` 等關係鏈，提供快取與自動失效（TTL 24h）機制，防止 TRE 遞迴查詢時的大圖效能瓶頸。
*   **輸出**：快取與失效機制實作。

#### `[ ]` Task 1.7: 實作 Memory Tests & Golden Dataset Fixtures
*   **目標**：於 `apps/web/lib/tim/memory/__tests__/fixtures/` 下建立靜態 json 測試夾具（如 `radiohead.json`、`newjeans.json`）。每次 CI 執行時自動載入並進行 Regression 測試，確保圖譜更新不破壞核心關係鏈。
*   **輸出**：Golden Dataset 測試套件。

#### `[ ]` Task 1.8: 實作 tim doctor 診斷工具 CLI
*   **目標**：在 `apps/web/lib/tim/memory/doctor.ts` 實作診斷工具，並註冊為 CLI 指令 `tim doctor`。在終端機執行時輸出 Memory 層的 Entities 數、Edges 數、孤立節點、缺失 Provenance 警告與衝突邊統計。
*   **輸出**：控制台健康報告與 `tim doctor` 指令。
