# 專案任務清單 (Task List)：音樂數據與限時品味交流 APP

## Phase 1: 專案建置與基礎架構 (Infrastructure & Setup)
```gherkin
Feature: 專案開發環境建置與驗證機制
  為了專案中後期開發的順暢度
  需將前後端基礎框架以及資料庫結構進行完備建置

  Scenario: 初始化開發環境與資料庫
    Given 開發者已備妥開發環境
    When 初始化前端 (Web/App) 與後端 API 專案架構
    And 建立 User, Playlist, Match, Chatroom, SyncLog, Tag 等資料庫結構
    And 實作雙層架構 OAuth 授權 (Google 身分登入 + Spotify 音樂平台綁定)
    Then 開發者可以成功連接資料庫並能流暢進行獨立的第三方身分綁定與授權
```

## Phase 2: 第一階段 - 配對與歌單管理模組 (Matching & Playlist)
```gherkin
Feature: 歌單匯入與限時配對機制
  為了促成使用者的音樂品味交流
  需要擷取平台歌曲並每日推薦合適的對象

  Scenario: 實作自訂歌曲清單與配對防護
    Given 使用者已登入且與串流 API 建立連接
    When 系統呼叫串流 API 建立含有 5 首自訂 30 秒區間的歌單
    And 運用後端配對演算法挑選隨機或相似曲風對象
    Then 前端每日可渲染 5 位候選人的配對畫面，且使用者隨時可自由滑動選擇「喜歡/跳過」狀態
```

## Phase 3: 第二階段 - 聊天室與限時互動模組 (Chat & Interaction)
```gherkin
Feature: 48 小時過期聊天室系統
  為了提供限時且深度的品味互動
  系統須在雙方互好時建立聊天並啟動倒數

  Scenario: 雙向喜歡並進入倒數互動
    Given 兩位配對者皆對彼此歌單按下喜歡
    When 系統建立房間與 48 小時倒數計時器
    And 利用 WebSocket 建構即時聊天室與提供「歷史歌單快照」與「同步聆聽」功能
    And 處理 48 小時到期之阻擋功能與執行雙盲選擇表單(保留/結束)
    Then 到期後對話室即鎖定或轉為一般好友關係，且備有防守機制(封鎖/檢舉)
```

## Phase 4: 第三階段 - 音樂日誌與數據管理模組 (Music Log & Data)
```gherkin
Feature: 音樂時長採集與視覺化數據報表
  為了長期觀測音樂品味狀態
  系統必須分析資料並產生多維度圖表

  Scenario: 背景數據收集與報表產出
    Given 伺服器啟動定時資料探勘排程 (Cron Job)
    When 排程自動擷取使用者播放 Metadata
    And 分析引擎計算並支援切換多維度時間（日/週/月/季/年）的播放時長與常聽曲庫/曲風
    Then 系統前端可展示專屬「心智圖」等高質感視覺，並提供「一鍵加入交友歌單」或社群匯出分享功能
```

## Phase 5: 第四階段 - 測試、優化與發佈 (Testing & Deployment)
```gherkin
Feature: 發布準備與穩定性測試
  為了提供穩定的生產環境產品
  必須完善 API 測試並處理所有效能瓶頸

  Scenario: 確保專案安全發布
    Given 開發清單已抵達實作尾聲
    When 使用 BDD (behave) 與 Jest 進行測試並確認跨平台擷取穩定
    And 對即時通連線狀態與快取執行壓力測試
    And 完成 CI/CD 自動化與雙平台審查合規檢校
    Then 專案正式具備穩定且可靠的生產發佈條件
```
