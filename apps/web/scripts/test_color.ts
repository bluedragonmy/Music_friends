import { getColor } from 'colorthief';

async function test() {
  try {
    const url = 'https://picsum.photos/200'; // 隨便一個可用圖片
    console.log('正在下載圖片...');
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`無法下載圖片: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('正在嘗試取得顏色...');
    const rgb: any = await getColor(buffer);
    console.log('RGB:', rgb);
    console.log('Keys:', Object.keys(rgb));
    
    // 嘗試取得 rgb.r 或是 rgb._r 或是 rgb[0]
    const r = rgb.r !== undefined ? rgb.r : (rgb._r !== undefined ? rgb._r : rgb[0]);
    const g = rgb.g !== undefined ? rgb.g : (rgb._g !== undefined ? rgb._g : rgb[1]);
    const b = rgb.b !== undefined ? rgb.b : (rgb._b !== undefined ? rgb._b : rgb[2]);
    console.log('R:', r, 'G:', g, 'B:', b);

    // 轉 Hex
    const toHexStr = (x: number) => {
      const hexStr = x.toString(16);
      return hexStr.length === 1 ? '0' + hexStr : hexStr;
    };
    const hex = '#' + toHexStr(r) + toHexStr(g) + toHexStr(b);
    console.log('Hex:', hex);
  } catch (err) {
    console.error('出錯了:', err);
  }
}

test();
