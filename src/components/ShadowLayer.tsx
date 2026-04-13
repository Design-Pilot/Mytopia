"use client";

import { extend } from "@pixi/react";
import { Container, Graphics } from "pixi.js";
import { useMemo } from "react";

import { footprintBounds } from "@/lib/footprintMath";
import { type IsoMathConfig } from "@/lib/isoMath";
import type { WorldEntity } from "@/types/world";

extend({ Container, Graphics });

type ShadowLayerProps = {
  entities: WorldEntity[];
  isoConfig: IsoMathConfig;
};

const SHADOW_OFFSET_X = 8;
const SHADOW_OFFSET_Y = 4;

function shadowWidthForEntity(entity: WorldEntity, footprintWidth: number) {
  const footprintMultiplier = entity.type === "building" ? 0.72 : 0.52;
  return Math.max(14, footprintWidth * footprintMultiplier);
}

function drawShadow(
  graphics: Graphics,
  width: number,
  height: number,
  isDecoration: boolean,
) {
  graphics.clear();
  graphics.ellipse(0, 0, width / 2, height / 2).fill({
    color: 0x000000,
    alpha: isDecoration ? 0.14 : 0.2,
  });
}

export function ShadowLayer({ entities, isoConfig }: ShadowLayerProps) {
  const sorted = useMemo(() => {
    const list = entities.filter(
      (entity) => entity.type === "building" || entity.type === "decoration",
    );

    return [...list].sort((left, right) => {
      const leftDepth =
        left.gridX +
        left.gridY +
        (left.footprintW ?? 1) +
        (left.footprintH ?? 1) -
        2;
      const rightDepth =
        right.gridX +
        right.gridY +
        (right.footprintW ?? 1) +
        (right.footprintH ?? 1) -
        2;

      if (leftDepth !== rightDepth) {
        return leftDepth - rightDepth;
      }

      return String(left._id).localeCompare(String(right._id));
    });
  }, [entities]);

  return (
    <pixiContainer eventMode="none">
      {sorted.map((entity) => {
        const bounds = footprintBounds(
          isoConfig,
          entity.gridX,
          entity.gridY,
          entity.footprintW ?? 1,
          entity.footprintH ?? 1,
        );
        const shadowWidth = shadowWidthForEntity(entity, bounds.targetWidth);
        const shadowHeight = Math.max(8, shadowWidth * 0.34);

        return (
          <pixiContainer
            key={`shadow:${entity._id}`}
            eventMode="none"
            x={bounds.anchorX + SHADOW_OFFSET_X}
            y={bounds.anchorY + SHADOW_OFFSET_Y}
          >
            <pixiGraphics
              draw={(graphics) =>
                drawShadow(
                  graphics,
                  shadowWidth,
                  shadowHeight,
                  entity.type === "decoration",
                )
              }
              eventMode="none"
            />
          </pixiContainer>
        );
      })}
    </pixiContainer>
  );
}
