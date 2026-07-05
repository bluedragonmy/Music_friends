# μ(sic) Behavior Catalog {行為目錄}

本文件定義 μ(sic) 的科學行為指標（Scientific Behaviors）。此階段僅定義指標規格與計算邏輯，並不進行程式碼實作。所有指標皆基於底層 Ingestion Pipeline {數據載入管道} 收集到的真實行為資料。

---

## 1. Novelty Index {原創性指數}

* **Purpose** {目的}：
  - 衡量使用者在給定期間內，探索「全新／首聽」音樂的積極程度。用以判定使用者是傾向於重複熟悉音樂，還是不斷開拓音樂邊界。
* **Input** {輸入}：
  - 給定時間範圍內（例如 7 天）的 `SyncLog` {同步日誌} 清單。
  - 使用者歷史上所有 `SyncLog` 的唯一 `TrackId` 集合。
* **Calculation** {計算方法}：
  ```python
  def calculate_novelty_index(target_logs, user_history_track_ids):
      # 找出在 target_logs 中播放，但在 target_logs 之前從未播放過的 Track 數量
      novel_tracks_count = 0
      unique_tracks_in_period = set(log.trackId for log in target_logs)
      
      for track_id in unique_tracks_in_period:
          if track_id not in user_history_track_ids_prior_to_period:
              novel_tracks_count += 1
              
      if len(unique_tracks_in_period) == 0:
          return 0
      return (novel_tracks_count / len(unique_tracks_in_period)) * 100
  ```
* **Output** {輸出}：
  - `0 ~ 100` 的浮點數。數值越高代表探索的新歌比例越高。
* **Confidence** {信賴度 / 可信度}：
  - 高。此指標為純粹的集合運算，只要資料庫的 `SyncLog` 記錄完整，計算結果即為 100% 準確的客觀事實。
* **Limitation** {限制 / 邊界條件}：
  - 對於剛加入平台的新使用者，由於缺乏長期歷史資料庫紀錄，首週播放的任何歌曲都會被判定為「新歌」（Novelty 趨近 100%）。需累積至少兩週以上的聽歌數據此指標才具備參考價值。
* **Future ML** {未來機器學習延伸}：
  - 引入 `Collaborative Filtering` {協同過濾} 或 `Content-based similarity` {基於內容的相似度}。即使使用者是第一次聽某首歌，若該歌曲與其常聽歌手高度相似，其 Novelty 權重會被降低；反之，若橫跨到完全不同的音樂板塊，則給予更高的 Novelty 分數。

---

## 2. Repeat Rate {重聽率}

* **Purpose** {目的}：
  - 衡量使用者對特定歌曲的「依賴度」或「循環播放傾向」。用以刻劃使用者是否容易對某些旋律產生強烈的單曲循環行為。
* **Input** {輸入}：
  - 給定時間範圍內的 `SyncLog` 清單。
* **Calculation** {計算方法}：
  ```python
  def calculate_repeat_rate(target_logs):
      total_plays = len(target_logs)
      if total_plays == 0:
          return 0
          
      # 計算每首歌的播放次數
      play_counts = {}
      for log in target_logs:
          play_counts[log.trackId] = play_counts.get(log.trackId, 0) + 1
          
      # 重複播放定義：播放次數 >= 3 次的 Track
      repeated_plays = sum(count for count in play_counts.values() if count >= 3)
      
      return (repeated_plays / total_plays) * 100
  ```
* **Output** {輸出}：
  - `0 ~ 100` 的浮點數。數值越高代表重聽、循環播放的比例越高。
* **Confidence** {信賴度 / 可信度}：
  - 高。完全依賴資料庫的播放計數，無黑盒子邏輯。
* **Limitation** {限制 / 邊界條件}：
  - 若觀察時間段太短（如單日數據），只要重聽一兩首歌，重聽率就會飆高。因此計算區間通常需以「週（7天）」或「月（30天）」為單位。
* **Future ML** {未來機器學習延伸}：
  - 使用序列分析（如馬可夫鏈）預測使用者「下一首重複播放同一首歌」的機率，進而計算其「情緒錨定指數」，評估音樂是否成為使用者的情感避難所。

---

## 3. Genre Diversity {曲風多樣性}

* **Purpose** {目的}：
  - 評估使用者聆聽音樂的範疇廣度。反映使用者是在單一音樂流派中深耕，還是橫跨多種迥異的音樂流派。
* **Input** {輸入}：
  - 給定時間範圍內的 `SyncLog` 清單（包含關聯的 `Track` 與 `Artist` 的 `genres` 欄位）。
* **Calculation** {計算方法}：
  - 使用資訊理論中的 **Shannon Entropy {香農商}** 來計算分布的混亂度：
  ```python
  import math

  def calculate_genre_diversity(target_logs):
      genre_counts = {}
      total_genres = 0
      
      for log in target_logs:
          if log.track.genres:
              genres = log.track.genres.split(", ")
              for g in genres:
                  genre_counts[g] = genre_counts.get(g, 0) + 1
                  total_genres += 1
                  
      if total_genres == 0:
          return 0
          
      entropy = 0.0
      for count in genre_counts.values():
          p = count / total_genres
          entropy -= p * math.log2(p)
          
      # 將 Entropy 映射至 0~100 區間 (假設最大可能 Entropy 為 5.0，約對應於均勻聆聽 32 種曲風)
      max_entropy = 5.0
      normalized_diversity = min((entropy / max_entropy) * 100, 100.0)
      return normalized_diversity
  ```
