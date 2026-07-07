# Taste Intelligence Model (TIM)

> **Taste is not a collection of preferences.**
>
> It is a latent probabilistic structure emerging from the interaction between human experience, cultural context, production aesthetics, and observable behavior.
>
> *(品味不是偏好的簡單集合。它是從人類經驗、文化脈絡、製作美學與可觀察行為的互動中，所湧現的一種隱性機率結構。)*

TIM 是一個可解釋的基於知識的推理框架（Explainable Knowledge-based Inference Framework），用於建立可驗證、可演化、可解釋的個人品味模型。它的核心哲學與原則定義於 [PHILOSOPHY.md](PHILOSOPHY.md)。

---

## 🛡️ TIM First Principle {第一原則}
> **The system never reasons from raw data. It always reasons from normalized, versioned, and verifiable knowledge.**
>
> *(系統絕不基於原始數據進行推理。它永遠基於標準化、具備版本控制且可驗證的知識進行推理。)*

---

## 🧭 TIM Design Principles {設計原則}
*   **Everything is Evidence.**
*   **Everything is Explainable.**
*   **Everything is Versioned.**
*   **Everything is Reproducible.**
*   **Nothing is Hidden.**
*   **LLM Never Creates Facts.**
*   **Reasoning Must Be Deterministic.**
*   **Knowledge Is Immutable.**
*   **Feedback Improves Priors.**
*   **Taste Evolves Over Time.**

---

## 🏗️ TIM Core Abstractions & Data Pipeline {核心架構與資料管線}

```
Raw Data (Spotify Sensor)
   │
   ▼
Entity Resolution (Contracts: Resolver)
   │
   ▼
Music Knowledge Graph (Memory — Immutable Graph)
   │
   ▼
Taste Reasoning Engine (TRE — Inference Rule Loader & Executor)
   │
   ▼
Bayesian Ranker (Decision — Time Decay & Information Gain)
   │
   ▼
Narrator (Communication — Structured-constrained Language Gen)
```

---

## 📂 專案工程文檔目錄 (TIM Specification Suite)

專案的所有核心工程與理論規約，均依照以下結構化目錄存放於 [docs/](docs/) 中：

*   **`docs/00_VISION/`**：TIM 系統願景與產品哲學（[PHILOSOPHY.md](PHILOSOPHY.md)）
*   **`docs/01_THEORY/`**：`Taste Intelligence Theory` 品味理論定義
*   **`docs/02_ARCHITECTURE/`**：[TIE_SYSTEM_ARCHITECTURE.md](docs/02_ARCHITECTURE/TIE_SYSTEM_ARCHITECTURE.md) (系統分層與資料流)
*   **`docs/02_ARCHITECTURE/TIE_TECHNICAL_DESIGN.md`**：[TIE_TECHNICAL_DESIGN.md](docs/02_ARCHITECTURE/TIE_TECHNICAL_DESIGN.md) (資料結構與 TypeScript Contracts)
*   **`docs/03_ONTOLOGY/`**：[TASTE_ONTOLOGY_SPEC.md](docs/03_ONTOLOGY/TASTE_ONTOLOGY_SPEC.md) (樹狀美學概念與繼承)
*   **`docs/04_REASONING/`**：[TIE_CORE_REASONING_SPEC.md](docs/04_REASONING/TIE_CORE_REASONING_SPEC.md) (推理引擎與貝氏更新)
*   **`docs/05_EVIDENCE/`**：[EVIDENCE_PROVENANCE_SPEC.md](docs/05_EVIDENCE/EVIDENCE_PROVENANCE_SPEC.md) (來源權重與證據強度)
*   **`docs/06_ENGINEERING/`**：[TIE_ENGINEERING_GUIDELINES.md](docs/06_ENGINEERING/TIE_ENGINEERING_GUIDELINES.md) (AI 寫碼規則與快取規範)
*   **`docs/07_IMPLEMENTATION/`**：[TIE_IMPLEMENTATION_ROADMAP.md](docs/07_IMPLEMENTATION/TIE_IMPLEMENTATION_ROADMAP.md) (Sprint 里程碑與 DoD)
*   **`docs/08_TASKS/`**：[TIE_AI_AGENT_TASKS.md](docs/08_TASKS/TIE_AI_AGENT_TASKS.md) (開發任務清單)
*   **`docs/09_RESEARCH/`**：[RESEARCH.md](docs/RESEARCH.md) (封測與質性研究協定)


