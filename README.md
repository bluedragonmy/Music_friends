# μ(sic)

> **Most music apps remember what you listened to. Very few help you understand why it matters.**
>
> *(絕大多數音樂 App 僅僅記錄了你聽過什麼。極少數能協助你理解為什麼這對你重要。)*
>
> **Reveal the hidden connections behind what people already love.**

> **"Every commit should either improve a revelation or help validate one."**

### ⚠️ Architecture Freeze
Until Research Sprint 1 finishes, no architectural refactoring is allowed unless it directly enables user testing or fixes a blocking defect. Do not introduce new engines, layers, DTOs, or abstractions.

---

This repository contains the codebase for **μ(sic)**, a platform designed to reveal the hidden connections behind what people already love.

## System Architecture of Revelation {揭露的系統層級架構}

目前系統架構主要拆分為以下層級：

```text
Reality (真實世界的事實，如歌曲、專輯、製作人、事件)
   │
   ▼
Music Knowledge Graph (音樂知識圖譜 — 忠於事實)
   │
   ▼
Traversal Engine (圖遍歷引擎 — 以產品語言尋訪 discoverShortestPath, discoverBridge 等多階路徑)
   │
   ▼
Curiosity Engine / Evaluator (好奇心評估器 — 衡量路徑的新穎度、稀有度與可信度)
   │
   ▼
Memory (記憶 — 改變使用者的探索行為，擴張使用者的已知邊界)
   │
   ▼
Presenter (呈現器 — 將冷冰冰的路徑轉化為能勾起求知慾的對話式揭露)
   │
   ▼
Experience (使用者體驗)
```

---

## The Rule of Commits {代碼提交準則}

從現在開始，每一個 Commit 與 Feature 開發，都必須先回答一個問題：

> **「它有沒有讓使用者更容易發現一件原本不知道、但知道後會很想分享的音樂事實？」**
> 
> *If yes, build it. If no, step back.*

---

## Product Hypotheses {產品假說}

我們將目前所有的產品猜想與未體驗驗證的核心指標，以「可推翻」的方式記錄於：
- [docs/PRODUCT_THEORY.md](docs/PRODUCT_THEORY.md) (Status: **Not yet validated**)

---

## Current Sprint Goal {當前 Sprint 目標}

### **Sprint: First Revelation**
> **「讓第一位使用者，在 30 秒內，看到一件他原本不知道、知道之後會立刻分享給朋友的音樂事實。」**

---

## Product Documents

- **Product Bible**: 請參考 [docs/BIBLE.md](docs/BIBLE.md) 了解產品願景與工程規範。
- **Archived V0.1**: 音樂日記（Music Journal）概念原型已正式歸檔。

---

> **"People don't fall in love with graphs. They fall in love with revelations."**
>
> *(人們不會愛上一張圖譜，他們會愛上那些讓他們發出「原來如此！」的揭露。)*
