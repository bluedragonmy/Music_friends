# μ(sic) Architecture

This document consolidates the technical architecture, domain models, database schema, behavior contracts, and versioning rules.

---

## 1. Domain Models & Schema {領域模型與資料庫綱要}

### Database Schema (Prisma)
- **User**: Spotify authentication data.
- **SyncLog**: Tracks user playback history and links to `Track` and `AudioFeature`.
- **JournalEntry**: Living document records created by the narrative engine.
- **JournalAnalytics**: Telemetry tracker measuring user reading time and view counts.
- **BehaviorSnapshot**: Historical static behavioral indicators.

```prisma
model JournalEntry {
  id            String            @id @default(cuid())
  userId        String
  date          DateTime
  observationId String
  title         String
  body          String
  evidence      Json
  reflection    String
  feedback      String?
  feedbackAt    DateTime?
  createdAt     DateTime          @default(now())
  analytics     JournalAnalytics?
}

model JournalAnalytics {
  id           String       @id @default(cuid())
  journalId    String       @unique
  viewCount    Int          @default(0)
  avgReadTime  Float        @default(0.0) // seconds
  lastViewedAt DateTime     @default(now())
  journal      JournalEntry @relation(fields: [journalId], references: [id], onDelete: Cascade)
}
```

---

## 2. Behavioral Metrics Contract {行為指標協定}

Metrics are calculated using sliding windows (e.g. 7d) on raw `SyncLog` data.
- **Novelty {新穎度}**: The ratio of unique track IDs played in the window that have never been listened to prior.
- **Repeat Rate {重複率}**: The proportion of track plays corresponding to tracks played 3 or more times.
- **Genre Diversity {類型多樣性}**: Normalized Shannon Entropy of played genres.
- **Session Length {聆聽時長}**: Average listening session duration in minutes (concluded when gaps exceed 30m).
- **Peak Hour {聆聽高峰}**: 24-hour bin representing the highest density window.

---

## 3. Inference & Narrative Architecture {推論與敘事架構}

### Behavior Baseline Provider
Decouples data sourcing from engine logic.
```typescript
export interface BehaviorBaselineProvider {
  getBaseline(userId: string, referenceDate?: Date): Promise<BehaviorBaseline>;
}
```
- Current implementation: `SyncLogBaselineProvider` computes rolling statistics dynamically.
- Future upgrades can substitute memory caching or database snapshot queries without modifying the engines.

### Narrative Score Formula
All rule sorting is deterministic:
$$\text{Narrative Score} = \text{Importance} \times \text{Unexpectedness} \times \text{Confidence}$$

- **Unexpectedness** uses Z-Score deviation from the Rolling Baseline:
  $$Z = \frac{\text{Value} - \mu}{\sigma}$$
  $$\text{Unexpectedness} = 1.0 + \min(|Z|, 3.0) \times 0.4$$

---

## 4. Versioning Policy {版本控制政策}

專案的版本推進不再以「Mission」作為里程碑，而是改由真實使用者的對話與產品決策切分：

```text
P01 → Decision 001 → P02 → Decision 002 → P03 → Decision 003 ...
```

- **Session Version (e.g., P01, P02)**: 代表真人實測階段，產品的進展由真人反饋與重播分析驅動。
- **Decision Milestone**: 每次 Session 後針對觀察所得做出的關鍵決策。
- **Frozen Engines Rule**: Core engines (`Behavioral`, `Inference`, `Observation`, `Narrative`, `Remembering`) are now locked. No architecture modifications allowed without proof of necessity.

