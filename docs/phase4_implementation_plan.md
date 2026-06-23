# Phase 4 音樂日誌與數據管理模組：實作計畫

此計畫將完成 Phase 4 後端的排程服務 (Cron Job) 以及數據聚合分析 API，以支援前端未來渲染「心智圖」與時間維度報表。

## 🔑 關鍵決策與確認事項
1. **Auth Scope 變更**：為取得用戶歷史播放紀錄，我們必須在 Spotify OAuth 中新增 `user-read-recently-played` 權限。這意味著**現有使用者下次登入時會被要求重新授權**。
2. **排程執行方式**：由於 Next.js 本身不適合長時間背景執行排程，將延續 `server/socket.ts` 的模式，建立獨立的 `server/cron.ts` Node 程序，並利用 `node-cron` 套件每小時執行同步。
3. **Spotify API 限制**：Spotify 的 Recently Played API 一次最多只能回傳 50 筆紀錄。每小時執行一次排程足以涵蓋大部分用戶的聽歌量。

## 🛠️ Proposed Changes (預計修改與新增檔案)

### 1. [套件安裝]
- 執行 `npm install node-cron` 與 `npm install -D @types/node-cron`
- 於 `package.json` 的 `scripts` 區塊補上 `"start:cron": "npx tsx server/cron.ts"`

### 2. [修改] NextAuth 配置 (auth.ts)
修改 `lib/auth.ts` 內的 SpotifyProvider，新增 `user-read-recently-played` scope。
- **目標檔案**：`apps/web/lib/auth.ts`

### 3. [新增] 背景同步排程服務 (Cron Job)
建立獨立的 Node 腳本，負責定期從 Spotify 抓取資料並存入 `SyncLog`。
- **目標檔案**：`apps/web/server/cron.ts`
- **邏輯設計**：使用 `node-cron` 設定兩個排程：
  1. **每小時執行 (Hourly Sync)**：輪詢所有具備 Spotify token 的 User，打 API 取得最近 50 筆播放紀錄，過濾掉已存在於 `SyncLog` 的資料，並寫入資料庫（同時同步 `Track` 表）。
  2. **每月結算 (Monthly Aggregation)**：在每月 1 號凌晨，將上個月的 `SyncLog` 聚合成 `UserMonthlyStat`，計算總時長與 Top Artists，隨後清除 30 天前的 `SyncLog` 以節省空間。

### 4. [新增] 數據分析聚合 API
提供給前端多時間維度（日/週/月/季/年）的數據查詢介面。
- **目標檔案**：`apps/web/app/api/stats/route.ts`
- **邏輯設計**：
  - 建立 `GET /api/stats?dimension=week` 等端點。
  - 根據傳入的 `dimension`，動態計算 Prisma 的日期範圍。
  - 對於「日/週/月」，直接從 `SyncLog` 計算即時的總聆聽時長與常聽曲庫（透過 Prisma `groupBy` 與 `count`）。
  - 對於「季/年」，則優先查詢已經壓縮好的 `UserMonthlyStat` 以確保查詢效能。

## ✅ Verification Plan (驗證計畫)

### 自動化測試 (Automated Tests)
- 手動觸發一次 `cron.ts` 內的同步函式，確認有正確打到 Spotify API，並且 `SyncLog` 成功寫入資料。

### 手動驗證 (Manual Verification)
- 呼叫 `/api/stats?dimension=week`，確認回傳資料符合預期的 JSON 結構，包含 `totalDurationMs` 與 `topTags/topArtists` 陣列。
