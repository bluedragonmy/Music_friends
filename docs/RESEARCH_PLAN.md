# μ(sic) Research Plan (TIM 2.0)

> **"Our goal is not to prove TIM right. Our goal is to discover what is true about helping people understand themselves—even if TIM turns out to be the wrong answer."**
>
> *(我們的目標不是證明 TIM 是對的。我們的目標是去探索「如何幫助人們理解自己」的真實規律——即便最後事實證明 TIM 是錯誤的解答。)*

---

## 📄 一頁論文提案 (One-page Thesis Abstract)

*   **問題 (Problem)**：人們知道自己喜愛哪些音樂，但往往不知道自己**為什麼**喜歡。現有工業界與學術界方法難以提供可驗證、可追溯且具有提升「自我理解價值」的深層品味洞察。
*   **研究問題 (Research Question)**：如何利用證據驅動的假說生成與實證生命週期，協助使用者促進其對自身潛在音樂偏好的反思性理解？
*   **研究假設 (Hypotheses)**：
    *   $H_0$ (虛無假設)：與現有方法相比，證據驅動的假說生成框架（TIM）無法顯著改善使用者對自身的偏好理解、表達與信心。
    *   $H_1$ (對立假設)：與現有方法相比，證據驅動的假說生成框架（TIM）能顯著改善使用者對自身的偏好理解、表達與信心。
*   **研究方法 (Method)**：
    $$\text{Observation \{觀測\}} \to \text{Hypothesis Generation \{假說生成\}} \to \text{Experiment Planning \{實驗規劃\}} \to \text{Evidence Retrieval \{證據檢索\}} \to \text{Belief Update \{貝氏更新\}} \to \text{Accepted / Rejected / Archived Insight \{確證洞察\}}$$
*   **基準對照 (Baselines)**：
    1.  *Baseline A (Graph Query)*：圖譜直接路徑遍歷，無推理實證層。
    2.  *Baseline B (LLM Zero-shot)*：大語言模型直接對播放清單進行零樣本洞察推理與解釋。
    3.  *Baseline C (Human Self Reflection)*：使用者在實驗前自主寫下的品味反思自白。
*   **評估構念與指標 (Constructs & Metrics)**：
    *   *主要構念 (Primary Constructs)*：
        1.  **Self-understanding {自我理解}**：使用者對自身潛在偏好結構的認知提升度。
        2.  **Self-confidence {自我信心}**：使用者描述與主張自身偏好的確定程度。
        3.  **Self-articulation {自我表達}**：使用者能清晰闡述自己「為什麼喜歡」的敘事能力。
    *   *次要指標 (Secondary Metrics)*：Credibility {可信度}、Surprise {驚奇度}、Insightfulness {洞察度}、Delayed Recall Rate {延遲記憶留存率}。
    *   *因果行為驗證 (Causal Behavioral Validation)*：計畫以 A/B 對照組追蹤。對比系統提及的 Target A (實驗組) 與同等流行度但未提及的 Target B (對照組) 在兩週後的實際聽歌與搜尋率差異。
*   **預期貢獻 (Expected Contribution)**：
    1.  **Hypothesis Lifecycle Method {假說生命週期方法論}**：提出一套可產生、驗證、駁回與動態修正潛在偏好假說的生命週期管理程序（將 Rejected 假說作為一等公民）。
    2.  **Reflective Understanding Facilitation {促進反思性理解}**：提供一個有證據支持的框架，用以促進使用者對個人音樂偏好的反思性理解（An evidence-supported framework for facilitating reflective understanding of personal music preferences）。
    3.  **Evaluation Protocol for Self-understanding AI {自我理解型 AI 評估協定}**：為宣稱能提升自我理解與反思的個人化 AI 系統，建立一套包含延遲與因果行為驗證的嚴謹、可複製評估框架。

---

## 🔬 科學假設與證偽設計 (Scientific Hypothesis & Falsifiability)

### 假設定義 (Hypothesis Definitions)
*   **$H_0$ (虛無假設 / Null Hypothesis)**：與現有方法相比，證據驅動的假說生成框架（TIM）無法顯著改善使用者對自身的偏好理解、表達與信心。
*   **$H_1$ (對立假設 / Alternative Hypothesis)**：與現有方法相比，證據驅動的假說生成框架（TIM）能顯著改善使用者對自身的偏好理解、表達與信心。

