import type { FlowchartCornerPort } from "../../../shared/processRunner";

export const FLOWCHART_BLOCK_WIDTH = 220;
export const FLOWCHART_BLOCK_HEIGHT = 104;
export const FLOWCHART_STACK_GAP = 52;
export const FLOWCHART_SURFACE_MIN_W = 2800;
export const FLOWCHART_SURFACE_MIN_H = 2000;

/** Clamp for Ctrl/trackpad zoom and auto “fit to view”. */
export const FLOWCHART_VIEW_MIN_SCALE = 0.15;
export const FLOWCHART_VIEW_MAX_SCALE = 2.5;

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

/** Tight axis-aligned bounds of all blocks in flowchart space, or null if none. */
export function computeBlocksBounds(
  stepIds: string[],
  positions: Record<string, { x: number; y: number } | undefined>
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const id of stepIds) {
    const p = positions[id];
    if (!p) {
      continue;
    }
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x + FLOWCHART_BLOCK_WIDTH);
    maxY = Math.max(maxY, p.y + FLOWCHART_BLOCK_HEIGHT);
  }

  if (!Number.isFinite(minX)) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

/** Scroll position and scale so `bounds` (flowchart px) is centered in the scroll viewport. */
export function computeFitViewport(
  viewportWidth: number,
  viewportHeight: number,
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  surfaceSize: { width: number; height: number },
  padding: number
): { scale: number; scrollLeft: number; scrollTop: number } {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return { scale: 1, scrollLeft: 0, scrollTop: 0 };
  }

  const bw = bounds.maxX - bounds.minX + padding * 2;
  const bh = bounds.maxY - bounds.minY + padding * 2;
  if (bw <= 0 || bh <= 0) {
    return { scale: 1, scrollLeft: 0, scrollTop: 0 };
  }

  let scale = Math.min(viewportWidth / bw, viewportHeight / bh);
  scale = Math.max(FLOWCHART_VIEW_MIN_SCALE, Math.min(FLOWCHART_VIEW_MAX_SCALE, scale));

  const cx = ((bounds.minX + bounds.maxX) / 2) * scale;
  const cy = ((bounds.minY + bounds.maxY) / 2) * scale;
  let scrollLeft = cx - viewportWidth / 2;
  let scrollTop = cy - viewportHeight / 2;

  const maxSL = Math.max(0, surfaceSize.width * scale - viewportWidth);
  const maxST = Math.max(0, surfaceSize.height * scale - viewportHeight);
  scrollLeft = Math.min(maxSL, Math.max(0, scrollLeft));
  scrollTop = Math.min(maxST, Math.max(0, scrollTop));

  return { scale, scrollLeft, scrollTop };
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
