# μ(sic) Product Bible v0.1

---

# 00_VISION.md

```md
# μ(sic)

## Mission

Help people understand themselves through their listening behavior.

Spotify records what people listen to.

μ(sic) helps people understand what it means.

We do not classify people.

We help people organize themselves.

Music is not the destination.

Self-understanding is.

---

## Vision

Become the most thoughtful music reflection platform.

Not another recommendation system.

Not another music statistics dashboard.

Not another chatbot.

A mirror.

---

## Product Philosophy

Music is behavior.

Behavior reveals patterns.

Patterns create listening identity.

Listening identity becomes reflection.

Reflection creates fulfillment.

---

## Core Principles

Evidence before interpretation.

Never overclaim.

Every insight must be explainable.

Identity is a lens, not a label.

We never infer personality.

We only infer listening identities from observable listening behavior.

Less information.

More meaning.

Leave users calmer than before they entered.
```

---

# 01_PRODUCT.md

```md
# MVP

Goal

After using μ(sic),

users should feel

"I understand myself a little better."

Not

"Wow AI."

Not

"So many charts."

---

## Target User

Music lovers.

People who actively listen.

People who think music has meaning.

Not casual listeners.

---

## User Journey

Landing

↓

Spotify Login

↓

Dashboard

↓

Collect

↓

Observe

↓

Measure

↓

Infer

────────── Machine ↑ / Human ↓ ──────────

Present

↓

Understand

↓

Reflect
```

---

# 02_MVP_SCOPE.md

```md
Must Have

✅ Spotify Login

✅ Fetch Listening History

✅ Identity Card

✅ Evidence

✅ Insight

Later

❌ Chatbot

❌ Recommendation

❌ Social

❌ Playlist Generator

❌ Agent

Everything must answer

"Does this help users understand themselves?"
```

---

# 03_ARCHITECTURE.md

```text
Spotify API

↓

Data Collector {資料收集器} (Collect)

↓

Database {資料庫}

↓

Behavioral Engine {行為引擎} (Observe & Measure)

↓

Inference Engine {推論引擎} (Infer)

↓

Presentation Layer {呈現層} (Present)

↓

Frontend {前端} (Understand & Reflect)
```

所有資料流都是**單向**。

先進行 Collect，再進行 Observe、Measure、Infer。

Machine 層負責推論，Human 層負責理解與反思。

不是直接 AI。

---

# 04_DATABASE.md

第一版只有：

```text
User

ListeningHistory

Track

Artist

AudioFeature

IdentityResult

Insight
```

不用更多。

---

# 05_IDENTITY_ENGINE.md

最重要。

Identity ≠ Feature

Identity 是：

> 多個 Feature 的解釋。

例如：

---

Explorer

Evidence

* Novelty Index
* Artist Diversity
* Genre Diversity

---

Collector

Evidence

* Repeat Rate
* Saved Songs
* Playlist Stability

---

Night Owl

Evidence

* Listening Time Distribution

---

Emotion Driven

Evidence

* Valence
* Energy
* Playlist Pattern

---

Rule

Identity

↓

Evidence

↓

Explanation

不是：

Identity

↓

AI

---

# 06_EVIDENCE_ENGINE.md

每一句話。

都要回答：

> Why?

例如：

```text
Explorer

87%
```

下面。

一定有：

```text
82%

First-time Listening

31

New Artists / Week

Genre Diversity

91%
```

沒有 Evidence。

就不能叫 Identity。

---

# 07_INSIGHT_ENGINE.md

Pipeline

```text
Feature

↓

Identity

↓

Evidence

↓

Insight

↓

Reflection
```

例如：

Insight

> You aren't searching for songs.

> You're searching for new perspectives.

Reflection

> Has music always been your way of exploring the world?

Reflection 不下結論。

Reflection 留白。

---

# 08_UI.md

首頁。

只有一句。

```
μ(sic)

Understand yourself through music.

Continue with Spotify
```

登入後。

```
Identity

Evidence

Insight

Reflection
```

全部都是 Card。

不要 Dashboard 塞滿。

大量留白。

Apple。

Notion。

Linear。

---

# 09_DESIGN_PRINCIPLES.md

No Neon

No Glassmorphism

No Fancy Animation

Readable.

Minimal.

Warm.

Peaceful.

Calm.

Not Gaming.

Not Cyberpunk.

---

# 10_ROADMAP.md

Mission I: Truth Layer {真實層}

Mission II: Behavior Layer {行為層}

Mission III: Identity Layer {身份層}

Mission IV: Reflection Layer {反思層}

Mission V: Deployment {部署發布}

Always demoable.

---

# 11_DECISIONS.md

```
MusicDNA

↓

μ(sic)

Reason

MusicDNA sounds analytical.

μ(sic) sounds like a product.

---

No chatbot.

Reason

Understanding first.

Conversation later.

---

Evidence First.

Reason

Trust.
```

---

# 12_ENGINEERING_RULES.md

```md
Every feature must answer:

Does this help users understand themselves?

Every insight must have evidence.

Never fake confidence.

Prefer deterministic logic before LLM.

Frontend first.

Fake data first.

Real data later.

Working software > perfect architecture.
```

---

# 13_CLAUDE.md

這份是給 Claude Code / Cursor 的。

```md
You are the CTO of μ(sic).

Your job is NOT to maximize features.

Your job is to maximize clarity.

Never over-engineer.

Prefer shipping.

Every screen should leave users calmer.

Use clean architecture.

Use shadcn/ui.

Use TypeScript.

Use Tailwind.

Every pull request should improve understanding.

Not complexity.
```

---

# 14_BRAND.md

```md
Brand

μ(sic)

Meaning

Music

Muse

μ

Small moments.

Small discoveries.

Big understanding.

Tagline

Understand yourself through music.

Alternative

Music, understood.
```

---

# WHY.md

```md
Why μ(sic)?

Because music has always been more than music.

People don't remember songs.

They remember moments.

People don't collect tracks.

They collect memories.

Spotify remembers your listening history.

μ(sic) helps you remember yourself.

The goal is not to tell users who they are.

The goal is to help them see themselves.

When users leave,

they should feel

a little calmer,

a little more fulfilled,

and a little more understood.

If we achieve that,

μ(sic) has done its job.
```
