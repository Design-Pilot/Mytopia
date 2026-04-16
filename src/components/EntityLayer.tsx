"use client";

import { extend } from "@pixi/react";
import { Container, type FederatedPointerEvent } from "pixi.js";
import { useMemo } from "react";

import { AnimatedEntity } from "@/components/AnimatedEntity";
import { type IsoMathConfig } from "@/lib/isoMath";
import type { WorldEntity } from "@/types/world";

extend({ Container });

type EntityLayerProps = {
  entities: WorldEntity[];
  hoveredEntityId: WorldEntity["_id"] | null;
  isoConfig: IsoMathConfig;
  isInteractionDisabled: boolean;
  onEntityPointerEnter: (
    entityId: WorldEntity["_id"],
    event: FederatedPointerEvent,
  ) => void;
  onEntityPointerLeave: (entityId: WorldEntity["_id"]) => void;
  onEntityPointerMove: (
    entityId: WorldEntity["_id"],
    event: FederatedPointerEvent,
  ) => void;
  onEntityPointerTap: (
    entityId: WorldEntity["_id"],
    event: FederatedPointerEvent,
  ) => void;
  selectedEntityId: WorldEntity["_id"] | null;
};

export function EntityLayer({
  entities,
  hoveredEntityId,
  isoConfig,
  isInteractionDisabled,
  onEntityPointerEnter,
  onEntityPointerLeave,
  onEntityPointerMove,
  onEntityPointerTap,
  selectedEntityId,
}: EntityLayerProps) {
  const sorted = useMemo(() => {
    const list = entities.filter(
      (e) => e.type === "building" || e.type === "decoration",
    );
    return [...list].sort((a, b) => {
      const aDepth =
        a.gridX + a.gridY + (a.footprintW ?? 1) + (a.footprintH ?? 1) - 2;
      const bDepth =
        b.gridX + b.gridY + (b.footprintW ?? 1) + (b.footprintH ?? 1) - 2;

      if (aDepth !== bDepth) {
        return aDepth - bDepth;
      }

      return String(a._id).localeCompare(String(b._id));
    });
  }, [entities]);

  return (
    /* passive + interactiveChildren lets hits reach child sprites; passive alone would prune if children were non-interactive. */
    <pixiContainer eventMode="passive" interactiveChildren>
      {sorted.map((entity) => (
        <AnimatedEntity
          key={`${entity._id}:${entity.spriteUrl ?? ""}:${entity.animationFrames ?? 1}`}
          entity={entity}
          isHovered={hoveredEntityId === entity._id}
          isInteractionDisabled={isInteractionDisabled}
          isSelected={selectedEntityId === entity._id}
          isoConfig={isoConfig}
          onPointerEnter={onEntityPointerEnter}
          onPointerLeave={onEntityPointerLeave}
          onPointerMove={onEntityPointerMove}
          onPointerTap={onEntityPointerTap}
        />
      ))}
    </pixiContainer>
  );
}
