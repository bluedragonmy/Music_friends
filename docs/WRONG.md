# Research Sprint 1: Invalidated Hypotheses {被推翻的假設紀錄}

此文件用於紀錄封測過程中所有被推翻的產品假設。我們不寫沒有依據的意見 (Opinion)，每一項紀錄都必須基於真實使用者的行為數據 (Evidence)，並據此做出產品設計決策 (Decision)。

---

## 1. 核心願景與觀察信條

> **The product is no longer judged by what the code does. It is judged by what people do after reading it.**
>
> **我們不看功能多複雜，我們只看使用者讀完後的真實反應與行動。**

---

## 2. 假設紀錄表 {Invalidated Hypotheses Registry}

### 🔍 紀錄模板 (Registry Template)

* **我們以為 (Assumption)**: `我們原先相信的使用者行為或價值主張`
* **數據證據 (Evidence)**: `5 位封測使用者中，實際有多少人表現出相反行為或停頓`
* **產品決定 (Decision)**: `基於此實體數據，我們要如何修改/刪除/優化功能`

---

### 📓 封測第一階段失效假設記錄 (Sprint 1 Findings)

#### [Invalidation #1] 詩意紀元命名的虛假感
* **我們以為 (Assumption)**:
  像是 "The Season of Gentle Flows" 等詩意且富有故事性的 Era 名稱，能幫助使用者更好地融入自己過去的音樂情境與情懷中。
* **數據證據 (Evidence)**:
  在 Alpha 測試對話反饋中，使用者第一眼看到該 Era 命名，第一反應是「這看起來像假的，是不是每天都在隨機產生一張差不多的卡片？」，感覺整套系統的信任感瞬間消失。
* **產品決定 (Decision)**:
  徹底關閉 `era-generator.ts` 中的 Poetic Era 生成，僅回傳物理年月 (如 `2026 年 7 月`)，並在 UI 首頁與時間軸中移除 Era 描述。

#### [Invalidation #2] Reflection 與 Feedback 的強綁定
* **我們以為 (Assumption)**:
  在讀完卡片後，強引導使用者在 Feedback (很像/不像) 的同時寫下一句給未來自己的話 (Reflection) 是最直覺的線性流程。
* **數據證據 (Evidence)**:
  封測發現，有些使用者即使點選「✘ 不像」（例如他今天剛好播放了一首例外曲目），但他仍然想對今天這首特別的歌留下備註與故事；反之，點選「✔ 很像」的人也不一定每次都想打字留言。強綁定增加了多餘的認知負荷。
* **產品決定 (Decision)**:
  將 Reflection 與 Feedback 完全解耦。留言板簡化為隨時可點開的超連結 `「寫一句話給未來的自己」`，只有 Feedback 點選 `✘ 不像` 時，才展開選填的 free-text 原因輸入框。

#### [Invalidation #3] AI 拼貼與解讀過去留言的尷尬感
* **我們以為 (Assumption)**:
  利用 AI 結合當前情境將使用者過去留下的文字（例如：「希望我能忘記他」）串聯並呈現在卡片中，能創造出強烈的情感共鳴。
* **數據證據 (Evidence)**:
  在實際聆聽與閱讀流中，AI 硬接的拼貼句子常在重溫時產生極度尷尬或不合時宜的情感冒犯（有些傷痕或情緒使用者只想留白）。
* **產品決定 (Decision)**:
  禁止 AI 主動拼接與朗讀回憶。改用絕對日期的折疊元件 `[YYYY / MM / DD 你留過一句話。 [打開]]` 呈現在 Evidence 中，由使用者自主決定何時開啟重溫。

#### [Invalidation #4] 多維數據展示 (Explain Data) 的認知干擾
* **我們以為 (Assumption)**:
  在 Confidence Display 中展現豐富的工程百分比與多維度指標（例如：`新歌比例：87%, 重複率: 60%...`）能顯得數據極其專業。
* **數據證據 (Evidence)**:
  使用者回饋這些繁雜數據像是在看「工程師 Debug 報告」，干擾了音樂日記的和諧感與個人反思，甚至引起對演算法真實性的懷疑。
* **產品決定 (Decision)**:
  將其改為最多 **3 項** 的勾選條件說明（Explain Selection），極簡指出此卡片之所以被選中的物理觸發規則（例如：`✓ 完整聽完一張專輯`, `✓ 沒有跳歌`, `✓ 41分鐘`）。
