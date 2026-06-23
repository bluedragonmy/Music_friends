# 前端頁面開發任務清單 (Frontend Checklist)

根據我們目前的後端 API 進度以及 `demo_app.html` 與 `mockup.html` 的設計理念，前端已經具備了強大的底層邏輯（如 Spotify 播放、WebSocket 即時聊天、配對機制），接下來我們需要將這些功能與具有「深色毛玻璃質感（Glassmorphism）、Y2K 元素與極簡風格」的 UI 結合。

## 頁面開發 Checklist

### 1. 登入與歡迎頁面 (Login & Landing Page)
- [ ] **路由**: `/login` (取代目前的首頁測試按鈕)
- [ ] **UI 實作**: 深色雜訊背景 (Noise filter)、產品 Logo 與標語 ("建立你的音樂人格")。
- [ ] **功能**: 
  - 提供「使用 Spotify 登入」與「使用 Google 登入」按鈕。
  - 處理登入後的重導向邏輯。

### 2. 音樂人格註冊與引導頁 (Onboarding)
- [ ] **路由**: `/onboarding`
- [ ] **UI 實作**: 步驟式引導介面 (Step 1: 匯入音樂, Step 2: 填寫暱稱)。
- [ ] **功能**: 
  - 呼叫 `/api/spotify/top-tracks` 獲取 Spotify 音樂資料。
  - 讓使用者檢視擷取到的前五大歌曲 (Top 5)。
  - 點擊「開始配對」寫入資料庫並進入主畫面。

### 3. 主配對探索頁面 (Discovery / Match Swipe)
- [ ] **路由**: `/` (或 `/match`)
- [ ] **UI 實作**: 
  - 仿造 `demo_app.html` 的卡片堆疊 (Card Stack) 或滑動介面。
  - 顯示對方的精選專輯封面、音樂屬性泡泡 (Mind Map) 與播放進度條。
  - 下方提供極簡的 Like (右滑) / Nope (左滑) 控制按鈕。
- [ ] **功能**:
  - 載入 `/api/match/candidates` 獲取推薦清單。
  - 音樂試聽 (預覽音檔自動播放或透過 Spotify API 播放)。
  - 呼叫 `/api/match/action` 提交滑動結果。

### 4. 配對成功特效組件 (Match Overlay)
- [ ] **UI 實作**: 滿版毛玻璃遮罩、大大的 "配對成功" 漸層文字與雙方頭像交疊動畫。
- [ ] **功能**: 當 `action` API 回傳 `isMatch: true` 時觸發，並提供「前往聊天室」的按鈕。

### 5. 聊天室清單頁 (Inbox)
- [ ] **路由**: `/chat`
- [ ] **UI 實作**: 頂部導覽列搭配底部選單 (Bottom Nav)。列表呈現所有的聊天對象。
- [ ] **功能**: 呼叫 `/api/match/rooms`。針對不同的 `status` (ACTIVE 倒數中 / CLOSED 唯讀 / MATCHED 永久好友) 給予不同的視覺提示（如沙漏、鎖頭或星星）。

### 6. 即時聊天與音樂同步室 (Chat Room Detail) - UI 重構
- [ ] **路由**: `/chat/[roomId]`
- [ ] **UI 重構**: 將目前測試版的 UI 對齊 `demo_app.html` 的設計語彙。
  - 重新設計對話泡泡 (Message Bubbles) 與輸入框。
  - 優化 48 小時倒數計時器的顯示位置。
  - 美化「同步播放邀請」的橫幅通知。
  - 優化「雙盲結算 (KEEP / END)」的互動彈窗設計。

### 7. 個人檔案與統計數據 (Profile & Logs)
- [ ] **路由**: `/profile`
- [ ] **UI 實作**: 呈現使用者的音樂基因樹 (Matrix Chart / Bar Chart) 以及本月常聽藝人。
- [ ] **功能**: 呼叫 `/api/stats` 獲取每月統計資料 (`UserMonthlyStat`)，並提供登出按鈕。
