# Taste Intelligence Model (TIM) — AI Agent Task List v1.2

本文件將 TIM 的實作拆解為具體、獨立且具備明確輸入與輸出的開發任務（Tasks）。每個任務規模控制在 200–500 行程式碼，便於 AI Coding Agent 逐步且高品質地完成。

---

## 📋 Sprint 1: Memory Layer (記憶地基模組)

### 📌 Phase A: Project Skeleton

#### `[ ]` Task 1.0: 建立 TIM 系統骨架目錄與模組邊界
*   **目標**：於 `apps/web/lib/tim/` 下建立完整目錄結構，配置空 TypeScript 導出，為後續 Sprint 的檔案搬遷提供固定路徑：
    ```text
    apps/web/lib/tim/
        ├── memory/ (記憶層 - 實體與圖譜建置)
        ├── ontology/ (語義層 - 概念與分類學)
        ├── reasoning/ (大腦層 - 推理引擎)
        ├── evidence/ (證據層 - 來源與權重)
        ├── ranking/ (決策層 - 貝氏排序)
        ├── narrator/ (交流層 - 自然語言敘事)
        └── cache/ (效能優化層 - 子圖快取)
    ```
*   **驗收標準**：目錄與 TypeScript 基本型別骨架建立完成，無編譯錯誤。

---

### 📌 Phase B: Unified Entity & Resolver

#### `[ ]` Task 1.1: 實作 UnifiedEntity 與繼承實體
*   **目標**：於 `apps/web/lib/tim/memory/entity.ts` 中，定義基礎 `UnifiedEntity` 介面，並衍生出 `Song`、`Artist`、`Album`、`Producer`、`Engineer`、`Studio`、`Genre`、`Label` 等繼承類別，統一描述穩定 ID、來源 Provenance 與 Identifier Mapping。
*   **輸入**：各來源實體結構。
*   **輸出**：`UnifiedEntity` 介面及其實作類別。

#### `[ ]` Task 1.2: 實作獨立的 Identifier Resolver (識別符解析器)
*   **目標**：於 `apps/web/lib/tim/memory/resolver.ts` 中，將 Spotify ➡️ ISRC ➡️ MBID ➡️ Discogs 的對齊邏輯解耦，拆分為 `resolver/spotify.ts`、`resolver/musicbrainz.ts` 與 `resolver/discogs.ts` 等子模組，最後由 `resolver.resolve()` 返回標準的 `UnifiedEntity`。
*   **輸入**：原始平台數據識別符。
*   **輸出**：已解析對齊的 `UnifiedEntity`。

#### `[ ]` Task 1.3: 實作 Music Knowledge Graph (MKG) Builder (不可變圖譜構建器)
*   **目標**：於 `apps/web/lib/tim/memory/builder.ts` 中實作 `GraphBuilder`，負責在啟動時或靜態載入時一次性讀取 Seed Data 與 Resolver，構建出完全不可變的（Immutable）圖譜實例 `ImmutableGraph`，禁止後續動態篡改。
*   **輸入**：種子實體與關聯數據。
*   **輸出**：唯讀 `ImmutableGraph` 實例。

---

### 📌 Phase C: Query, Cache & Verification

#### `[ ]` Task 1.4: 實作豐富的 Graph Query API (圖譜查詢介面)
*   **目標**：於 `apps/web/lib/tim/memory/query.ts` 封裝查詢大腦所需的圖遍歷方法：
    ```typescript
    findNode(id: string): UnifiedEntity | undefined;
    findNeighbors(id: string): readonly UnifiedEntity[];
    findShortestPath(sourceId: string, targetId: string): readonly GraphEdge[];
    findEdges(sourceId: string): readonly GraphEdge[];
    findByType(type: string): readonly UnifiedEntity[];
    findByIdentifier(platform: string, id: string): UnifiedEntity | undefined;
    ```
*   **輸入**：`ImmutableGraph` 實例。
*   **輸出**：圖譜遍歷與查詢結果。

#### `[ ]` Task 1.5: 實作獨立的 Evidence Repository (證據儲存庫)
*   **目標**：於 `apps/web/lib/tim/evidence/store.ts` 建立獨立的證據倉庫。將多重來源證據從 Edge 結構中解耦，允許同一條關係邊對應多個來自 `EvidenceStore` 的 Facts 與 Reliability 權重。
*   **輸入**：多重 Facts 來源。
*   **輸出**：解耦後的 `EvidenceStore` 檢索介面。

#### `[ ]` Task 1.6: 實作 Subgraph Cache (子圖快取)
*   **目標**：於 `apps/web/lib/tim/cache/subgraph.ts` 中，針對高頻訪問的 `Producer`、`Studio`、`Artist` 等關係鏈，提供熱點快取與自動失效（TTL 24h）機制，降低 TRE 推理時對大圖的重複搜尋負擔。
*   **輸入**：高頻查詢請求。
*   **輸出**：快取命中或透傳查詢。

#### `[ ]` Task 1.7: 實作 Memory Tests & Golden Dataset
*   **目標**：於 `apps/web/lib/tim/memory/__tests__/` 下建立 Golden Dataset（如 Radiohead ➡️ Nigel Godrich ➡️ Producer ➡️ Studio 的真實關係鏈對齊預期值），在每次圖譜或資料庫升級時自動執行 Regression 測試。
*   **輸入**：Golden Dataset 測試案例。
*   **輸出**：Regression 測試報告。

#### `[ ]` Task 1.8: 實作 Graph Health Check (tim doctor)
*   **目標**：在 `apps/web/lib/tim/memory/doctor.ts` 實作圖譜健康度檢查器，能夠輸出實體數、邊數、孤立節點（Disconnected Nodes）、缺失 Provenance 警告與衝突邊，作為除錯與資料治理的利器。
*   **輸出**：`GraphHealthReport`。
