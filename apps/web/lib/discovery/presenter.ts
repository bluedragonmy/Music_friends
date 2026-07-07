import { Discovery } from "./discovery";

export interface FormattedDiscoveryView {
  id: string;
  cardTitle: string;
  visualizationPath: string[]; // ['Charlie Puth', '250', 'NewJeans']
  storySummary: string;
  sourcesList: string[];
  confidenceLevel: 'Low' | 'Medium' | 'High';
}

// 格式化輸出，不做任何 AI 虛構或額外描述
export function formatDiscoveryForUI(discovery: Discovery): FormattedDiscoveryView {
  return {
    id: discovery.id,
    cardTitle: `🎧 Today's Discovery: ${discovery.title}`,
    visualizationPath: discovery.path,
    storySummary: discovery.summary,
    sourcesList: discovery.sources,
    confidenceLevel: discovery.confidence
  };
}
