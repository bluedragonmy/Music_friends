# μ(sic) Content Bible

This document contains the copywriting guidelines, observation rules, reflection libraries, and editorial policies.

---

## 1. Content Pipeline {內容管線}

Every sentence has a lifecycle:
```
Draft → Editorial → Review → Approved → Deprecated
```
- **Draft**: Initial copy proposed by anyone.
- **Editorial**: Verified against the Editorial Review checklist.
- **Review**: Read and verified by at least one other person.
- **Approved**: Integrated into the codebase for users.
- **Deprecated**: Flagged with reasons and replacements. Never deleted from history.

---

## 2. Editorial Review Checklist {編輯審查清單}

All user-facing copy must pass these 5 rules:
1. **Never use labels**: Avoid words like "You are a classic explorer" or "You are sad." Say what happened, not what they are.
2. **Deterministic evidence**: Every sentence must reference raw statistics from the user's data (e.g. `{noveltyPercent}%`).
3. **Warm, respectful tone**: Do not judge or evaluate. Treat patterns with gentle curiosity.
4. **Poetic but clear**: High-quality imagery, avoiding overly verbose or dramatic vocabulary.
5. **Prompt weight**: Reflection questions must linger in the mind.

---

## 3. Observation Rules & Microcopy {觀察規則與微文案}

Rules map triggers to copy structures.
- **obs_novelty_explorer** (Pattern): Triggered on novelty > 75%.
  - *Text*: "有一件事情，比我們原本預期的還要明顯... 過去 30 天，有 {noveltyPercent}% 的播放都是新歌曲。我們很好奇，你是不是一直都在尋找新的東西？"
- **obs_genre_pioneer** (Pattern): Triggered on genre diversity > 0.8.
  - *Text*: "我們在你的聆聽足跡中，看見了一幅無邊界的畫作... 你最近跨越了 {genresCount} 種不同的曲風流派。你是一個不喜歡被單一規則定義的音樂開拓者嗎？"
- **obs_repetition_collector** (Pattern): Triggered on repeat rate > 60%.
  - *Text*: "你的播放清單裡，有一群非常有默契的舊朋友... 你這週有 {repeatPercent}% 的聆聽都交給了重複的旋律。在海量的音樂中，你似乎更願意回到那些熟悉而安心的安全牌身邊。"

---

## 4. Reflection Prompts Catalog {反思庫}

Hashed deterministic reflection questions linked to triggers:
- **Novelty**: 「你最近新發現的這首歌，是讓你想起某個人，還是想忘記某個人？」
- **Repetition**: 「當你一次又一次播放同一首舊歌時，你是在尋找安全感，還是在等待某個已經過去的瞬間重現？」
- **Midnight Refuge**: 「深夜的音樂是防線，還是出口？」
- **Genre Pioneer**: 「多樣的聲音，是因為你想尋求新鮮感，還是因為你的靈魂沒有邊界？」
