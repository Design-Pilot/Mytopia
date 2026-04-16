"use client";

import type { Graphics } from "pixi.js";
import { useCallback } from "react";

import { tileToScreen, type IsoMathConfig } from "@/lib/isoMath";
import {
  ROAD_STRIPE,
  colorForTile,
  grassAccentDots,
} from "@/lib/tileColors";
import type { TileGrid, TileType } from "@/types/world";

type TileLayerProps = {
  gridWidth: number;
  gridHeight: number;
  isoConfig: IsoMathConfig;
  tileGrid: TileGrid;
  defaultTile: TileType;
};

function drawDiamond(
  g: Graphics,
  cx: number,
  cy: number,
  halfW: number,
  halfH: number,
) {
  g.poly(
    [
      cx,
      cy - halfH,
      cx + halfW,
      cy,
      cx,
      cy + halfH,
      cx - halfW,
      cy,
    ],
    true,
  );
}

export function TileLayer({
  gridWidth,
  gridHeight,
  isoConfig,
  tileGrid,
  defaultTile,
}: TileLayerProps) {
  const halfW = isoConfig.tileWidth / 2;
  const halfH = isoConfig.tileHeight / 2;

  const drawTiles = useCallback(
    (g: Graphics) => {
      g.clear();
      const maxSum = gridWidth - 1 + gridHeight - 1;
      for (let sum = 0; sum <= maxSum; sum++) {
        for (let gx = 0; gx < gridWidth; gx++) {
          const gy = sum - gx;
          if (gy < 0 || gy >= gridHeight) {
            continue;
          }

          const c = tileToScreen(gx, gy, isoConfig);
          const tileType = tileGrid[gy]?.[gx] ?? defaultTile;
          const color = colorForTile(tileType, gx, gy);

          drawDiamond(g, c.screenX, c.screenY, halfW, halfH);
          if (tileType === "water") {
            g.fill({ color, alpha: 0.88 });
          } else {
            g.fill({ color });
          }

          if (tileType === "grass") {
            grassAccentDots(g, c.screenX, c.screenY, gx, gy);
          }

          if (tileType === "road") {
            g.moveTo(c.screenX, c.screenY - halfH + 2)
              .lineTo(c.screenX, c.screenY + halfH - 2)
              .stroke({ width: 1.25, color: ROAD_STRIPE, alpha: 0.55 });
          }
        }
      }
    },
    [defaultTile, gridHeight, gridWidth, halfH, halfW, isoConfig, tileGrid],
  );

  /* Non-interactive: tiles are under entities; hits should reach buildings or the backdrop. */
  return <pixiGraphics draw={drawTiles} eventMode="none" />;
}
