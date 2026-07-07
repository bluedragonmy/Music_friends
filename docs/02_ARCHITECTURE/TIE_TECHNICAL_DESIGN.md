# Taste Intelligence Engine (TIE) — Technical Design Spec v1.0

本文件定義系統資料模型、TypeScript 型別（Types & Interfaces）、品味本體論（Taste Ontology）對照表與貝氏排序參數設定。

---

## 1. 核心數據模型型別定義 (TypeScript Definitions)

### A. Unified Song Entity {統一歌曲實體}
為了整合 Spotify、MusicBrainz 與 Discogs，每一首歌曲在系統內會映射至統一的歌曲實體：

```typescript
export interface UnifiedSong {
  readonly id: string; // 系統生成 UUID
  readonly title: string;
  readonly identifiers: {
    readonly spotifyUri?: string;
    readonly mbid?: string;        // MusicBrainz ID
    readonly discogsId?: string;   // Discogs ID
    readonly isrc?: string;
    readonly upc?: string;
  };
  readonly artists: readonly string[];
  readonly audioFeatures?: {
    readonly danceability: number;
    readonly energy: number;
    readonly valence: number;
    readonly acousticness: number;
    readonly instrumentalness: number;
    readonly tempo: number;
    readonly key: number;
    readonly loudness: number;
  };
}
```

### B. Taste Hypothesis {品味假說} 與 Evidence Chain {證據鏈}

```typescript
export type HypothesisType = "Observable" | "Structural" | "Stylistic" | "Semantic" | "Latent";

export interface TasteHypothesis {
  readonly id: string;
  readonly type: HypothesisType;
  readonly title: string;
  readonly description: string;
  readonly targetConcept: string; // 例如 'Minimalism' 或 'Nigel Godrich Style'
  readonly priorProbability: number; // 先驗機率 (基於群體常識或初始權重)
}

export interface EvidenceNode {
  readonly entityId: string;
  readonly entityType: "Artist" | "Producer" | "Label" | "Song" | "Genre" | "Concept";
  readonly name: string;
}

export interface EvidenceChain {
  readonly path: readonly EvidenceNode[];
  readonly confidence: number;          // 該證據路徑的推導置信度 (0.0 - 1.0)
  readonly sources: readonly {
    readonly type: string;
    readonly title: string;
    readonly url?: string;
  }[];
}

export interface VerifiedHypothesis {
  readonly hypothesis: TasteHypothesis;
  readonly evidenceChains: readonly EvidenceChain[];
  readonly posteriorProbability: number; // 經過 Bayesian 更新後的後驗機率
  readonly informationGain: number;       // 資訊增益 (KL 散度或熵值降低)
}
```

---

## 2. Taste Ontology 對照映射表 (Ontology Mapping)

品味本體論將抽象的感知美學（Concepts）映射為客觀的音訊特徵與圖譜拓撲定義：

| 品味美學概念 (Concept) | 音訊特徵門檻限制 (Audio Feature Thresholds) | 音樂世界模型關係拓撲 (MKG Topologies) |
| :--- | :--- | :--- |
| **Minimalism** | `instrumentalness` > 0.40,<br>`acousticness` > 0.30,<br>`energy` < 0.45 | `PRODUCED_BY` ➡️ `producer` (如 Nigel Godrich、Steve Reich)<br>`BELONGS_TO` ➡️ `genre` (Ambient, Minimalist) |
| **Analog Warmth** | `acousticness` > 0.50,<br>`danceability` < 0.60 | `RECORDED_AT` ➡️ `studio` (具有模擬錄音設備著名的錄音室)<br>`MASTERED_BY` / `ENGINEERED_BY` (如 Rudy Van Gelder) |
| **Dreaminess** | `valence` < 0.50,<br>`acousticness` < 0.30 | `BELONGS_TO` ➡️ `genre` (Dream Pop, Shoegaze)<br>`SHARES_PRODUCTION_STYLE` (如 Cocteau Twins 影響鏈) |

---

## 3. Bayesian Ranking Target Function {貝氏排序目標函數}

排序核心會依據以下目標函數計算每一條 `TasteInsight` 的效用值（Utility）：

$$Utility = Posterior \cdot Information\_Gain \cdot Novelty \cdot Explainability - Complexity\_Penalty$$

### 參數權重設定 (Parameters)
*   **Posterior Confidence ($Posterior$)**：$P(H | D)$，透過觀察數據（聽歌頻次與比率）更新後的機率。
*   **Information Gain ($Information\_Gain$)**：利用熵的變化量計算。如果假說能強烈收斂使用者看似發散的聆聽行為，則給予高分。
*   **Novelty ($Novelty$)**：如果假說的實體在使用者過去的已知常識之外（例如使用者知道自己愛聽 NewJeans，但不知道這與 Haruomi Hosono 的關聯），則分值提高。
*   **Explainability ($Explainability$)**：取決於 Evidence Chain 的長度與 Source 的直接度（Primary 來源比重越高，可解釋性得分越高）。
*   **Complexity Penalty ($Complexity\_Penalty$)**：避免過度擬合（Overfitting）。如果證據鏈路徑過於冗長且牽強，則扣分。