* **Output** {輸出}：
  - `0 ~ 100` 的浮點數。數值越高代表聆聽的曲風分布越廣泛且均勻。
* **Confidence** {信賴度 / 可信度}：
  - 中高。準確性取決於 Spotify API 提供給演出者（Artist）的曲風標籤品質。有些邊緣歌手可能缺乏標籤，此時會影響可信度。
* **Limitation** {限制 / 邊界條件}：
  - 由於一個 Artist 可能同時擁有多個曲風標籤（例如 "pop, rock, dance pop"），標籤重疊會導致曲風頻次膨脹。必須進行去重或權重均分。
* **Future ML** {未來機器學習延伸}：
  - 利用曲風特徵向量（Genre Embedding）計算流派之間的「語義距離」，而不僅是字面匹配。例如，同時聽「搖滾」與「重金屬」的多樣性分數，應低於同時聽「古典」與「嘻哈」的分數。

---

## 4. Peak Listening Time {巔峰聆聽時間}

* **Purpose** {目的}：
  - 尋找使用者一天之中與音樂連結最深的時刻，藉此推導其聆聽行為情境（例如工作專注、睡前放鬆、晨間通勤）。
* **Input** {輸入}：
  - 過去 30 天內所有 `SyncLog` 中的 `playedAt` 時間戳記。
* **Calculation** {計算方法}：
  ```python
  def calculate_peak_listening_time(target_logs):
      # 將 24 小時劃分為 24 個區間 (Hour bins)
      hourly_distribution = [0] * 24
      
      for log in target_logs:
          local_hour = log.playedAt.hour  # 轉換為使用者本地時區
          hourly_distribution[local_hour] += log.listenDurationMs
          
      # 找出累積時長最長的連續 2 小時窗口
      max_duration = 0
      peak_hour = 0
      
      for i in range(24):
          window_sum = hourly_distribution[i] + hourly_distribution[(i + 1) % 24]
          if window_sum > max_duration:
              max_duration = window_sum
              peak_hour = i
              
      return f"{peak_hour:02d}:00 ~ {(peak_hour+2)%24:02d}:00"
  ```
* **Output** {輸出}：
  - 時間區間字串（例如 `"23:00 ~ 01:00"`）。
* **Confidence** {信賴度 / 可信度}：
  - 高。時間戳記資料完全精確。
* **Limitation** {限制 / 邊界條件}：
  - Spotify API 記錄的 `played_at` 為 UTC 時間，系統必須精確轉換為使用者的本地時區，否則計算出的巔峰時間將產生偏差。
* **Future ML** {未來機器學習延伸}：
  - 藉由聚類算法（如 GMM 混合高斯模型）識別使用者一日之中的多個聽歌高峰期（Multi-modal peaks），並動態區分出使用者的生理時鐘類型（如極端的「晨型人」或「夜貓子」）。

---

## 5. Session Length {單次聆聽時長}

* **Purpose** {目的}：
  - 衡量使用者聆聽音樂的持續力。判斷使用者是用音樂做背景長時陪伴，還是片段、碎片化地聆聽。
* **Input** {輸入}：
  - 給定時間範圍內的 `SyncLog` 播放清單。
* **Calculation** {計算方法}：
  ```python
  def calculate_average_session_length(target_logs):
      if not target_logs:
          return 0
      
      # 依播放時間排序
      sorted_logs = sorted(target_logs, key=lambda x: x.playedAt)
      
      sessions = []
      current_session_start = sorted_logs[0].playedAt
      current_session_end = sorted_logs[0].playedAt + timedelta(milliseconds=sorted_logs[0].listenDurationMs)
      
      # 閾值設定為 30 分鐘 (1800 秒)
      SESSION_GAP_THRESHOLD = timedelta(minutes=30)
      
      for log in sorted_logs[1:]:
          log_start = log.playedAt
          # 若此次聽歌起點與上一次終點的間隔小於 30 分鐘，視為同一個 Session
          if log_start - current_session_end <= SESSION_GAP_THRESHOLD:
              current_session_end = log_start + timedelta(milliseconds=log.listenDurationMs)
          else:
              # 結算上一個 Session
              sessions.append((current_session_end - current_session_start).total_seconds() / 60)
              current_session_start = log_start
              current_session_end = log_start + timedelta(milliseconds=log.listenDurationMs)
              
      sessions.append((current_session_end - current_session_start).total_seconds() / 60)
      
      # 計算平均 Session 時長 (分鐘)
      return sum(sessions) / len(sessions)
  ```
* **Output** {輸出}：
  - 代表平均單次聆聽分鐘數的浮點數。
* **Confidence** {信賴度 / 可信度}：
  - 中高。取決於 Spotify API 資料同步的連續性，若有漏同步事件可能會截斷 Session。
* **Limitation** {限制 / 邊界條件}：
  - 當使用者將音樂掛機（如睡覺播放一整晚），單次聆聽時長會異常拉長，進而拉高平均值。演算法需加入最大合理 Session 上限（例如 4 小時）來剔除極端值。
* **Future ML** {未來機器學習延伸}：
  - 分析不同 Session 長度下的歌曲聲學特徵變化，建構「情境轉換分類器」，預測使用者何時從「主動聆聽」切換到「被動背景播放」。
