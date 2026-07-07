const fs = require('fs');
const path = require('path');

// ANSI Terminal color escape codes for beautiful output
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const CYAN = "\x1b[36m";

function printUsage() {
  console.log(`${BOLD}μ(sic) Session Replay Tool {使用者節奏重播工具}${RESET}`);
  console.log(`用法: node research/session_replay.js <ParticipantID>`);
  console.log(`範例: node research/session_replay.js P01`);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  printUsage();
}

const participantId = args[0];

const candidatePaths = [
  path.join(__dirname, 'participants', participantId, 'timeline.json'),
  path.join(__dirname, 'participants', `${participantId}.json`),
  path.join(__dirname, 'examples', participantId, 'timeline.json'),
  path.join(__dirname, 'examples', `${participantId}.json`)
];

let filePath = null;
for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    filePath = p;
    break;
  }
}

if (!filePath) {
  console.error(`${RED}${BOLD}錯誤: 找不到受測者或範例的時間軸檔案 ${participantId}${RESET}`);
  console.error(`搜尋路徑:`);
  candidatePaths.forEach(p => console.error(` - ${p}`));
  process.exit(1);
}

try {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const events = JSON.parse(fileContent);

  console.log(`\n${BOLD}================================================================${RESET}`);
  console.log(`  ${CYAN}${BOLD}Session Replay for Participant: ${participantId}${RESET}`);
  console.log(`  ${YELLOW}${BOLD}Reminder: Replay is for observation, not evaluation.${RESET}`);
  console.log(`  ${DIM}(重播旨在觀摩，而非評判。停頓可能是深思，也可能是困惑。)${RESET}`);
  console.log(`${BOLD}================================================================${RESET}\n`);

  let totalDuration = 0;
  let totalPauseTime = 0;
  let totalActiveTime = 0;

  events.forEach((event, index) => {
    const timeStr = event.time;
    const action = event.action.toUpperCase();
    const duration = event.duration || 1;
    const details = event.details || "";

    totalDuration += duration;
    let visualBar = "";
    let actionColor = RESET;

    const isPause = action === "PAUSE" || action === "REREAD";

    if (isPause) {
      totalPauseTime += duration;
      // 停頓以點表示 (Thinking pace)
      visualBar = `${YELLOW}${".".repeat(duration)}${RESET}`;
      actionColor = YELLOW;
    } else {
      totalActiveTime += duration;
      // 活躍操作以方塊表示 (Active action)
      visualBar = `${GREEN}${"█".repeat(duration)}${RESET}`;
      actionColor = GREEN;
    }

    // 格式化時間軸列
    const stepNum = String(index + 1).padStart(2, '0');
    console.log(
      `${DIM}[${stepNum}] ${timeStr}${RESET} ` +
      `${actionColor}${BOLD}${action.padEnd(8)}${RESET} ` +
      `(${String(duration).padStart(2)}s) ` +
      `${visualBar.padEnd(30)} ` +
      `| ${details}`
    );
  });

  // 計算停頓與活躍的比例
  const pausePercent = Math.round((totalPauseTime / totalDuration) * 100);
  const activePercent = Math.round((totalActiveTime / totalDuration) * 100);

  console.log(`\n${BOLD}----------------------------------------------------------------${RESET}`);
  console.log(`${BOLD}研究摘要 (Session Summary):${RESET}`);
  console.log(`- 總分析時長 (Total Logged Duration): ${BOLD}${totalDuration} 秒${RESET}`);
  console.log(`- ${YELLOW}${BOLD}思索停頓時間 (Pause / Reread): ${totalPauseTime} 秒 (${pausePercent}%)${RESET}  ${YELLOW}${".".repeat(Math.round(totalPauseTime / 2))}${RESET}`);
  console.log(`- ${GREEN}${BOLD}活躍操作時間 (Active Actions):  ${totalActiveTime} 秒 (${activePercent}%)${RESET}  ${GREEN}${"█".repeat(Math.round(totalActiveTime / 2))}${RESET}`);
  
  console.log(`\n${BOLD}核心洞察引導 (Observation Prompts):${RESET}`);
  console.log(`1. 關注所有 ${YELLOW}黃色點點 (...) ${RESET}大於 10 秒的區塊。受測者在此停頓代表文案留下了重量，或是介面產生了困惑。`);
  console.log(`2. 關注受測者離開 (${RED}LEAVE${RESET}) 前的最後三個步驟，這是他們「放棄並停止」的關鍵時刻。`);
  console.log(`${BOLD}================================================================${RESET}\n`);

} catch (err) {
  console.error(`${RED}解析 JSON 檔案時發生錯誤: ${err.message}${RESET}`);
  process.exit(1);
}
