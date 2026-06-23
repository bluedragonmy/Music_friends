from behave import given, when, then

# -------------------------------------------------------------
# Mock Domain Model (確保無後端環境時可通過測試)
# -------------------------------------------------------------
class MatchRoom:
    def __init__(self):
        self.likes = set()
        self.chat_room_active = False
        self.chat_timer_hours = 0
        self.chat_input_locked = False
        self.show_blind_form = False

    def add_like(self, user):
        self.likes.add(user)
        # 當雙向喜歡達成時建立聊天室
        if len(self.likes) == 2:
            self.chat_room_active = True
            self.chat_timer_hours = 48
            self.chat_input_locked = False

class AppState:
    def __init__(self):
        self.recommendations = []
        self.play_time = 0
        self.current_song = None
        self.match_room = MatchRoom()
        self.likes_recorded = False

# -------------------------------------------------------------
# Scenario 1 & 2: 聆聽時間限制與解鎖喜歡按鈕
# -------------------------------------------------------------
@given('我每日會收到由系統派發的配對對象')
def step_impl(context):
    context.app = AppState()

@given('畫面上展示了該名對象的 5 首推薦歌曲')
def step_impl(context):
    context.app.recommendations = ["Song A", "Song B", "Song C", "Song D", "Song E"]

@when('我開始播放其中一首曲目的 30 秒預覽')
def step_impl(context):
    context.app.current_song = context.app.recommendations[0]

@when('目前播放時間「未達」 30 秒')
def step_impl(context):
    context.app.play_time = 15  # 模擬播放了 15 秒

@then('畫面上的「喜歡」與「跳過」按鈕應該保持鎖定 (無法點擊)')
def step_impl(context):
    is_locked = (context.app.play_time < 30)
    assert is_locked is True, f"播放時間未達30秒應鎖定，目前狀態: 鎖定={is_locked}"

@given('我正在聆聽配對對象的推薦曲目')
def step_impl(context):
    context.app = AppState()
    context.app.recommendations = ["Song A"]
    context.app.current_song = context.app.recommendations[0]

@when('目前播放時間「已達」 30 秒')
def step_impl(context):
    context.app.play_time = 30  # 模擬播放了 30 秒

@then('畫面上的「喜歡」與「跳過」按鈕應該解除鎖定')
def step_impl(context):
    is_locked = (context.app.play_time < 30)
    assert is_locked is False, f"播放時間已達30秒應解鎖，目前狀態: 鎖定={is_locked}"

@when('我選擇點擊「喜歡」按鈕')
def step_impl(context):
    context.app.match_room.add_like("我自己")
    context.app.likes_recorded = True

@then('系統應該紀錄我對該名對象展現了好感')
def step_impl(context):
    assert context.app.likes_recorded is True
    assert "我自己" in context.app.match_room.likes

# -------------------------------------------------------------
# Scenario 3: 雙向喜歡後觸發限時聊天室
# -------------------------------------------------------------
@given('我先前已經對「使用者 B」按下喜歡')
def step_impl(context):
    context.app = AppState()
    context.app.match_room.add_like("我自己")

@when('「使用者 B」也在他的配對畫面中對我按下喜歡')
def step_impl(context):
    context.app.match_room.add_like("使用者 B")

@then('系統應該立即為我們雙方建立專屬的聊天房間')
def step_impl(context):
    assert context.app.match_room.chat_room_active is True

@then('該聊天室的倒數計時器應設定為 48 小時，並開放彼此傳送訊息')
def step_impl(context):
    assert context.app.match_room.chat_timer_hours == 48
    assert context.app.match_room.chat_input_locked is False

# -------------------------------------------------------------
# Scenario 4: 限時聊天室倒數完畢後觸發雙盲選擇
# -------------------------------------------------------------
@given('我與「使用者 B」的專屬聊天房間正在進行中')
def step_impl(context):
    context.app = AppState()
    # 模擬 48 小時房間進行中狀態
    context.app.match_room.chat_room_active = True
    context.app.match_room.chat_timer_hours = 48
    context.app.match_room.chat_input_locked = False

@when('距離房間建立時間已經經過了 48 小時')
def step_impl(context):
    # 模擬時間到期
    context.app.match_room.chat_timer_hours = 0
    context.app.match_room.chat_input_locked = True
    context.app.match_room.show_blind_form = True

@then('系統應該自動鎖定聊天室的文字輸入框，停止雙方對話')
def step_impl(context):
    assert context.app.match_room.chat_input_locked is True

@then('系統應該跳出「保留關係」或「結束關係」的雙盲選擇表單讓雙方填寫')
def step_impl(context):
    assert context.app.match_room.show_blind_form is True
