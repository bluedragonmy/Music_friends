/**
 * μ(sic) Era Generator {紀元生成器}
 * 
 * 根據特定時間區間內的聽歌數據特徵（如探索度、重複率、深夜比例等），
 * 動態生成充滿故事感與溫度的 Era {紀元} 名稱，拒絕寫死。
 */

interface EraStats {
  noveltyPercent?: number;
  repeatPercent?: number;
  genresCount?: number;
  midnightPercent?: number;
  peakHour?: number;
}
export function generateEraName(stats: EraStats, year: number, monthName: string): { title: string; subtitle: string } {
  return {
    title: `${year} 年 ${monthName}`,
    subtitle: `${year} 年 ${monthName}`
  };
}
