# 音樂數據與限時品味交流 APP：系統實作架構與細節 (Technical Implementation Plan)

本文件旨在說明結合「音樂數據追蹤」與「限時品味交流」應用程式之系統實作細節。專案將由零開始建置，採用以下主要技術與框架：

- **核心框架**：Next.js (統籌前端介面與後端 API Routes)
- **資料庫與 ORM**：MongoDB 搭配 Prisma ORM
- **前端樣式**：Vanilla CSS (不依賴龐大框架，確保最靈活的客製化樣式，包含微動畫與流暢轉場)
- **即時通訊服務**：Socket.io (WebSocket 即時聊天)
- **快取與記憶體服務**：Redis (WebSocket 連線狀態與聊天室快取管理)
- **測試框架**：核心互動邏輯採用 Python `behave` 進行測試驗證，API 則以 Jest 為主。

---

## 1. 專案基礎架構與環境設定 (Project Setup)

**目標**：建立完整的開發基礎骨架，以支援後續的資料儲存、API 串接及介面開發。

1. **初始化 Next.js 專案**：設定 `package.json`，完成所需套件與工具的初始設定檔。
2. **資料庫層設計 (Prisma)**：
   - 於 `prisma/schema.prisma` 定義系統中的實體模型：包含 `User` (使用者)、`Playlist` (交友歌單)、`MatchRoom` (配對與聊天狀態)、`Tags` (曲風與屬性標籤) 以及 `SyncLog` (聽歌同步日誌)。
3. **CSS 全域樣式系統建立**：
   - 於 `styles/globals.css` 建立基礎設計系統 (Design Tokens)、色彩變數、以及通用之預設全域屬性。
4. **外部串流平台對接準備**：
   - 設定系統環境變數以安全儲存 YouTube Music、Spotify、Apple Music 相關的 OAuth 與 API 金鑰憑證。

## 2. 前端核心介面與元件實作 (Frontend Core)

**目標**：實作專案功能的核心 UI，重視互動之動態流暢度。

1. **配對與播放體驗**：
   - **滑動配對介面 (`components/matching/Deck.jsx`)**：呈現每日候選人卡片與其音樂品味。
   - **音訊預覽元件 (`components/playback/AudioPlayer.jsx`)**：整合 30 秒片段的客製化播放器，並提供使用者無限制自由滑動決策的流暢介面。
2. **即時互動與個人圖表**：
   - **限時聊天室 (`components/chat/ChatRoom.jsx`)**：配對成功後啟動，具備倒數 48 小時顯示計時器，且於時間到期時跳出「雙盲結算表單」。
   - **音樂數據儀表板 (`components/dashboard/Analytics.jsx`)**：支援多維度時間（日/週/月/季/年）切換，開發專屬「心智圖」漂浮泡泡動畫，進行 Glassmorphism 高質感視覺化渲染。
   - **全域單色渲染模組 (`components/layout/CoverBackground.jsx`)**：依據播放中歌曲的「專輯封面主色調」，即時更新全域背景的單色渲染，提升聽歌與配對時的極致沉浸感。

## 3. 後端業務邏輯與 API (Backend & Realtime APIs)

**目標**：處理核心儲存、配對演算，並擔任即時互動的伺服器中樞。

1. **認證與平台連動 API (NextAuth)**：
   - **雙層 OAuth 授權 (`app/api/auth/[...nextauth]/route.ts`)**：第一階段採用 Google OAuth 作為核心身分 (Identity) 登入；第二階段支援 Account Linking，讓使用者在登入後再額外綁定 Spotify 等音樂平台授權，以利獨立管理社交身分與音樂資產。
   - **產生候選人名單 (`pages/api/matching/index.js`)**：根據使用者所設定之推薦權重（如涵蓋相似曲風或隨機派送），每日自資料庫撈取 5 位合適人選回傳至前端。
2. **背景排程與即時推播系統**：
   - **背景聽歌同步 (`scripts/cron_sync.js`)**：利用 cron jobs 排程，於系統底層定時向各串流媒體 API 索取歷史播放紀錄並落庫。
   - **WebSocket 即時連線 (`server/socket.js`)**：負責對話內容收發，以及在任一方點擊「同步播放」按鍵時負責將廣播訊號無延遲發送以喚醒另一端。

## 4. 測試與驗證計畫 (Verification Plan)

**目標**：確保獨特複雜的互動邏輯如期運行。

1. **自動化測試部署**：
   - **利用 Python `behave` 進行業務互動測試**：驗證如「48 小時逾時轉為唯讀」等複雜邏輯是否正確受檢。
   - **API 端點驗證**：使用 Jest 輔以資料庫 Mock 工具，檢驗資料寫入與資料維度切換的正確性。
2. **手動開發驗證場景**：
   - 透過瀏覽器開啟雙視窗，並以不同帳號進行本地完整連線測試。
   - 實際送出「同步播放」廣播，驗證客戶端收到 Socket 推播後，是否能如期執行第三方程式外部喚起指令。
