# μ(sic) Inference Engine Versioning {推論引擎版本管理}

本文件定義 μ(sic) Inference Engine {推論引擎} 的版本演進策略。每一個 Listening Identity {聆聽身份} 的推論結果永遠攜帶其計算引擎的版本資訊，確保學術研究的可重現性（Reproducibility）。

---

## Version Registry {版本登錄}

| 版本 | 名稱 | 方法論 | 狀態 |
| :--- | :--- | :--- | :--- |
| **v1** | Rule-Based | 確定性加權線性組合（Weighted Linear Combination）。所有權重為人工定義的常數。 | 🟢 Active |
| **v2** | Hybrid | 保留 Rule-Based 骨幹，引入統計學習微調權重（例如透過使用者回饋調整 Identity 閾值）。 | 🔲 Planned |
| **v3** | ML-Assisted | 引入機器學習模型輔助，但核心 Explainability 原則不變——所有推論仍須可追溯至行為指標。 | 🔲 Planned |

---

## v1 規範 (Current)

### 推論方法
- 純粹的規則基礎（Rule-Based）確定性推論。
- 所有 Identity Score 由 `IdentityDefinition` 的 `weights` 與 `BehaviorSnapshot` 的指標值進行加權求和產生。
- 無任何隨機性或學習性元素。

### 可重現性保證
- 給定相同的 `BehaviorSnapshot` 輸入，v1 引擎必須在任何時間、任何環境下產生完全一致的推論結果。
- 每一筆 `IdentitySnapshot` 記錄將攜帶 `engineVersion: "v1"` 欄位。

### 研究引用格式
如需在論文中引用 μ(sic) 的推論結果，請標註引擎版本：
```text
Identity scores were computed using μ(sic) Inference Engine v1 
(rule-based weighted linear combination, deterministic).
```

---

## 版本升級原則 (Upgrade Principles)

1. **向後相容**：新版本引擎必須能重新計算舊版本的結果，以進行交叉驗證。
2. **版本標記**：資料庫中的每一筆 `IdentitySnapshot` 永遠記錄其計算引擎版本。
3. **A/B 比對**：版本升級前，必須在同一批使用者數據上比對 v(n) 與 v(n+1) 的推論差異，並記錄差異報告。