### 證偽標準 (Falsifiability: What would convince us that TIM is wrong?)
我們必須誠實面對可能推翻 $H_1$ 的實證結果。若出現以下任一情況，我們將承認 TIM 是錯的（H1 被證偽，接受 H0）：
1.  **無效的可解釋性**：在 Human Study 中，使用者閱讀 TIM 確證假說的 Evidence Chains {證據鏈} 之後，其偏好理解度、信心與表達評分與「直接看純文字 LLM 分析」或「無假說實證的純 Graph 遍歷」無統計學上的顯著差異 ($p \ge 0.05$)。
2.  **Surprise 與 Credibility 的互斥**：系統生成的假說雖具有高 Surprise {驚奇度}，但 Credibility {可信度} 極低，導致使用者認為這些假說僅是「過度詮釋（Over-interpretation）」而非真實的自我品味。
3.  **無效的假說重啟**：在持久性假說記憶中，先前被 Rejected 的假說在 Reopen 後，隨著新播放數據的湧入並未展現出穩定的後驗機率收斂，而是呈現隨機震盪。
4.  **無效的行為改變**：在 Behavioral Validation {行為驗證} 追蹤中，接受 TIM 報告的組別，在兩週後的實際聆聽行為（如探索新流派、搜尋特定製作人、建立新歌單）相較於對照組（Baseline A & B）無任何顯著的統計學改變。這將證明系統產出的洞察僅停留在短暫的主觀認同，並未實質轉化為對自身心智模型的修正與行為投射。

---

## ⚖️ 基準對照設計 (Evaluation Baselines)
為了公平評估「偏好理解、信心與表達」而非「推薦準確度」，我們對比以下三組 Baseline {基線}：
*   **Baseline A: Graph Query {無推理圖譜直接查詢}**：直接將用戶聽過歌曲在知識圖譜中進行 BFS/DFS 路徑遍歷輸出，不經過 Hypothesis Generation {假說生成}、Belief State {信念狀態} 更新與 Experiment Planner {實驗規劃器}。
*   **Baseline B: LLM Zero-shot Explanation {純 LLM 零樣本推理與解釋}**：將用戶的 Spotify 播放歷史以純文字列表形式餵給 GPT-4，由 LLM 直接寫一段品味理解與解釋。
*   **Baseline C: Human Self Reflection {人類自主反思}**：在實驗開始前，請使用者自己寫一段 200 字的自白：「我覺得我喜歡什麼音樂，為什麼？」。我們對比 TIM 能否指出使用者「不知道但確實存在」的隱性偏好。

---

## ⚠️ 效度威脅 (Threats to Validity)
*   **內部效度威脅 (Internal Validity)**：
    *   *圖譜數據不完整度*：現有 Music Knowledge Graph 的節點與邊主要是人工 Seed 生成，存在數據偏差（例如 K-Pop 偏多，古典與爵士稀疏），這會導致某些流派的使用者無法生成有效的證據鏈。
*   **外部效度威脅 (External Validity)**：
    *   *領域局限性*：目前所有實驗僅在音樂領域（Music Domain）進行，此推理框架在電影、閱讀、飲食等其他人類潛在偏好領域的泛化能力（Generalizability）尚未得到實證。
*   **建構效度威脅 (Construct Validity)**：
    *   *自我理解度量化難度*：使用者主觀填寫的 Likert 量表得分，是否能完全等同於真實認知上的「自我偏好理解」，仍存在心理測量學上的主觀偏差。
*   **結論效度威脅 (Conclusion Validity)**：
    *   *樣本量限制*：前導研究 (Pilot Study) 的訪談樣本數較少，可能導致統計功效（Statistical Power）不足以做出一般性結論。

---

## 📊 計畫的前導實驗與質性分析 (Planned Qualitative & Behavioral Pilot Study)

我們計劃設計前導實驗（Pilot Study），預計招募 5 位具有不同聆聽習慣的樂迷（P01 至 P05），進行為期兩週的雙盲對照與質性訪談。訪談逐字稿預計採用**獨立雙人編碼（Independent Qualitative Coding）**進行主題分析，預定由兩位研究者獨立對訪談轉譯文本進行 Coding，並計算評分者間一致性信度（Inter-rater Agreement，以 Cohen's $\kappa$ 檢驗，目標設為 $\kappa \ge 0.80$）。

### 預期的前導實驗編碼設計與分析架構 (Planned Pilot Study Coding Design)

本表格展示了在前導實驗中，我們將如何對參與者的反饋進行系統化質性編碼與行為因果分析。**（註：此表格為計畫執行的分析架構，表中 Quote 與結果為基於 1.0 MVC 合成測試數據的預期投射，非真實完成數據）：**

