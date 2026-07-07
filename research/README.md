# Research Kit {研究工具包指引}

歡迎來到 **Research Sprint 1: Observe Before Invent {觀摩先於發明}**。在此階段，我們不堆砌功能，而是建立洞察工具，並進行真人實測、注意力重播與決策提煉。

---

## 🔬 五人靜默觀察法 (5-Person Silent Observation Protocol)

1. **靜默記錄**：坐在測試者身旁或看其錄影，記錄下精確的時間戳記與行為。中途絕對不要引導、提示或打擾。
2. **重播與回放**：將受測者的操作軌跡與時間軸記錄成 JSON（放置於 `research/participants/` 下），並使用專屬 `session_replay.js` 腳本重播，觀察受測者的注意力停頓與節奏。
3. **質性回訪**：測試結束後，僅詢問一個核心問題：
   > **「你還記得剛剛哪一句話嗎？」**

---

## 📁 決策與研究文件結構 (Decisions & Research Structure)

* **產品決策輸出**：
  * [docs/DECISIONS.md](file:///c:/Users/jjpc3/Desktop/Mu%28sic%29/docs/DECISIONS.md)：核心產品決策紀錄表（輸出）。遵循 **Observation → Evidence → Decision → Outcome & Status**。

* **研究輸入與工具**：
  * `research/README.md`：本指引檔。
  * `research/Observation_Template.md`：觀察記錄範本，與決策紀錄表的欄位（Observation, Evidence, Decision）保持一致。
  * `research/Research_Backlog.md`：研究問題待辦清單（以回答問題為目標，而非開發功能）。
  * `research/SURPRISES.md`：每日最出乎意料的驚喜發現登記表。
  * `research/participants/`：使用者重播日誌 JSON 存放區。
  * `research/session_replay.js`：終端機注意力節奏重播工具。

---

## 🏃 快速執行重播

在 `apps/web` 或專案根目錄下執行：
```bash
node research/session_replay.js P01
```
這將解析並繪製該使用者的操作與思考節奏圖，以輔助分析。

