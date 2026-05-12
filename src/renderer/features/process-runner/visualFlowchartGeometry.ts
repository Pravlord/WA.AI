import type { FlowchartCornerPort } from "../../../shared/processRunner";

export const FLOWCHART_BLOCK_WIDTH = 220;
export const FLOWCHART_BLOCK_HEIGHT = 104;
export const FLOWCHART_STACK_GAP = 52;
export const FLOWCHART_SURFACE_MIN_W = 2800;
export const FLOWCHART_SURFACE_MIN_H = 2000;

export function anchorPoint(
  left: number,
  top: number,
  port: FlowchartCornerPort
): { x: number; y: number } {
  switch (port) {
    case "tl":
      return { x: left, y: top };
    case "tr":
      return { x: left + FLOWCHART_BLOCK_WIDTH, y: top };
    case "bl":
      return { x: left, y: top + FLOWCHART_BLOCK_HEIGHT };
    case "br":
      return { x: left + FLOWCHART_BLOCK_WIDTH, y: top + FLOWCHART_BLOCK_HEIGHT };
  }
}

export function defaultRootPosition(): { x: number; y: number } {
  return {
    x: FLOWCHART_SURFACE_MIN_W / 2 - FLOWCHART_BLOCK_WIDTH / 2,
    y: 160
  };
}

export function computeSurfaceSize(
  stepIds: string[],
  positions: Record<string, { x: number; y: number } | undefined>
): { width: number; height: number } {
  let width = FLOWCHART_SURFACE_MIN_W;
  let height = FLOWCHART_SURFACE_MIN_H;
  const pad = 160;

  for (const id of stepIds) {
    const p = positions[id];
    if (!p) {
      continue;
    }
    width = Math.max(width, p.x + FLOWCHART_BLOCK_WIDTH + pad);
    height = Math.max(height, p.y + FLOWCHART_BLOCK_HEIGHT + pad);
  }

  return { width, height };
}

export function elbowPath(x1: number, y1: number, x2: number, y2: number): string {
  const midY = (y1 + y2) / 2;
  return `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
}

export function nextStackedChildPosition(
  parentId: string,
  edges: Array<{ source: string; target: string }>,
  positions: Record<string, { x: number; y: number } | undefined>
): { x: number; y: number } | null {
  const parentPos = positions[parentId];
  if (!parentPos) {
    return null;
  }

  const childIds = edges.filter((edge) => edge.source === parentId).map((edge) => edge.target);
  let nextY = parentPos.y + FLOWCHART_BLOCK_HEIGHT + FLOWCHART_STACK_GAP;

  for (const childId of childIds) {
    const childPos = positions[childId];
    if (childPos) {
      nextY = Math.max(nextY, childPos.y + FLOWCHART_BLOCK_HEIGHT + FLOWCHART_STACK_GAP);
    }
  }

  return { x: parentPos.x, y: nextY };
}
