# Evidence & Provenance Specification v1.2

本文件更新 **Weighted Evidence Model** {權重證據模型}，增設圖譜邊（Edge）的固有信賴度（Confidence）與時效有效性（Temporal Validity）。

---

## 1. 圖譜邊固有信賴度 (Edge Confidence)

除了由 Evidence {證據} 支持外，`Music Knowledge Graph (MKG)` 的關係邊（Edge）本身也定義了固有信賴度（Confidence），以區分確定事實與推測性關係：

```typescript
export interface GraphEdge v1.2 {
  readonly source: string;
  readonly target: string;
  readonly type: string;
  readonly confidence: number;         // 固有信賴度 (如 PRODUCED_BY = 1.0, INSPIRED_BY = 0.55)
  readonly temporal?: {
    readonly validFrom?: string;        // 關係開始年份/日期 (如樂團成員加入時間)
    readonly validTo?: string;          // 關係結束年份/日期 (如樂團成員退團時間)
  };
  readonly evidences: readonly Evidence[];
}
```

---

## 2. 證據時序有效性 (Temporal Evidence Chain)

證據鏈在推導時必須加入時序比對（Temporal Constraint）。

### 時序比對邏輯範例：
若一條關係邊描述 $Artist \xrightarrow{MEMBER\_OF} Band$，且其有效時間區間為 `[1980, 1987]`：
1.  **時序驗證**：若使用者播放的歌曲發表於 1982 年，則此 Evidence 適用。
2.  **時序失效**：若使用者播放的歌曲發表於 1990 年，由於已超出有效區間，此 Evidence 在推論時將被 TRE 自動判定為時序無效（Temporal Disregard），不計入該歌曲對假說的支持度。

---

## 3. 時序綜合證據強度計算 (Temporal Evidence Strength)

引進時序有效性因子 $t_{valid} \in \{0, 1\}$，計算綜合證據強度：

$$ES = 1 - \prod_{i=1}^{n} (1 - w_i \cdot d_i \cdot t_{valid})$$
