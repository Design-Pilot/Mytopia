"use client";

import { animate } from "animejs";
import { extend } from "@pixi/react";
import {
  AnimatedSprite,
  ColorMatrixFilter,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Texture,
  type FederatedPointerEvent,
} from "pixi.js";
import { useEffect, useMemo, useRef, useState } from "react";

import { footprintBounds } from "@/lib/footprintMath";
import { tileToScreen, type IsoMathConfig } from "@/lib/isoMath";
import { getCachedTexture, loadTextureCached } from "@/lib/spriteCache";
import { sliceHorizontalSpriteStrip } from "@/lib/spriteSheetUtils";
import type { WorldEntity } from "@/types/world";

extend({ AnimatedSprite, Container, Graphics, Sprite });

function stableHash(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33 + input.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function placeholderColor(id: string): number {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }

  return 0x4a5568 + (hash % 0x151515);
}

function lightenColor(color: number, amount: number): number {
  const red = (color >> 16) & 0xff;
  const green = (color >> 8) & 0xff;
  const blue = color & 0xff;
  const blend = (channel: number) =>
    Math.round(channel + (255 - channel) * amount);

  return (blend(red) << 16) | (blend(green) << 8) | blend(blue);
}

function drawBuildingPlaceholder(
  graphics: Graphics,
  width: number,
  height: number,
  color: number,
) {
  graphics.clear();
  graphics.roundRect(-width / 2, -height, width, height, 3).fill({
    color,
    alpha: 0.88,
  });
  graphics.rect(-width / 2, -height, width, height).stroke({
    width: 1,
    color: 0xffffff,
    alpha: 0.35,
  });
}

function drawDecorationPlaceholder(
  graphics: Graphics,
  size: number,
  color: number,
) {
  graphics.clear();
  graphics.circle(0, -size * 0.55, size * 0.34).fill({
    color,
    alpha: 0.9,
  });
  graphics
    .poly(
      [
        0,
        -size,
        size * 0.45,
        -size * 0.45,
        0,
        0,
        -size * 0.45,
        -size * 0.45,
      ],
      true,
    )
    .fill({ color: lightenColor(color, 0.08), alpha: 0.88 })
    .stroke({ width: 1, color: 0xffffff, alpha: 0.28 });
}

function drawFootprintSelection(
  graphics: Graphics,
  isoConfig: IsoMathConfig,
  gridX: number,
  gridY: number,
  footprintW: number,
  footprintH: number,
  anchorX: number,
  anchorY: number,
) {
  graphics.clear();

  const halfWidth = isoConfig.tileWidth / 2;
  const halfHeight = isoConfig.tileHeight / 2;
  const width = Math.max(1, Math.floor(footprintW));
  const height = Math.max(1, Math.floor(footprintH));
  const cells: { gx: number; gy: number }[] = [];

  for (let x = gridX; x < gridX + width; x += 1) {
    for (let y = gridY; y < gridY + height; y += 1) {
      cells.push({ gx: x, gy: y });
    }
  }

  cells.sort((left, right) => {
    const leftDepth = left.gx + left.gy;
    const rightDepth = right.gx + right.gy;
    if (leftDepth !== rightDepth) {
      return leftDepth - rightDepth;
    }

    return left.gx - right.gx;
  });

  for (const cell of cells) {
    const center = tileToScreen(cell.gx, cell.gy, isoConfig);
    const x = center.screenX - anchorX;
    const y = center.screenY - anchorY;

    graphics
      .poly(
        [
          x,
          y - halfHeight,
          x + halfWidth,
          y,
          x,
          y + halfHeight,
          x - halfWidth,
          y,
        ],
        true,
      )
      .fill({ color: 0xf59e0b, alpha: 0.28 })
      .stroke({ width: 2, color: 0xf8d66d, alpha: 0.92 });
  }
}

function drawStreetlampGlow(graphics: Graphics) {
  graphics.clear();
  graphics.circle(0, -48, 18).fill({ color: 0xfde68a, alpha: 0.18 });
  graphics.circle(0, -48, 10).fill({ color: 0xfef3c7, alpha: 0.2 });
}

function isStreetlamp(entity: WorldEntity) {
  return entity.type === "decoration" && /lamp|lantern|light/i.test(entity.name);
}

