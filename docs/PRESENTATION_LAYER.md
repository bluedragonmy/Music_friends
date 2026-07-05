# μ(sic) Presentation Layer {呈現層}

本文件定義 Inference Engine {推論引擎} 與前端 UI 之間的呈現規範。推論與呈現必須**完全解耦**。

> **Engine 負責計算。Presentation 負責翻譯。**
>
> Inference Engine 永遠輸出 raw numbers（浮點數）。
>
> Presentation Layer 永遠負責將 raw numbers 轉換為人類可讀的語意。

---

## 1. Identity Level 程度映射 (Score → Level Label)

Inference Engine 輸出的 Identity Score 為 `0.0 ~ 1.0` 浮點數。Presentation Layer 將其轉換為語意標籤：

| Raw Score 範圍 | Display Label | 語意 |
| :--- | :--- | :--- |
| `≥ 0.7` | **High** | 該 Listening Identity 在當前窗口期內非常顯著 |
| `0.3 ~ 0.69` | **Moderate** | 該 Listening Identity 存在但不極端 |
| `< 0.3` | **Low** | 該 Listening Identity 在當前窗口期內不顯著 |

---

## 2. Confidence 信賴度映射 (Confidence → Confidence Label)

| Confidence 範圍 | Display Label | 語意 |
| :--- | :--- | :--- |
| `≥ 0.7` | **Confident** | 推論具備充分的數據支撐 |
| `0.3 ~ 0.69` | **Growing** | 推論有一定基礎但數據仍在累積 |
| `< 0.3` | **Emerging** | 推論基礎不足，提示使用者「我們正在認識你」 |

---

## 3. Identity Card 四層呈現結構

前端 Dashboard 的每一個 Listening Identity 卡片，呈現四層由淺入深的資訊：

```text
Layer 1 — Identity
┌─────────────────────────────────────────┐
│ Explorer                         High   │
│                              Confident  │
└─────────────────────────────────────────┘

Layer 2 — Why (自然語言解釋)
┌─────────────────────────────────────────┐
│ "You often listen to unfamiliar artists │
│  and maintain a broad genre range."     │
└─────────────────────────────────────────┘

Layer 3 — Evidence (數據指標)
┌─────────────────────────────────────────┐
│ Novelty Index: 83%                      │
│ Genre Diversity: 72%                    │
└─────────────────────────────────────────┘

Layer 4 — Reflection (自省問句)
┌─────────────────────────────────────────┐
│ "When was the last time a song          │
│  changed your perspective?"             │
└─────────────────────────────────────────┘
```

### 呈現規則
1. **預設收合**：只顯示 Layer 1。
2. **點擊展開**：依序展開 Layer 2 → 3 → 4。
3. **百分比僅出現在 Layer 3（Evidence）**，Layer 1 永遠只顯示語意標籤。
4. **Reflection 問句嵌入卡片**，而非集中於頁尾。

---

## 4. 解耦原則 (Decoupling Rules)

| 元件 | 職責 | 禁止事項 |
| :--- | :--- | :--- |
| **Inference Engine** | 計算 raw score、confidence 浮點數、生成 why 字串 | ❌ 不得輸出 "High"/"Low" 等語意標籤 |
| **Presentation Layer** | 將 raw 數值轉為語意標籤、決定 UI 排版 | ❌ 不得進行任何數學計算或推論邏輯 |
| **Frontend (Dashboard)** | 渲染最終 UI、處理展開/收合互動 | ❌ 不得直接讀取 raw score 做判斷 |
