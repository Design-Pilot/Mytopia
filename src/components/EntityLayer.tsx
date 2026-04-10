"use client";

import { extend } from "@pixi/react";
import { Container, Graphics, Sprite, type Texture } from "pixi.js";
import { useEffect, useMemo, useState } from "react";

import { footprintBounds } from "@/lib/footprintMath";
import { type IsoMathConfig } from "@/lib/isoMath";
import { getCachedTexture, loadTextureCached } from "@/lib/spriteCache";
import type { WorldEntity } from "@/types/world";

extend({ Container, Graphics, Sprite });

function placeholderColor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return 0x4a5568 + (h % 0x151515);
}

function drawPlaceholder(
  g: Graphics,
  w: number,
  h: number,
  color: number,
) {
  g.clear();
  g.roundRect(-w / 2, -h, w, h, 3).fill({ color, alpha: 0.88 });
  g.rect(-w / 2, -h, w, h).stroke({ width: 1, color: 0xffffff, alpha: 0.35 });
}

type EntitySpriteProps = {
  entity: WorldEntity;
  isoConfig: IsoMathConfig;
};

function EntitySprite({ entity, isoConfig }: EntitySpriteProps) {
  const fw = entity.footprintW ?? 1;
  const fh = entity.footprintH ?? 1;
  const bounds = useMemo(
    () => footprintBounds(isoConfig, entity.gridX, entity.gridY, fw, fh),
    [entity.gridX, entity.gridY, fh, fw, isoConfig],
  );

  const url = entity.spriteUrl;
  const [texture, setTexture] = useState<Texture | undefined>(
    () => (url ? getCachedTexture(url) : undefined),
  );

  useEffect(() => {
    if (!url) {
      return;
    }

    if (getCachedTexture(url)) {
      return;
    }

    let cancelled = false;
    void loadTextureCached(url)
      .then((tex) => {
        if (!cancelled) {
          setTexture(tex);
        }
      })
      .catch((error: unknown) => {
        console.warn("MyTopia: sprite failed to load", url, error);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  const ph = placeholderColor(entity._id);
  const placeholderHeight = Math.max(28, isoConfig.tileHeight * 1.45);
  const placeholderWidth = Math.min(
    bounds.targetWidth * 0.88,
    isoConfig.tileWidth * 2.5,
  );

  if (!texture) {
    return (
      <pixiContainer
        eventMode="none"
        x={bounds.anchorX}
        y={bounds.anchorY}
      >
        <pixiGraphics
          draw={(g) => drawPlaceholder(g, placeholderWidth, placeholderHeight, ph)}
        />
      </pixiContainer>
    );
  }

  const scale = bounds.targetWidth / Math.max(texture.width, 1);

  return (
    <pixiContainer
      eventMode="none"
      x={bounds.anchorX}
      y={bounds.anchorY}
    >
      <pixiSprite
        anchor={{ x: 0.5, y: 1 }}
        eventMode="none"
        scale={scale}
        texture={texture}
        x={0}
        y={0}
      />
    </pixiContainer>
  );
}

type EntityLayerProps = {
  entities: WorldEntity[];
  isoConfig: IsoMathConfig;
};

export function EntityLayer({ entities, isoConfig }: EntityLayerProps) {
  const sorted = useMemo(() => {
    const list = entities.filter(
      (e) => e.type === "building" || e.type === "decoration",
    );
    return [...list].sort(
      (a, b) => a.gridX + a.gridY - (b.gridX + b.gridY),
    );
  }, [entities]);

  return (
    <pixiContainer eventMode="none">
      {sorted.map((entity) => (
        <EntitySprite
          key={`${entity._id}:${entity.spriteUrl ?? ""}`}
          entity={entity}
          isoConfig={isoConfig}
        />
      ))}
    </pixiContainer>
  );
}
