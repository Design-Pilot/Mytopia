import { tileToScreen, type IsoMathConfig } from "@/lib/isoMath";

export type FootprintBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  anchorX: number;
  anchorY: number;
  targetWidth: number;
};

/**
 * Screen-space bounds for a WxH tile footprint starting at (gridX, gridY),
 * plus bottom-center anchor and width for scaling sprites.
 */
export function footprintBounds(
  config: IsoMathConfig,
  gridX: number,
  gridY: number,
  footprintW: number,
  footprintH: number,
): FootprintBounds {
  const width = Math.max(1, Math.floor(footprintW));
  const height = Math.max(1, Math.floor(footprintH));
  const halfW = config.tileWidth / 2;
  const halfH = config.tileHeight / 2;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let x = gridX; x < gridX + width; x++) {
    for (let y = gridY; y < gridY + height; y++) {
      const c = tileToScreen(x, y, config);
      minX = Math.min(minX, c.screenX - halfW, c.screenX + halfW);
      maxX = Math.max(maxX, c.screenX - halfW, c.screenX + halfW);
      minY = Math.min(minY, c.screenY - halfH);
      maxY = Math.max(maxY, c.screenY + halfH);
    }
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    anchorX: (minX + maxX) / 2,
    anchorY: maxY,
    targetWidth: Math.max(8, maxX - minX),
  };
}
