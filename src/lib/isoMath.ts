/**
 * 2:1 isometric projection (diamond tiles). Used by the viewer and editor for
 * grid ↔ screen conversion.
 */

/** Tile footprint in screen/world pixels (diamond width × height). */
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

/** Grid size in tiles (Phase 2 demo map). */
export const GRID_WIDTH = 10;
export const GRID_HEIGHT = 10;

export type IsoMathConfig = {
  /** Pixel width of one tile along the X axis in screen space (full tile width). */
  tileWidth: number;
  /** Pixel height of one tile along the Y axis in screen space (full tile height). */
  tileHeight: number;
  /** Screen-space origin where grid (0,0) maps to. */
  originX: number;
  originY: number;
};

export type ScreenPoint = {
  screenX: number;
  screenY: number;
};

export type TilePoint = {
  gridX: number;
  gridY: number;
};

export type CreateIsoConfigOptions = {
  gridHeight?: number;
  tileWidth?: number;
  tileHeight?: number;
};

/**
 * Converts integer tile coordinates to screen pixels (center of the tile diamond).
 */
export function tileToScreen(
  gridX: number,
  gridY: number,
  config: IsoMathConfig,
): ScreenPoint {
  const { tileWidth, tileHeight, originX, originY } = config;
  const halfW = tileWidth / 2;
  const halfH = tileHeight / 2;
  return {
    screenX: (gridX - gridY) * halfW + originX,
    screenY: (gridX + gridY) * halfH + originY,
  };
}

/**
 * Inverse of tileToScreen: screen pixels → fractional tile coordinates.
 */
export function screenToTile(
  screenX: number,
  screenY: number,
  config: IsoMathConfig,
): TilePoint {
  const { tileWidth, tileHeight, originX, originY } = config;
  const halfW = tileWidth / 2;
  const halfH = tileHeight / 2;
  const x = screenX - originX;
  const y = screenY - originY;
  const gridX = x / (2 * halfW) + y / (2 * halfH);
  const gridY = y / (2 * halfH) - x / (2 * halfW);
  return { gridX, gridY };
}

/**
 * Phase 2 layout: offset so the diamond island sits predictably in world space.
 * See `phases/phase-02-isometric-grid-camera.md`.
 */
export function createDefaultIsoConfig(
  options: CreateIsoConfigOptions = {},
): IsoMathConfig {
  const gridHeight = options.gridHeight ?? GRID_HEIGHT;
  const tileWidth = options.tileWidth ?? TILE_WIDTH;
  const tileHeight = options.tileHeight ?? TILE_HEIGHT;
  const originX = gridHeight * (tileWidth / 2);
  const originY = tileHeight;
  return {
    tileWidth,
    tileHeight,
    originX,
    originY,
  };
}

/**
 * Center of the axis-aligned bounding box of all tile centers (integer grid).
 */
export function getGridWorldCenter(
  config: IsoMathConfig,
  gridWidth: number,
  gridHeight: number,
): ScreenPoint {
  const halfW = config.tileWidth / 2;
  const halfH = config.tileHeight / 2;
  const cx =
    config.originX +
    (((gridWidth - 1) - (gridHeight - 1)) * halfW) / 2;
  const cy =
    config.originY +
    (((gridWidth - 1) + (gridHeight - 1)) * halfH) / 2;
  return { screenX: cx, screenY: cy };
}

/** Deterministic grass tint per tile for subtle variation. */
export function grassColorForTile(gridX: number, gridY: number): number {
  const seed = (gridX * 92837111) ^ (gridY * 689287499);
  const t = ((seed >>> 0) % 17) / 17;
  const base = 0x4a7c59;
  const r = ((base >> 16) & 0xff) + Math.round(t * 18 - 9);
  const g = ((base >> 8) & 0xff) + Math.round(t * 14 - 7);
  const b = (base & 0xff) + Math.round(t * 10 - 5);
  return (
    ((Math.min(255, Math.max(0, r)) & 0xff) << 16) |
    ((Math.min(255, Math.max(0, g)) & 0xff) << 8) |
    (Math.min(255, Math.max(0, b)) & 0xff)
  );
}
