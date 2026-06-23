# 音樂數據與限時品味交流 APP：實作計畫 (Implementation Plan)

專案目標是建立一個結合「音樂數據追蹤」與「限時品味交流」的應用程式。此專案將從零開始建置，採用 **Next.js** 作為全端基礎框架（涵蓋前端與 API Routes），搭配 **MongoDB** 與 **Prisma ORM** 作為資料庫，並使用 **Vanilla CSS** 確保設計的高度靈活與精美。聊天模組將採用 **Socket.io** 達成 WebSocket 即時通訊，快取與黑名單過濾將導入 **Redis**。同時，我們也會結合 Python `behave` 執行重點行為驅動開發 (BDD) 的測試。

## User Review Required
> [!IMPORTANT]
> 1. **資料庫與基礎架構確認**：目前的規劃為 **Next.js + MongoDB + Prisma + Redis**。是否符合您現有的伺服器或本機環境的開發期待？
> 2. **前端樣式選擇**：依照最佳實踐，我們預設全面採用 Vanilla CSS 來達成豐富精緻的美學設計（微動畫、漸層、流暢轉場等）。您是否同意此設計方向？
> 3. **第三方平台金鑰**：串接 YouTube Music, Spotify, Apple Music 後續實作需向官方分別申請 OAuth 與 API 開發者憑證，確認您已知悉此事項即可。

## Proposed Changes (BDD Gherkin Style)

### 1. 專案環境與基礎架構初始化 (Project Setup)
```gherkin
Feature: 專案基礎架構初始化
  為了確保開發順利並支援後續的資料儲存與串接
  系統應建立完整的開發基礎骨架與設定

  Scenario: 建立核心後端與資料庫模組
    Given 目前尚未具有專案運行環境
    When 開發者初始化 Next.js 專案設定 package.json
    And 於 prisma/schema.prisma 定義 User, Playlist, MatchRoom, Tags, SyncLog 表格
    And 建立基本的 styles/globals.css 全域樣式設定
    Then 系統將有一套合適的基礎專案可供執行
```

### 2. 前端核心元件 (Frontend Core)
```gherkin
Feature: 前端核心介面開發
  為了提供優質的 Vanilla CSS 美學設計
  前端介面必須具備滑動配置、音訊播放與即時聊天等元件

  Scenario: 建立配對與播放元件
    Given 系統已經導入基礎的設計 Tokens
    When 實作 components/matching/Deck.jsx 滑動元件
    And 實作 components/playback/AudioPlayer.jsx 跨平台預覽播放元件
    Then 視窗可呈現卡片，且使用者隨時可自由滑動觸發下一步

  Scenario: 建立聊天與圖表元件
    Given 配對雙方互相喜歡進入階段
    When 實作 components/chat/ChatRoom.jsx WebSocket 限時 48 小時聊天室
    And 實作 components/dashboard/Analytics.jsx 音樂數據圖表與支援多時間維度切換的「專屬心智圖」
    And 實作依據單一專輯封面主色調渲染的動態背景引擎
    Then 系統前端畫面可提供雙盲選擇表單與沉浸式的視覺化數據介面
```

### 3. 後端 API 與即時服務 (Backend & Realtime APIs)
```gherkin
Feature: 後端業務邏輯與即時通訊
  為了讓前端與系統背後順暢運行
  必須建構第三方登入與配對演算法，以及推播與定時觸發機制

  Scenario: 實作登入與每日配對 API
    Given 使用者希望透過帳號授權登入
    When 系統透過 pages/api/auth/[...nextauth].js 進行 OAuth 驗證
    And 系統透過 pages/api/matching/index.js 執行配對演算法
    Then 回傳每日合適的 5 位配對候選人給客戶端

  Scenario: 實作背景同步與即時推播
    Given 系統需要定時獲取以及同步即時訊息
    When 在 server/socket.js 設定 WebSocket 連線與同步播放機制
    And 使用 scripts/cron_sync.js 定期處理背景音樂資料自動擷取
    Then 雙方通訊與背景音樂數據紀錄皆能無延遲與無誤執行
```

### 4. BDD 行為驅動開發區塊 (BDD Testing Framework)
```gherkin
Feature: 對關鍵邏輯實行測試
  為了確保邏輯不受異動破壞
  開發人員需針對核心條件撰寫及維持測試

  Scenario: 配對情境測試與驗證撰寫
    Given BDD 環境整合完畢
    When 在 features/matching.feature 撰寫「自由滑動配對」的情境描述
    And 在 features/steps/matching_steps.py 設定對應的斷言邏輯
    Then 可由 behave 確認系統核心互動邏輯正確回傳
```

## Verification Plan

### Automated Tests (自動化測試)
- **BDD 情境驗證**：利用 `behave` 框架運行上述撰寫的 `features/*.feature`，確保核心商業邏輯（例如 48 小時倒數時間軸、雙盲選擇結果）的回傳資料皆如預期。
- **後端 API 測試**：利用 Jest 模擬 Database Mock，驗證各時間維度圖表數據與資料庫的正確性。

### Manual Verification (手動人機驗證)
- 手動編譯運行 `npm run dev`，透過瀏覽器多開測試完整配對情境。
- 手動模擬發送「同步播放」事件，確保 WebSocket 廣播正確被接收方攔截觸發。
