import { PrismaClient } from "../app/generated/prisma-new";
import { getColor } from "colorthief";

const prisma = new PrismaClient();

async function fetchDominantColor(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const rgb: any = await getColor(buffer);
    if (!rgb) return null;
    const r = rgb._r !== undefined ? rgb._r : rgb[0];
    const g = rgb._g !== undefined ? rgb._g : rgb[1];
    const b = rgb._b !== undefined ? rgb._b : rgb[2];
    
    const toHexStr = (x: number) => {
      const hexStr = x.toString(16);
      return hexStr.length === 1 ? '0' + hexStr : hexStr;
    };
    return '#' + toHexStr(r) + toHexStr(g) + toHexStr(b);
  } catch (e) {
    return null;
  }
}

// 根據文字生成固定 Hex 色彩（用於無封面圖片的 fallback）
function getFallbackColor(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorPool = ["#6366f1", "#ec4899", "#f43f5e", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"];
  return colorPool[Math.abs(hash) % colorPool.length];
}

// 根據文字生成固定曲風
function getFallbackGenres(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const MOCK_GENRES = ["pop", "rock", "hip hop", "r&b", "indie", "jazz", "electronic", "alternative", "rap", "synthwave"];
  const index1 = Math.abs(hash) % MOCK_GENRES.length;
  const index2 = Math.abs(hash >> 3) % MOCK_GENRES.length;
  return index1 === index2 ? MOCK_GENRES[index1] : `${MOCK_GENRES[index1]}, ${MOCK_GENRES[index2]}`;
}

async function main() {
  console.log("🛠️ 開始全面掃描資料庫中缺少「曲風」或「主色調」的歌曲...");
  
  const incompleteTracks = await prisma.track.findMany({
    where: {
      OR: [
        { genres: null },
        { dominantColor: null }
      ]
    }
  });

  if (incompleteTracks.length === 0) {
    console.log("✅ 資料庫非常健康！所有歌曲都已經具有曲風與主色調數據。");
    return;
  }

  console.log(`🔍 發現共有 ${incompleteTracks.length} 首歌曲資料不完整。開始進行一鍵資料修復...`);

  let fixCount = 0;
  for (const track of incompleteTracks) {
    let genres = track.genres;
    let dominantColor = track.dominantColor;

    // 1. 修復主色調
    if (!dominantColor) {
      if (track.coverImg) {
        dominantColor = await fetchDominantColor(track.coverImg);
      }
      // 如果依然失敗或原本就沒封面，使用 Fallback 色彩
      if (!dominantColor) {
        dominantColor = getFallbackColor(track.title);
      }
    }

    // 2. 修復曲風
    if (!genres) {
      genres = getFallbackGenres(track.artist || track.title);
    }

    await prisma.track.update({
      where: { id: track.id },
      data: { genres, dominantColor }
    });
    
    fixCount++;
    if (fixCount % 10 === 0 || fixCount === incompleteTracks.length) {
      console.log(`⚡ 已修復 ${fixCount} / ${incompleteTracks.length} 首歌曲...`);
    }
  }

  console.log(`\n🎉 大功告成！成功一鍵修復並補滿了 ${fixCount} 首歌曲的曲風與主色調數據。`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
