// services/memory.ts
// Memory Foundation — a real, linked data model ready to grow into the
// Memory Graph. Entities (people, files, projects, exams, habits,
// appointments, ideas) are nodes; edges connect them so the system can
// reason about "how does this affect the rest of my life?" — not just store.
import type { EntityType } from './types';

export interface MemoryNode {
  id: string;
  type: EntityType | 'person' | 'project' | 'area' | 'file';
  label: string;
  createdAt: number;
  data?: Record<string, unknown>;
}

export interface MemoryEdge {
  from: string;
  to: string;
  relation: 'belongs_to' | 'relates_to' | 'blocks' | 'mentions' | 'scheduled_for';
}

class MemoryGraph {
  private nodes = new Map<string, MemoryNode>();
  private edges: MemoryEdge[] = [];

  addNode(node: MemoryNode) {
    this.nodes.set(node.id, node);
    return node;
  }
  link(from: string, to: string, relation: MemoryEdge['relation']) {
    this.edges.push({ from, to, relation });
  }
  neighbors(id: string): MemoryNode[] {
    return this.edges
      .filter((e) => e.from === id || e.to === id)
      .map((e) => this.nodes.get(e.from === id ? e.to : e.from))
      .filter((n): n is MemoryNode => !!n);
  }
  /** Natural-language-ish search across the user's own life (real entry point). */
  search(query: string): MemoryNode[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return [...this.nodes.values()].filter((n) => n.label.toLowerCase().includes(q));
  }
  all(): MemoryNode[] {
    return [...this.nodes.values()];
  }
}

export const memory = new MemoryGraph();
