import { Entity } from "./entity";

export interface Edge {
  sourceId: string;
  targetId: string;
  type: 'producer_of' | 'songwriter_for' | 'sent_demo_to' | 'collaborator_with';
  description: string;
}

export interface DiscoveryGraph {
  nodes: Record<string, Entity>;
  edges: Edge[];
}

// 硬編碼的關係圖譜
export const graph: DiscoveryGraph = {
  nodes: {
    "charlie_puth": {
      id: "charlie_puth",
      name: "Charlie Puth",
      type: "artist"
    },
    "producer_250": {
      id: "producer_250",
      name: "250",
      type: "producer"
    },
    "newjeans": {
      id: "newjeans",
      name: "NewJeans",
      type: "artist"
    }
  },
  edges: [
    {
      sourceId: "charlie_puth",
      targetId: "producer_250",
      type: "sent_demo_to",
      description: "Charlie Puth 曾主動將自己的 Demo 音樂作品寄給製作人 250，表達合作意願。"
    },
    {
      sourceId: "producer_250",
      targetId: "newjeans",
      type: "producer_of",
      description: "250 是 NewJeans 的總製作人與主要編曲人，打造了《Attention》、《Hype Boy》、《Ditto》等熱門金曲。"
    }
  ]
};
