# μ(sic) Product Bible

## Four Laws {四大法則}

1. **Never invent.** (如果不知道，就不要寫。)
2. **Never interrupt.** (讓使用者決定要不要看。)
3. **Never explain.** (不要替使用者解釋自己。)
4. **Never waste attention.** (任何動畫、按鈕、Loading、文案，都要問：值得使用者花三秒鐘嗎？如果不值得，拿掉。)

---

## Guiding Principles {最高哲學準則}

> **"Every feature is guilty until proven valuable."**
> *(每一個功能，在證明有價值之前，都應該被視為沒有價值。)*

> **"Fall in love with the user's reaction, not with your own theory."**
> *(愛上使用者的反應，而非你自己的理論。)*

---

## 1. Vision & Mission {願景與使命}

### Mission
Help people understand themselves through their listening behavior.
Spotify records what people listen to. μ(sic) helps people understand what it means.

We do not classify people. We help people organize themselves.
Music is not the destination. Self-understanding is.

### Vision
Become the most thoughtful music reflection platform.
Not another recommendation system. Not another music statistics dashboard. Not another chatbot.
A mirror.

### Product Philosophy
- Music is behavior.
- Behavior reveals patterns.
- Patterns create listening identity.
- Listening identity becomes reflection.
- Reflection creates fulfillment.

### Core Principles
- **Evidence before interpretation**: Every insight must be explainable. Never fake confidence.
- **Identity is a lens, not a label**: We never infer personality. We only infer listening identities from observable behavior.
- **Less information, more meaning**: Leave users calmer than before they entered.
- **Mirroring, not interpreting**: 我們不是替使用者解讀音樂。我們只是讓他，在某一個瞬間，重新看見自己。

---

## 2. Product Design & UX {產品設計與體驗}

### Target User
Music lovers. People who actively listen and think music has meaning. Not casual background listeners.

### User Journey
```
Landing → Spotify Login → Dashboard (Today) → Narrative Score (Ranking) → Reflect (White Space)
```

### UX & Interface Discipline
- **No unnecessary labels**: Do not show engineering terms like "Observation" or "Story Card" in the UI. Show the date (e.g. `July 5`) and let the content speak for itself.
- **No Neon, no glassmorphism, no gaming cyberpunk aesthetics**: Minimalist, warm, readable, and peaceful. Large white space.

---

## 3. Product Metrics {產品指標}

We reject DAU/MAU vanity metrics. We focus on intention and impact:
- **Return With Intention {意圖留存}**: A user opens μ(sic) not due to a push notification or email, but because they thought of a sentence or want to see what μ(sic) says today.
- **Average Read Time {平均閱讀時間}**: Target > 15s per card. Shows deep reading instead of mindless scrolling.
- **Silent User Ratio {安靜用戶比率}**: Ensuring low-activity users still get warm, meaningful rewinds instead of blank pages.

---

## 4. Beta Plan & Research Protocol {封測與研究協定}

### 5-Person Silent Observation {五人靜默觀察}
- **Scale**: Exactly 5 users.
- **Protocol**: Sit next to them, record screen/actions, and remain completely silent. Do not guide.
- **Measurements**: Timestamps of pauses, scrolls, navigation, and leaving.
- **One Question**: At the end of the session, ask only: **「你還記得剛剛哪一句話嗎？」** (Do you remember what sentence you just read?). If they remember it 5 minutes later, the copy had weight. If they forgot, it was just pretty words.
- **Success Criteria**: A first-time user pauses at a sentence and looks silently for at least 10 seconds.

### Rule 4: Don't optimize emotions. Observe them. {觀察情緒，而非設計情緒}
- Do not attempt to engineer sentiment, write overly dramatic prose, or force poetic nostalgia. We only provide the space.
- Emotions are not KPIs; behavior is. We only record objective metrics:
  - Did they pause?
  - Did they reread?
  - Did they screenshot?
- Did they open Spotify?
  - Did they stay silent?

---

> **The product is no longer judged by what the code does.**
>
> **It is judged by what people do after reading it.**
>
> *(產品不再以程式碼做了什麼來評判，而是以使用者讀完它之後做了什麼來評判。)*

---

## 5. Research Sprint 1: Research Charter {研究憲章}

```text
Stop Inventing.
Start Watching.
Every hypothesis needs evidence.
Every feature must come from observation.
```

### 觀察決策守則 (Observation Decision Rule)
> **Never change the product because someone suggested it. Change it because you watched it happen.**
> *(絕不要因為有人建議就修改產品。要改，是因為你親眼看到它發生。)*

### 併入限制 (Merge Gate Rule)
> **No new feature enters the production branch without a research reference.**
> *(沒有研究引用佐證，任何新功能都不得併入。所有功能 PR 必須附帶研究時間戳記或受測者行為觀摩 ID。)*

### 決策落實守則 (Research Actionability Rule)
> **One session. At most one decision.**
> *(一次對話，最多一個決策。)*
>
> 我們不強求每個 Session 都要有修改產品的 Decision。允許最好的決策是 **Do nothing {保持原樣}** 或 **Need more evidence {需要更多證據}**。避免為了解決問題而過度改動產品。
> 
> ```text
> Observation → Evidence → Decision → Ship
> ```

### 終極成功標準 (Ultimate Success Metric)
> **如果 P01 用完之後，隔天沒有任何提醒，卻自己打開 μ(sic) 一次，那就是目前為止最有價值的一次 commit。**
> 
> 之後每一個改動，都可以回到這個問題：
> **它是否提高了使用者願意再次回來的可能性？**
> 如果答案不是，那就不要做。

---

> **Every decision closes a possibility.**
>
> **Choose carefully.**
>
> *(每一個產品決策，都代表你放棄另外十個方向。請謹慎選擇。)*


