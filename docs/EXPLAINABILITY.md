# μ(sic) Explainability {可解釋性說明}

> **Every interpretation must be traceable back to observable behavior.**
> 
> **所有理解，都必須能追溯到可觀察的行為。**

> **We never infer personality. We only infer listening identities from observable listening behavior.**
> 
> **我們絕不推論人格。我們只從可觀察的聆聽行為推論聆聽身份。**

這是 μ(sic) 的最高技術守則。

我們拒絕神祕、不可預測的 AI 黑盒子。我們不使用隨機的大型語言模型（LLM）來憑空捏造使用者的性格與心理狀態。在 μ(sic) 中，每一個被使用者看見的 Listening Identity {聆聽身份} 詮釋，都必須能在一秒內追溯至其最底層的客觀聽歌數據與物理行為。

**Identity is a lens, not a label.** — 聆聽身份是觀察使用者音樂行為的一面鏡頭，而非對使用者下的定義。

---

## 1. 七階段可解釋性模型工作流 (The 7-Stage Explainability Pipeline)

μ(sic) 的架構是單向且透明的，以 Machine / Human 邊界明確劃分責任：

```text
  [ Collect {收集} ]   Spotify 原始 API 串流資料與日誌
         ↓
  [ Observe {觀察} ]   基礎統計量（例如：總播放歌曲數、播放時長）
         ↓
  [ Measure {測量} ]   客觀數學指標（例如：Novelty Index 原創性指數）
         ↓
  [ Infer {推論} ]    Listening Identity 推論（例如：Explorer — High）

  ────────── Machine ↑ / Human ↓ ──────────

  [ Present {呈現} ]   將推論結果轉化為人類可讀的 Why + Evidence + Reflection
         ↓
  [ Understand {理解} ] 使用者自行理解並消化資訊
         ↓
  [ Reflect {反思} ]   使用者對自己的聆聽行為進行深層省察
```

### 1.1 Collect {收集}
- **內容**：包含 `Track` {曲目}、`Artist` {演出者}、`PlayedAt` {播放時間戳記}、`Duration` {歌曲時長}、`Popularity` {熱門度}、與聲學屬性（`Valence` {愉悅度}、`Energy` {能量} 等）。
- **特點**：純粹的外部數據同步，不帶任何主觀偏好假設。

### 1.2 Observe {觀察}
- **內容**：最基礎的累計或時間分布。例如：「本週聽了 143 首歌」、「深夜時段播放了 42 次」。
- **特點**：只是對收集到的資料進行事實性的重組，完全不進行複雜算式。

### 1.3 Measure {測量}
- **內容**：帶有公式定義的特徵數值（0~1）。例如：`Novelty Index = 0.87`。
- **特點**：嚴格的數學運算，具備可重複驗證性。

### 1.4 Infer {推論}
- **內容**：Listening Identity {聆聽身份} 推論。例如：「Explorer {探索者} — High」。
- **特點**：
  - **Every Listening Identity is an estimation, not a fact.** 每個推論都是基於目前觀察到的行為數據的概率性估計，而非絕對事實。
  - **這不是 AI 的猜測。這是行為指標的加權組合。**
  - 使用者在前端看到的不是百分比數字，而是程度標籤（High / Moderate / Low）。
  - **聆聽身份是一面鏡頭（Lens），不是一個標籤（Label）**。
  - Engine 同時輸出 `why` 欄位：一句自然語言的可解釋性說明。

### 1.5 Present {呈現}
- **內容**：將 Inference Engine 的原始輸出（score, confidence 浮點數）轉化為人類可讀格式（High / Moderate / Low, Confident / Growing / Emerging）。
- **特點**：這一層是 Machine 與 Human 的介面。Inference Engine 永遠不決定呈現方式，Presentation Layer 永遠不計算推論。

### 1.6 Understand {理解}
- **內容**：使用者自行閱讀、消化並理解系統呈現的 Identity 與 Evidence。
- **特點**：這一層不是系統的工作，是使用者的工作。AI 只推論（Infer），真正「理解」的人是使用者自己。

### 1.7 Reflect {反思}
- **內容**：基於 `Infer` 結果提供的反思提問。例如：「When was the last time a song changed your perspective?」
- **特黝**：不給予武斷的心理診斷，僅作為鏡子引導使用者自我省察。Reflection {反思} 嵌入每一個 Identity 卡片，而非獨立存在於頁尾。

---

## 2. 信任與透明度設計 (Trust & Transparency Design)

1. **可展開的四層 Identity Card {身份卡片}**：
   - 所有的 Listening Identity 卡片都採用四層 Collapsible {可折疊} 結構：
     - **Layer 1 — Identity {身份}**：名稱 + 程度（High / Moderate / Low）+ Confidence。
     - **Layer 2 — Why {為什麼}**：一句自然語言的人類可讀解釋。
     - **Layer 3 — Evidence {證據}**：底層的 `Measure` 指標數值與 `Observe` 播放紀錄。
     - **Layer 4 — Reflection {反思}**：與該身份對應的自省問句。
2. **Deterministic Interpretation {確定性詮釋}**：
   - 即使在後續 Mission 中引入 `LLM` {大型語言模型} 來微調 Insight 洞察文案的語氣，文案所陳述的核心事實也必須基於 `Measure` 指標。
   - LLM 只能做「語言修飾與詮釋生成」，絕對禁止讓 LLM 自由發揮去判定使用者的指標數值或為其分類。
