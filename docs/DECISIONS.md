# Decisions {決策紀錄}

此文件記錄了 μ(sic) 專案的所有重大產品與工程設計決策。

每一個決策都必須指向真實的觀察或驚喜證據（Revelations / Observations），不允許憑空臆測。

---

## 決策紀錄表 (Decision Log Table)

| ID | Observation / Evidence {觀察或驚喜證據} | Decision {決策內容} | Confidence {信心度} | Outcome {結果} | Status {狀態} | Owner | Date |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **D001** | V0.1 封測 (P01) 發現日記概念缺乏新資訊與回看意願。 | 封存 Music Journal V0.1 原型，改往 Reveal Engine 探索。 | **High** | 負向知識已歸檔於 Graveyard。 | **Implemented** | P01 | 2026-07-07 |
| **D002** | [R001](REVELATIONS.md#r001-charlie-puth--250--newjeans) 顯示使用者對 Podcast 爆料事件產生極大驚喜。 | 將 `Event` 作為 Graph 中的核心實體節點建模，而非僅有 Artist 節點。 | **Medium** | 通過 v1.2 測試。 | **Implemented** | CTO | 2026-07-07 |
| **D003** | [R002](REVELATIONS.md#r002-taylor-swift--jack-antonoff--lorde) 顯示使用者對幕後共同製作人產生高黏著探尋行為。 | Traversal Engine 的主要連通核心，以幕後製作人與作品作為主要橋樑。 | **Medium** | 下個 Sprint 開始落實。 | **Watching** | CTO | 2026-07-07 |
| **D004** | [R003](REVELATIONS.md#r003-taylor-swift--republic-records--charlie-puth) 與 [R004](REVELATIONS.md#r004-newjeans--ador--hybe) 顯示使用者對常識性或低稀有度關聯極度冷感。 | Curiosity Evaluator 應對 Label、母公司及高 Popularity 節點權重進行降分或過濾。 | **Medium** | 下個 Sprint 開始落實。 | **Watching** | CTO | 2026-07-07 |

---

### 信心度說明 (Confidence Glossary)
- **Low**: 樣本數極少（如僅 1 位受測者出現此行為），決策帶有高度實驗性。
- **Medium**: 部份受測者（如 2-3 位）出現此行為，方向初步明晰。
- **High**: 大多數或全體受測者（如 4 位以上）皆有此行為，證據充分。

### 狀態說明 (Status Glossary)
- **Pending**: 決策已提出，等待評估。
- **Watching**: 決策已執行，正在觀察真實使用者行為與數據回饋。
- **Implemented**: 決策已落實，且已被證實具有正面效果。
- **Rejected**: 決策經討論或初步驗證後決定不予採納。
- **Reverted**: 決策執行後，因負面反饋或行為不符預期而撤銷。
