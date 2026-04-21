"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FederatedPointerEvent } from "pixi.js";

import type { WorldEntity } from "@/types/world";

export type InteractionMode = "mouse" | "touch";

type ViewportPoint = {
  x: number;
  y: number;
};

type TooltipState = {
  entityId: WorldEntity["_id"];
  point: ViewportPoint;
  mode: InteractionMode;
};

function pointerModeFromEvent(event: FederatedPointerEvent): InteractionMode {
  return event.pointerType === "touch" ? "touch" : "mouse";
}

export function useInteractions(entities: WorldEntity[]) {
  const [hoveredEntityId, setHoveredEntityId] =
    useState<WorldEntity["_id"] | null>(null);
  const [selectedEntityId, setSelectedEntityId] =
    useState<WorldEntity["_id"] | null>(null);
  const [tooltipState, setTooltipState] = useState<TooltipState | null>(null);
  const [interactionMode, setInteractionMode] =
    useState<InteractionMode>("mouse");

  const selectedEntityIdRef = useRef<WorldEntity["_id"] | null>(null);
  const tooltipStateRef = useRef<TooltipState | null>(null);

  useEffect(() => {
    selectedEntityIdRef.current = selectedEntityId;
  }, [selectedEntityId]);

  useEffect(() => {
    tooltipStateRef.current = tooltipState;
  }, [tooltipState]);

  const entityById = useMemo(
    () => new Map(entities.map((entity) => [entity._id, entity])),
    [entities],
  );

  const updateMouseTooltip = useCallback(
    (entityId: WorldEntity["_id"], point: ViewportPoint) => {
      setTooltipState({
        entityId,
        point,
        mode: "mouse",
      });
    },
    [],
  );

  const handleEntityPointerEnter = useCallback(
    (entityId: WorldEntity["_id"], event: FederatedPointerEvent) => {
      if (pointerModeFromEvent(event) === "touch") {
        return;
      }

      setInteractionMode("mouse");
      setHoveredEntityId(entityId);
      updateMouseTooltip(entityId, {
        x: event.clientX,
        y: event.clientY,
      });
    },
    [updateMouseTooltip],
  );

  const handleEntityPointerMove = useCallback(
    (entityId: WorldEntity["_id"], event: FederatedPointerEvent) => {
      if (pointerModeFromEvent(event) === "touch") {
        return;
      }

      setInteractionMode("mouse");
      setHoveredEntityId(entityId);
      updateMouseTooltip(entityId, {
        x: event.clientX,
        y: event.clientY,
      });
    },
    [updateMouseTooltip],
  );

  const handleEntityPointerLeave = useCallback(
    (entityId: WorldEntity["_id"]) => {
      setHoveredEntityId((current) => (current === entityId ? null : current));
      setTooltipState((current) => {
        if (current?.entityId === entityId && current.mode === "mouse") {
          return null;
        }

        return current;
      });
    },
    [],
  );

  const clearTransientUi = useCallback(() => {
    setHoveredEntityId(null);
    setTooltipState(null);
  }, []);

  const handleEntityPointerTap = useCallback(
    (entityId: WorldEntity["_id"], event: FederatedPointerEvent) => {
      event.stopPropagation();

      const mode = pointerModeFromEvent(event);
      setInteractionMode(mode);

      if (mode === "touch") {
        const sameEntitySelected = selectedEntityIdRef.current === entityId;
        const sameTouchTooltip =
          tooltipStateRef.current?.entityId === entityId &&
          tooltipStateRef.current.mode === "touch";

        setHoveredEntityId(null);

        if (sameEntitySelected && sameTouchTooltip) {
          setSelectedEntityId(null);
          setTooltipState(null);
          return;
        }

        setSelectedEntityId(entityId);
        setTooltipState({
          entityId,
          point: {
            x: event.clientX,
            y: event.clientY,
          },
          mode: "touch",
        });
        return;
      }

      const nextSelected =
        selectedEntityIdRef.current === entityId ? null : entityId;
      setSelectedEntityId(nextSelected);
      /* Mouse: show tooltip on select so it still appears if pointerenter never ran. */
      if (nextSelected !== null) {
        setTooltipState({
          entityId,
          point: { x: event.clientX, y: event.clientY },
          mode: "mouse",
        });
      } else {
        setTooltipState(null);
      }
    },
    [],
  );

  const handleBackgroundPointerTap = useCallback(
    (event: FederatedPointerEvent) => {
      setInteractionMode(pointerModeFromEvent(event));
      setHoveredEntityId(null);
      setSelectedEntityId(null);
      setTooltipState(null);
    },
    [],
  );

  const handleContainerPointerLeave = useCallback(() => {
    setHoveredEntityId(null);
    setTooltipState((current) => (current?.mode === "mouse" ? null : current));
  }, []);

  const tooltipEntity = tooltipState
    ? entityById.get(tooltipState.entityId) ?? null
    : null;

  return {
    hoveredEntityId,
    interactionMode,
    selectedEntityId,
    tooltipEntity,
    tooltipPoint: tooltipState?.point ?? null,
    clearTransientUi,
    handleBackgroundPointerTap,
    handleContainerPointerLeave,
    handleEntityPointerEnter,
    handleEntityPointerLeave,
    handleEntityPointerMove,
    handleEntityPointerTap,
  };
}
