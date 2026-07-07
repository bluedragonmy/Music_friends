export interface Entity {
  id: string;
  name: string;
  type: 'artist' | 'producer' | 'songwriter' | 'label' | 'genre';
  description?: string;
}

// 硬編碼的音樂實體資料庫，用於第一版 Demo 關聯
export const entities: Record<string, Entity> = {
  "charlie_puth": {
    id: "charlie_puth",
    name: "Charlie Puth",
    type: "artist",
    description: "美國流行歌手、創作歌手與音樂製作人，以其絕對音感與暢銷金曲聞名。"
  },
  "producer_250": {
    id: "producer_250",
    name: "250",
    type: "producer",
    description: "韓國獨立音樂製作人、DJ，因負責 NewJeans 絕大多數熱門單曲的製作而受到國際矚目。"
  },
  "newjeans": {
    id: "newjeans",
    name: "NewJeans",
    type: "artist",
    description: "韓國 ADOR 旗下的五人女子團體，音樂風格以 90 年代末至 2000 年代初的 R&B 與 Club Music 為主。"
  }
};
