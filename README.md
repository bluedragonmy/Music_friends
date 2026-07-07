# Taste Intelligence Model (TIM)

> **Taste is not a collection of preferences.**
>
> It is a latent probabilistic structure emerging from the interaction between human experience, cultural context, production aesthetics, and observable behavior.
>
> *(品味不是偏好的簡單集合。它是從人類經驗、文化脈絡、製作美學與可觀察行為的互動中，所湧現的一種隱性機率結構。)*

TIM 是一個可解釋的隱性品味推理系統（Explainable Latent Taste Inference System），而不是推薦引擎。它的目標是回答：**「為什麼你會喜歡這些看似毫不相關的音樂？」**

---

## 🧭 TIM Design Principles {設計原則}

*   **Everything is Evidence.** (所有事物皆為證據)
*   **Everything is Explainable.** (所有事物皆可解釋)
*   **Everything is Versioned.** (所有事物皆有版本)
*   **Everything is Reproducible.** (所有推論皆可重現)
*   **Nothing is Hidden.** (絕無黑箱邏輯)
*   **LLM Never Creates Facts.** (大型語言模型絕不捏造事實)
*   **Reasoning Must Be Deterministic.** (推理引擎必須完全確定性)
*   **Knowledge Is Immutable.** (知識圖譜為不可變狀態)
*   **Feedback Improves Priors.** (用戶反饋用於修正貝氏先驗)
*   **Taste Evolves Over Time.** (品味隨時間動態演化)

---

## 🏗️ TIM Core Abstractions {核心系統層次}

```
Taste Intelligence Model (TIM)
│
├── Music Knowledge Graph (Memory {記憶} — 忠於歷史事實)
├── Personal Taste Graph (Personal Memory {個人記憶} — 使用者聆聽軌跡與指標)
├── Taste Ontology (Semantic Layer {語義層} — 聽覺美學與分類本體論)
├── Taste Reasoning Engine (Inference {推理/大腦} — 動態規則推理與假說生成)
├── Bayesian Ranker (Decision {決策} — 基於驚奇度與資訊增益的效用排序)
└── Narrator (Communication {交流/嘴巴} — LLM 結構化受限之溫情敘事)
```

---

## 📂 專案工程文檔目錄 (TIM Specification Suite)

專案的所有核心工程與理論規約，均依照以下結構化目錄存放於 [docs/](docs/) 中：

*   **`docs/00_VISION/`**：TIM 系統願景與產品哲學
*   **`docs/01_THEORY/`**：`Taste Intelligence Theory` 品味理論定義
*   **`docs/02_ARCHITECTURE/`**：[TIE_SYSTEM_ARCHITECTURE.md](docs/02_ARCHITECTURE/TIE_SYSTEM_ARCHITECTURE.md) (系統分層與資料流)
*   **`docs/03_ONTOLOGY/`**：[TASTE_ONTOLOGY_SPEC.md](docs/03_ONTOLOGY/TASTE_ONTOLOGY_SPEC.md) (樹狀美學概念與映射)
*   **`docs/04_REASONING/`**：[TIE_CORE_REASONING_SPEC.md](docs/04_REASONING/TIE_CORE_REASONING_SPEC.md) (推理引擎與貝氏更新)
*   **`docs/05_EVIDENCE/`**：[EVIDENCE_PROVENANCE_SPEC.md](docs/05_EVIDENCE/EVIDENCE_PROVENANCE_SPEC.md) (來源權重與證據強度)
*   **`docs/06_ENGINEERING/`**：[TIE_ENGINEERING_GUIDELINES.md](docs/06_ENGINEERING/TIE_ENGINEERING_GUIDELINES.md) (AI 寫碼規則與快取規範)
*   **`docs/07_IMPLEMENTATION/`**：[TIE_IMPLEMENTATION_ROADMAP.md](docs/07_IMPLEMENTATION/TIE_IMPLEMENTATION_ROADMAP.md) (Sprint 里程碑)
*   **`docs/08_TASKS/`**：[TIE_AI_AGENT_TASKS.md](docs/08_TASKS/TIE_AI_AGENT_TASKS.md) (開發任務清單)
*   **`docs/09_RESEARCH/`**：[RESEARCH.md](docs/RESEARCH.md) (封測與質性研究協定)