| Date (Planned) | Participant | Explored Theme (Planned) | Causal Group Design (Target A / B) | Expected Representative Quote | Expected Qualitative Code | Planned Research Decision |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| 2026-07-xx | P01 (U_TEST_B) | Unexpected Producer Genealogy | Target A: 250<br>Target B: FRNK | *「我本來就知道 250 幫 NewJeans 做歌，但我從沒想過他受細野晴臣合成器的啟發，進而影響了我的品味。」* | **Identity Reframing** (自我認同重塑) | **檢驗指標**：追蹤兩週後 P01 對 Target A 播放量是否顯著增加，而 Target B 無顯著變化。 |
| 2026-07-xx | P02 (test_silent) | Ambient Music Historical Link | Target A: Erik Satie<br>Target B: Claude Debussy | *「我超愛 Radiohead 和 Satie，但從來沒想過 Daydreaming 跟 Satie 的『家具音樂』概念在音樂學上有這種隱秘傳承！」* | **Conceptual Bridging** (概念連通認知) | **檢驗指標**：追蹤兩週後 P02 是否主動搜尋並聆聽 Satie 的相關生平音樂與學術背景。 |
| 2026-07-xx | P03 (U_TEST_D) | Pop Producer Mainstream Influence | Target A: Jack Antonoff<br>Target B: Max Martin | *「我知道 Jack 幫她們都做過歌，但不知道是 Melodrama 的主要製作。這印證了我喜歡偏向情緒化編舞的聲音。」* | **Validation of Bias** (偏好證實與合理化) | **檢驗指標**：確認對於大眾主流連結，TIM 主要發揮 Self-articulation (自我表達) 作用而非 Surprise。 |
| 2026-07-xx | P04 (U_TEST_E) | Jazz Hip-Hop Linkage | Target A: Noriko Kose<br>Target B: Uyama Hiroto | *(無關聯路徑產生)* | **Systemic Sparsity** (圖譜稀疏限制) | **邊界研究**：圖譜中若缺乏小眾爵士樂與採樣 facts，TIM 預期將自動駁回假說，以此作為 Boundary Study 數據。 |

---

## 📚 研發背景與 HCI 文獻定位 (Related Work Positioning)

本研究的核心並非傳統的推薦系統（Recommendation Systems，旨在解決「接下來聽什麼歌」的效用問題），而是定位為 **Human Self-understanding Framework {人類自我理解框架}**。我們在論文中將與以下 HCI 領域的核心文獻進行對照與定位：

1.  **Personal Informatics & Quantified Self (個人資訊學與量化自我)**：
    *   *Li et al., 2010* 與 *Epstein et al., 2015* 探討了人們如何透過收集與反射個人行為數據（如步數、睡眠、聽歌歷史）來獲得自我理解。TIM 不僅僅提供數據統計，而是透過「假說生成與實證」提供高層次的語意理解。
2.  **Reflective Systems (反思性系統)**：
    *   HCI 領域（如 *Sengers et al., 2005* 與 *Fleck & Fitzpatrick, 2010*）探討如何設計科技來促進使用者的深度批判性反思（Critical Reflection）。TIM 透過評估並揭露隱秘的製作人或歷史傳承鏈，促進使用者對個人品味的 reflective understanding {反思性理解}。
3.  **Explainable Personalization (可解釋的個人化系統)**：
    *   *Tintarev & Masthoff, 2012* 強調了透明度與可解釋性在推薦系統中的作用。TIM 將「解釋」從「事後補救的字串描述」升格為「貝氏機率確證的證據鏈」，保證了解釋的嚴謹度。
4.  **Serendipity Recommender (意外驚喜推薦)**：
    *   *Kaminskas & Bridge, 2016* 將 Serendipity 定義為 Relevance {相關性} 與 Unexpectedness {意外感} 的交集。

---

## 🚫 邊界與失敗研究設計 (Boundary & Failure Study Design)

為了維護科學實證的嚴謹性，我們刻意設計了一組 **「TIM 註定會輸」的邊界實驗**，用以明確劃定本框架的適用範疇：

*   **極端數據測試組 (The Extreme Taylor Swift Fan)**：
    *   *實驗設計*：我們輸入一位只聽 Taylor Swift 單一歌手所有歌曲的使用者播放歷史。
    *   *預期結果*：
        *   **TIM 表現**：由於圖譜中缺乏跨歌手、跨製作人的複雜多元連接，TIM 的 `Experiment Planner` 將無法檢索到足夠的非平凡證據，導致大部分假說在貝氏更新後 posterior {後驗機率} 偏低，大量假說被直接 Rejected，系統無法產出有效的 Acceptance 洞察。
        *   **LLM Zero-shot 表現**：純文字 LLM (GPT-4) 仍能憑藉強大的生成能力，為該使用者天馬行空地寫出一篇「分析您對 Taylor Swift 歌詞、和弦與情緒轉折的熱愛」的流暢敘事，並可能在 `Self-articulation` 上獲得使用者的高主觀打分。
    *   *學術啟示*：此實驗將證明 **TIM 框架高度依賴於知識圖譜的連通性與使用者歷史的多樣性**。在圖譜邊界外或數據極度單一的情況下，傳統 LLM 的直覺式泛化分析優於 TIM；而 TIM 的優勢則在於「提供具備事實鏈支撐的非平凡、跨領域語意關聯」。