function isSwayingDecoration(entity: WorldEntity) {
  return (
    entity.type === "decoration" &&
    /tree|bush|shrub|hedge|plant|vine|willow|pine/i.test(entity.name)
  );
}

type AnimatedEntityProps = {
  entity: WorldEntity;
  isoConfig: IsoMathConfig;
  isHovered: boolean;
  isInteractionDisabled: boolean;
  isSelected: boolean;
  onPointerEnter: (
    entityId: WorldEntity["_id"],
    event: FederatedPointerEvent,
  ) => void;
  onPointerLeave: (entityId: WorldEntity["_id"]) => void;
  onPointerMove: (
    entityId: WorldEntity["_id"],
    event: FederatedPointerEvent,
  ) => void;
  onPointerTap: (
    entityId: WorldEntity["_id"],
    event: FederatedPointerEvent,
  ) => void;
};

export function AnimatedEntity({
  entity,
  isoConfig,
  isHovered,
  isInteractionDisabled,
  isSelected,
  onPointerEnter,
  onPointerLeave,
  onPointerMove,
  onPointerTap,
}: AnimatedEntityProps) {
  const footprintWidth = entity.footprintW ?? 1;
  const footprintHeight = entity.footprintH ?? 1;
  const bounds = useMemo(
    () =>
      footprintBounds(
        isoConfig,
        entity.gridX,
        entity.gridY,
        footprintWidth,
        footprintHeight,
      ),
    [entity.gridX, entity.gridY, footprintHeight, footprintWidth, isoConfig],
  );

  const url = entity.spriteUrl;
  const cachedTexture = url ? getCachedTexture(url) : undefined;
  const [loadedTextureState, setLoadedTextureState] = useState<{
    texture: Texture;
    url: string;
  } | null>(null);

  useEffect(() => {
    if (!url || cachedTexture) {
      return;
    }

    let cancelled = false;

    void loadTextureCached(url)
      .then((loadedTexture) => {
        if (!cancelled) {
          setLoadedTextureState({
            texture: loadedTexture,
            url,
          });
        }
      })
      .catch((error: unknown) => {
        console.warn("MyTopia: sprite failed to load", url, error);
      });

    return () => {
      cancelled = true;
    };
  }, [cachedTexture, url]);

  const texture =
    cachedTexture ??
    (url && loadedTextureState?.url === url
      ? loadedTextureState.texture
      : undefined);

  const isInteractive = entity.type === "building";
  const visualScale = isHovered ? 1.05 : 1;
  const hoverFilter = useMemo(() => {
    const filter = new ColorMatrixFilter();
    filter.brightness(1.14, false);
    return filter;
  }, []);

  const animationFrames = Math.max(1, Math.floor(entity.animationFrames ?? 1));
  const frameTextures = useMemo(() => {
    if (!texture) {
      return [];
    }

    return sliceHorizontalSpriteStrip(texture, animationFrames);
  }, [animationFrames, texture]);

  const baseTexture = texture ?? Texture.EMPTY;
  const spriteTexture =
    frameTextures.length > 0 ? frameTextures[0] : baseTexture;
  const scale = bounds.targetWidth / Math.max(spriteTexture.width, 1);
  const placeholderBaseColor = placeholderColor(entity._id);
  const placeholderColorValue = isHovered
    ? lightenColor(placeholderBaseColor, 0.18)
    : placeholderBaseColor;
  const placeholderHeight = Math.max(
    entity.type === "decoration" ? 20 : 28,
    isoConfig.tileHeight * (entity.type === "decoration" ? 1 : 1.45),
  );
  const placeholderWidth = Math.min(
    bounds.targetWidth * (entity.type === "decoration" ? 0.7 : 0.88),
    isoConfig.tileWidth * (entity.type === "decoration" ? 1.5 : 2.5),
  );

  /* Plain Container has no containsPoint; without hitArea, static eventMode never receives hits. */
  const pointerHitArea = useMemo(() => {
    if (!isInteractive) {
      return undefined;
    }

    if (texture === undefined) {
      return new Rectangle(
        -placeholderWidth / 2,
        -placeholderHeight,
        placeholderWidth,
        placeholderHeight,
      );
    }

    const w = spriteTexture.width * scale;
    const h = spriteTexture.height * scale;

    return new Rectangle(-w / 2, -h, w, h);
  }, [
    isInteractive,
    placeholderHeight,
    placeholderWidth,
    scale,
    spriteTexture.height,
    spriteTexture.width,
    texture,
  ]);

  const containerProps = isInteractive
    ? {
        cursor: "pointer" as const,
        eventMode: "static" as const,
        hitArea: pointerHitArea,
        onPointerEnter: (event: FederatedPointerEvent) => {
          if (!isInteractionDisabled) {
            onPointerEnter(entity._id, event);
          }
        },
        onPointerLeave: () => {
          onPointerLeave(entity._id);
        },
        onPointerMove: (event: FederatedPointerEvent) => {
          if (!isInteractionDisabled) {
            onPointerMove(entity._id, event);
          }
        },
        onPointerTap: (event: FederatedPointerEvent) => {
          if (!isInteractionDisabled) {
            onPointerTap(entity._id, event);
          }
        },
      }
    : {
        eventMode: "none" as const,
      };
  const showAnimatedSprite = texture !== undefined && frameTextures.length > 1;
  const animatedSpriteRef = useRef<AnimatedSprite | null>(null);
  const visualContainerRef = useRef<Container | null>(null);
  const shouldSway = isSwayingDecoration(entity);

  useEffect(() => {
    const animatedSprite = animatedSpriteRef.current;

    if (!showAnimatedSprite || !animatedSprite) {
      return;
    }

    animatedSprite.gotoAndPlay(0);

    return () => {
      animatedSprite.stop();
    };
  }, [frameTextures, showAnimatedSprite]);

  useEffect(() => {
    const container = visualContainerRef.current;

    if (!shouldSway || !container) {
      return;
    }

    const swaySeed = stableHash(entity._id);
    const swayAmount = 0.02 + (swaySeed % 4) * 0.004;
    const swayAnimation = animate(container, {
      rotation: [-swayAmount, swayAmount],
      duration: 2200 + (swaySeed % 5) * 220,
      delay: swaySeed % 900,
      ease: "inOutSine",
      loop: true,
      alternate: true,
      autoplay: true,
    });

    return () => {
      swayAnimation.revert();
    };
  }, [entity._id, shouldSway]);

  return (
    <pixiContainer
      filters={isHovered ? [hoverFilter] : undefined}
      scale={{ x: visualScale, y: visualScale }}
      x={bounds.anchorX}
      y={bounds.anchorY}
      {...containerProps}
    >
      {isSelected ? (
        <pixiGraphics
          eventMode="none"
          draw={(graphics) =>
            drawFootprintSelection(
              graphics,
              isoConfig,
              entity.gridX,
              entity.gridY,
              footprintWidth,
              footprintHeight,
              bounds.anchorX,
              bounds.anchorY,
            )
          }
        />
      ) : null}

      <pixiContainer eventMode="none" ref={visualContainerRef}>
        {isStreetlamp(entity) ? (
          <pixiGraphics eventMode="none" draw={drawStreetlampGlow} />
        ) : null}

        {texture === undefined ? (
          <pixiGraphics
            eventMode="none"
            draw={(graphics) => {
              if (entity.type === "decoration") {
                drawDecorationPlaceholder(
                  graphics,
                  Math.max(placeholderWidth, placeholderHeight),
                  placeholderColorValue,
                );
                return;
              }

              drawBuildingPlaceholder(
                graphics,
                placeholderWidth,
                placeholderHeight,
                placeholderColorValue,
              );
            }}
          />
        ) : showAnimatedSprite ? (
          <pixiAnimatedSprite
            anchor={{ x: 0.5, y: 1 }}
            animationSpeed={entity.animationSpeed ?? 0.1}
            eventMode="none"
            loop
            ref={animatedSpriteRef}
            scale={scale}
            textures={frameTextures}
            tint={isHovered ? 0xf3fff1 : 0xffffff}
            x={0}
            y={0}
          />
        ) : (
          <pixiSprite
            anchor={{ x: 0.5, y: 1 }}
            eventMode="none"
            scale={scale}
            texture={spriteTexture}
            tint={isHovered ? 0xf3fff1 : 0xffffff}
            x={0}
            y={0}
          />
        )}
      </pixiContainer>
    </pixiContainer>
  );
}
