/**
 * TIM Knowledge Layer — Read-only Graph Query Adapter
 * 
 * 唯讀圖查詢適配器。實作 ReadGraphQuery 介面，將現有的 MusicKnowledgeGraph 
 * 資料型別（小寫實體、特定關係）適配至 TIM Contracts v1（大寫型別、標準關係）。
 */

import { ReadGraphQuery } from "../contracts/v1/query";
import { EntityType, UnifiedEntity, IdentifierMap, Provenance } from "../contracts/v1/entity";
import { EdgeType, GraphEdge, Evidence, FactSource, Directness } from "../contracts/v1/graph";
import { MusicKnowledgeGraph } from "../../graph/graph";
import { Entity as GraphEntity } from "../../graph/entity";
import { Edge as GraphEdgeRaw, FactSource as GraphFactSource } from "../../graph/edge";

// ─────────────────────────────────────────────
// Type Mappers {型別映射器}
// ─────────────────────────────────────────────

function mapEntityType(type: string): EntityType {
  switch (type.toLowerCase()) {
    case "artist": return EntityType.ARTIST;
    case "producer": return EntityType.PRODUCER;
    case "album": return EntityType.ALBUM;
    case "song": return EntityType.SONG;
    case "label": return EntityType.LABEL;
    case "genre": return EntityType.GENRE;
    default: return EntityType.STUDIO; // 兜底對應
  }
}

function mapEdgeType(type: string): EdgeType {
  switch (type.toUpperCase()) {
    case "PRODUCED": return EdgeType.PRODUCED_BY;
    case "WROTE": return EdgeType.PRODUCED_BY;
    case "INFLUENCED": return EdgeType.INFLUENCED_BY;
    case "COLLABORATED_WITH": return EdgeType.COLLABORATED_WITH;
    case "SIGNED_TO": return EdgeType.BELONGS_TO;
    case "FEATURED": return EdgeType.BELONGS_TO;
    case "PERFORMED": return EdgeType.BELONGS_TO;
    default: return EdgeType.COLLABORATED_WITH;
  }
}

function mapFactSource(source: GraphFactSource): FactSource {
  switch (source) {
    case GraphFactSource.Credits: return FactSource.OFFICIAL_CREDITS;
    case GraphFactSource.OfficialWebsite: return FactSource.OFFICIAL_WEBSITE;
    case GraphFactSource.Wikipedia: return FactSource.WIKIPEDIA;
    case GraphFactSource.Discogs: return FactSource.DISCOGS;
    case GraphFactSource.Interview: return FactSource.INTERVIEW;
    case GraphFactSource.News: return FactSource.NEWS;
    default: return FactSource.COMMUNITY_WIKI;
  }
}

function adaptEntity(entity: GraphEntity): UnifiedEntity {
  const identifiers: IdentifierMap = {
    spotifyUri: entity.links?.spotify,
    mbid: undefined, // 預留
    discogsId: undefined,
  };

  const provenance: Provenance[] = [];
  if (entity.links?.wikipedia) {
    provenance.push({
      source: "Wikipedia",
      retrievedAt: new Date().toISOString().split("T")[0],
      url: entity.links.wikipedia
    });
  }

  return {
    id: entity.id,
    type: mapEntityType(entity.type),
    name: entity.name,
    identifiers,
    provenance,
    metadata: (entity.metadata ?? {}) as Record<string, unknown>
  };
}

function adaptEdge(edge: GraphEdgeRaw, index: number): GraphEdge {
  return {
    id: `edge_${index}_${edge.source}_${edge.target}`,
    sourceId: edge.source,
    targetId: edge.target,
    type: mapEdgeType(edge.type),
    confidence: edge.isTrivial ? 0.3 : 0.8 // 預設權重
  };
}

// ─────────────────────────────────────────────
// Adapter Class
// ─────────────────────────────────────────────

export class TIMGraphQueryAdapter implements ReadGraphQuery {
  constructor(private readonly graph: MusicKnowledgeGraph) {}

  findNode(id: string): UnifiedEntity | undefined {
    const node = this.graph.findEntity(id);
    return node ? adaptEntity(node) : undefined;
  }

  findNeighbors(id: string): readonly UnifiedEntity[] {
    const rawNeighbors = this.graph.neighbors(id);
    return rawNeighbors.map(n => adaptEntity(n.entity));
  }

  findEdges(entityId: string): readonly GraphEdge[] {
    const rawEdges = this.graph.getAllEdges();
    return rawEdges
      .filter(e => e.source === entityId || e.target === entityId)
      .map((e, idx) => adaptEdge(e, idx));
  }

  findByType(type: EntityType): readonly UnifiedEntity[] {
    const entities = this.graph.getAllEntities();
    return entities
      .filter(e => mapEntityType(e.type) === type)
      .map(adaptEntity);
  }

  findByIdentifier(platform: string, platformId: string): UnifiedEntity | undefined {
    // 1.0 MVC 中簡化以 Spotify ID 或普通 ID 匹配
    const node = this.graph.findEntity(platformId) || this.graph.findEntityByName(platformId);
    return node ? adaptEntity(node) : undefined;
  }

  findEvidence(edgeId: string): readonly Evidence[] {
    // 解析 edgeId 取出 source 與 target
    const parts = edgeId.split("_");
    if (parts.length < 4) return [];
    const source = parts[2];
    const target = parts[3];

    const rawEdges = this.graph.getAllEdges();
    const match = rawEdges.find(e => e.source === source && e.target === target);

    if (!match) return [];

    return match.evidences.flatMap(ev => {
      return ev.sources.map((src, srcIdx) => {
        return {
          id: `${ev.factId}_${srcIdx}`,
          edgeId,
          source: mapFactSource(src.type),
          directness: src.directness === "Primary" ? Directness.PRIMARY : Directness.SECONDARY,
          title: src.title,
          url: src.url,
          archive: src.archive ? {
            provider: src.archive.provider,
            url: src.archive.url,
            capturedAt: src.archive.capturedAt
          } : undefined
        };
      });
    });
  }

  /**
   * BFS 廣度優先最短路徑演算法實作
   */
  findShortestPath(sourceId: string, targetId: string): readonly GraphEdge[] {
    if (sourceId === targetId) return [];

    const queue: string[] = [sourceId];
    const visited = new Set<string>([sourceId]);
    const parentMap = new Map<string, { parent: string; edge: GraphEdgeRaw }>();

    let found = false;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === targetId) {
        found = true;
        break;
      }

      const neighbors = this.graph.neighbors(current);
      for (const neighbor of neighbors) {
        const nextId = neighbor.entity.id;
        if (!visited.has(nextId)) {
          visited.add(nextId);
          parentMap.set(nextId, { parent: current, edge: neighbor.edge });
          queue.push(nextId);
        }
      }
    }

    if (!found) return [];

    // 重構路徑
    const path: GraphEdge[] = [];
    let current = targetId;
    let idx = 0;

    while (current !== sourceId) {
      const step = parentMap.get(current);
      if (!step) break;

      path.unshift(adaptEdge(step.edge, idx++));
      current = step.parent;
    }

    return path;
  }
}
