# Taste Ontology Specification v1.2

本文件更新 **Taste Ontology** {品味本體論} 以支援樹狀繼承結構（Parent/Child Tree），使美學概念具備分類學上的繼承與關聯性。

---

## 1. 樹狀分類本體論 (Ontology Tree Schema)

品味美學概念不再是扁平的集合，而是區分為四大領域（Domain）的樹狀分類結構。

### 樹狀節點型別擴充 (Ontology Tree Nodes)
```typescript
export type OntologyDomain = "SoundAesthetic" | "Production" | "Emotion" | "Culture";

export interface OntologyNode v1.2 {
  readonly version: string;
  readonly conceptId: string;
  readonly domain: OntologyDomain;
  readonly parentConceptId?: string;   // 雙親節點 ID (用於樹狀繼承)
  readonly displayName: {
    readonly en: string;
    readonly zh: string;
  };
  readonly definition: string;
  readonly audioFeatures: {
    readonly conditions: readonly {
      readonly feature: string;
      readonly operator: "gt" | "lt" | "gte" | "lte";
      readonly value: number;
    }[];
  };
  readonly graphMapping: {
    readonly targetEdgeTypes: readonly string[];
    readonly requiredNodeTypes: readonly string[];
  };
  readonly baselineConfidence: number;
}
```

---

## 2. 樹狀結構繼承規則 (Inheritance & Similarity)

透過引進 `parentConceptId`：
1.  **特徵繼承（Feature Inheritance）**：子節點（如 `Tape Saturation`）自動繼承其父節點（如 `Analog Warmth`）所定義的基礎聲學特徵條件。
2.  **相似度傳播（Similarity Propagation）**：在計算使用者品味相似度時，若使用者 A 偏好 `Analog Warmth`，使用者 B 偏好 `Tape Saturation`，由於兩者共享相同的雙親祖先，系統可藉此計算出較高的品味重合度。

---

## 3. Tree Classification v1.0.0 實例結構

```
Taste Ontology (TIM v1.2)
├── SoundAesthetic (聲音美學)
│   ├── Analog Warmth (類比溫暖感)
│   │   ├── Tape Saturation (磁帶飽和度) [Child]
│   │   └── Vintage Recording (復古錄音) [Child]
│   └── Ambient Texture (環境紋理)
├── Production (製作美學)
│   ├── Minimalism (極簡主義)
│   └── Maximalism (極繁配置)
├── Emotion (情感表達)
│   ├── Dreaminess (夢幻感)
│   └── Melancholy (憂鬱感)
└── Culture (文化背景)
    ├── City Pop Nostalgia (都市流行懷舊)
    └── Spiritual Jazz (精神爵士)
```
