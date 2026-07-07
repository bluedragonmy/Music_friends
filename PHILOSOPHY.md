# TIM Philosophy — Taste Intelligence Model

TIM（Taste Intelligence Model）是一個可解釋的基於知識的推理框架（Explainable Knowledge-based Inference Framework），用於建立可驗證、可演化、可解釋的個人品味模型。它不是從原始行為直接生成結論，而是透過知識圖譜、品味本體論與確定性推理，將觀測到的行為轉化為具有證據鏈支持的品味洞察（Taste Insights）。

---

## 🧭 TIM Core Philosophy {五大核心哲學}

1.  **Knowledge before Intelligence.** (知識先於智能)
2.  **Evidence before Explanation.** (證據先於解釋)
3.  **Reasoning before Generation.** (推理先於生成)
4.  **Determinism before Creativity.** (確定性先於創造性)
5.  **Human Understanding is the Final Product.** (使人理解自己是最終產品)

---

## 🛡️ TIM First Principle {第一原則}

> **The system never reasons from raw data. It always reasons from normalized, versioned, and verifiable knowledge.**
>
> *(系統絕不基於原始數據進行推理。它永遠基於標準化、具備版本控制且可驗證的知識進行推理。)*

---

## 🚫 The Pipeline Law {管線定律}

所有的資料流必須遵守以下單向遞進管線，嚴禁繞過推理直接由 LLM 生成事實結論：

```
Raw Data (Spotify)
   │
   ▼
Entity Resolution (Resolver)
   │
   ▼
Knowledge Graph (Memory)
   │
   ▼
Reasoning Engine (TRE)
   │
   ▼
Bayesian Decision (Ranker)
   │
   ▼
Insight Narrative (LLM Narrator)
```

**嚴格禁止以下旁路設計：**
$$\text{Spotify API} \xrightarrow{\quad \text{bypass} \quad} \text{LLM} \xrightarrow{\quad \text{bypass} \quad} \text{Insight}$$
