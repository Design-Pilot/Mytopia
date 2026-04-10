import type { Graphics } from "pixi.js";

import type { TileType } from "@/types/world";

/** Base fills per phase-04 spec (hex → packed RGB). */
export const TILE_BASE = {
  grass: 0x6ab348,
  water: 0x4a90d9,
  road: 0x7a7a7a,
} as const;

export function grassColorForTile(gridX: number, gridY: number): number {
  const seed = (gridX * 92837111) ^ (gridY * 689287499);
  const t = ((seed >>> 0) % 17) / 17;
  const base = TILE_BASE.grass;
  const r = ((base >> 16) & 0xff) + Math.round(t * 22 - 11);
  const g = ((base >> 8) & 0xff) + Math.round(t * 18 - 9);
  const b = (base & 0xff) + Math.round(t * 12 - 6);
  return (
    ((Math.min(255, Math.max(0, r)) & 0xff) << 16) |
    ((Math.min(255, Math.max(0, g)) & 0xff) << 8) |
    (Math.min(255, Math.max(0, b)) & 0xff)
  );
}

export function waterColorForTile(gridX: number, gridY: number): number {
  const seed = (gridX * 1315423911) ^ (gridY * 7654331);
  const t = ((seed >>> 0) % 11) / 11;
  const base = TILE_BASE.water;
  const r = ((base >> 16) & 0xff) + Math.round(t * 10 - 5);
  const g = ((base >> 8) & 0xff) + Math.round(t * 8 - 4);
  const b = (base & 0xff) + Math.round(t * 14 - 7);
  return (
    ((Math.min(255, Math.max(0, r)) & 0xff) << 16) |
    ((Math.min(255, Math.max(0, g)) & 0xff) << 8) |
    (Math.min(255, Math.max(0, b)) & 0xff)
  );
}

export function colorForTile(
  tileType: TileType,
  gridX: number,
  gridY: number,
): number {
  if (tileType === "grass") {
    return grassColorForTile(gridX, gridY);
  }
  if (tileType === "water") {
    return waterColorForTile(gridX, gridY);
  }
  return TILE_BASE.road;
}

/** Lighter grey for road lane stripe. */
export const ROAD_STRIPE = 0x9a9a9a;

export function grassAccentDots(
  g: Graphics,
  cx: number,
  cy: number,
  gridX: number,
  gridY: number,
): void {
  const seed = (gridX * 472882049) ^ (gridY * 982451653);
  for (let i = 0; i < 3; i++) {
    const s = ((seed >>> (i * 7)) % 1000) / 1000;
    const t = ((seed >>> (i * 11)) % 1000) / 1000;
    const ox = (s - 0.5) * 14;
    const oy = (t - 0.5) * 8;
    const darker = ((seed >>> (i * 3)) & 1) === 0;
    const dot = darker ? 0x3d6e2e : 0x8fd96a;
    g.circle(cx + ox, cy + oy, 1.2).fill({ color: dot, alpha: 0.55 });
  }
}
