"use client";

import { Application, extend } from "@pixi/react";
import { useMutation, useConvexConnectionState } from "convex/react";
import { Container, FederatedPointerEvent, Graphics } from "pixi.js";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EntityLayer } from "@/components/EntityLayer";
import { ShadowLayer } from "@/components/ShadowLayer";
import { TileLayer } from "@/components/TileLayer";
import { Tooltip } from "@/components/Tooltip";
import { useCamera } from "@/hooks/useCamera";
import { useInteractions } from "@/hooks/useInteractions";
import { useWorldData } from "@/hooks/useWorldData";
import {
  createDefaultIsoConfig,
  getGridWorldCenter,
  tileToScreen,
} from "@/lib/isoMath";
import { DEFAULT_WORLD_CONFIG, type WorldData } from "@/types/world";
import { api } from "../../convex/_generated/api";
import { type PendingPlacement } from "@/components/IsometricCanvas";

extend({ Container, Graphics });

const CANVAS_BACKGROUND = 0x2a3d2f;

// ─── view ─────────────────────────────────────────────────────────────────────

function IsometricGridView({
  worldData,
  onTilePlaced,
  placementFootprint,
}: {
  worldData: WorldData;
  onTilePlaced?: (gx: number, gy: number) => void;
  placementFootprint?: { w: number; h: number };
}) {
  const {
    world: { gridWidth, gridHeight, tileWidth, tileHeight, defaultTile },
    tileGrid,
    entities,
  } = worldData;

  const [size, setSize] = useState({ width: 0, height: 0 });
  const isoConfig = useMemo(
    () => createDefaultIsoConfig({ gridHeight, tileWidth, tileHeight }),
    [gridHeight, tileHeight, tileWidth],
  );
  const worldCenter = useMemo(
    () => getGridWorldCenter(isoConfig, gridWidth, gridHeight),
    [gridHeight, gridWidth, isoConfig],
  );
  const worldWidth = useMemo(
    () => ((gridWidth + gridHeight) * isoConfig.tileWidth) / 2,
    [gridHeight, gridWidth, isoConfig],
  );
  const worldHeight = useMemo(
    () => ((gridWidth + gridHeight) * isoConfig.tileHeight) / 2,
    [gridHeight, gridWidth, isoConfig],
  );

  const {
    containerRef,
    panX,
    panY,
    zoom,
    isDragging,
    animateZoomTo,
    hoverTile,
    cursor,
    onPointerCancel,
    onPointerDown,
    onPointerLeave,
    onPointerMove,
    onPointerUp,
  } = useCamera({
    viewportWidth: size.width,
    viewportHeight: size.height,
    gridWidth,
    gridHeight,
    isoConfig,
    worldCenterX: worldCenter.screenX,
    worldCenterY: worldCenter.screenY,
    worldWidth,
    worldHeight,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight });
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  const halfW = isoConfig.tileWidth / 2;
  const halfH = isoConfig.tileHeight / 2;
  const isPlacementMode = onTilePlaced !== undefined;

  const drawHover = useCallback(
    (g: Graphics) => {
      g.clear();
      const ht = hoverTile;
      if (!ht) return;

      const fw = placementFootprint?.w ?? 1;
      const fh = placementFootprint?.h ?? 1;
      // Gold in placement mode, green otherwise
      const fillColor = isPlacementMode ? 0xffd700 : 0xa8f0c0;
      const fillAlpha = isPlacementMode ? 0.4 : 0.45;

      for (let dx = 0; dx < fw; dx++) {
        for (let dy = 0; dy < fh; dy++) {
          const c = tileToScreen(ht.gx + dx, ht.gy + dy, isoConfig);
          const pts = [
            c.screenX,
            c.screenY - halfH,
            c.screenX + halfW,
            c.screenY,
            c.screenX,
            c.screenY + halfH,
            c.screenX - halfW,
            c.screenY,
          ];
          g.poly(pts, true)
            .fill({ color: fillColor, alpha: fillAlpha })
            .stroke({ width: 2, color: 0xffffff, alpha: 0.9 });
        }
      }
    },
    [hoverTile, halfH, halfW, isoConfig, isPlacementMode, placementFootprint],
  );

  // Large backdrop so pointer events always have a target regardless of pan/zoom.
  const drawInteractionBackdrop = useCallback((g: Graphics) => {
    g.clear();
    g.rect(-50000, -50000, 100000, 100000).fill({
      color: 0xffffff,
      alpha: 0.001,
    });
  }, []);

  const {
    hoveredEntityId,
    interactionMode,
    selectedEntityId,
    tooltipEntity,
    tooltipPoint,
    clearTransientUi,
    handleBackgroundPointerTap,
    handleContainerPointerLeave,
    handleEntityPointerEnter,
    handleEntityPointerLeave,
    handleEntityPointerMove,
    handleEntityPointerTap,
  } = useInteractions(entities);

  useEffect(() => {
    if (isDragging) clearTransientUi();
  }, [clearTransientUi, isDragging]);

  const handleBackgroundTap = useCallback(
    (event: FederatedPointerEvent) => {
      if (onTilePlaced && hoverTile) {
        onTilePlaced(hoverTile.gx, hoverTile.gy);
      } else {
        handleBackgroundPointerTap(event);
      }
    },
    [onTilePlaced, hoverTile, handleBackgroundPointerTap],
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none select-none"
      style={{ cursor: isPlacementMode ? "crosshair" : cursor }}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerLeave={() => {
        onPointerLeave();
        handleContainerPointerLeave();
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {size.width > 0 && size.height > 0 ? (
        <Application
          antialias
          backgroundColor={CANVAS_BACKGROUND}
          className="block"
          resizeTo={containerRef}
        >
          <pixiContainer scale={zoom} x={panX} y={panY}>
            <pixiGraphics
              draw={drawInteractionBackdrop}
              eventMode="static"
              onPointerTap={handleBackgroundTap}
            />
            <TileLayer
              defaultTile={defaultTile}
              gridHeight={gridHeight}
              gridWidth={gridWidth}
              isoConfig={isoConfig}
              tileGrid={tileGrid}
            />
            <ShadowLayer entities={entities} isoConfig={isoConfig} />
            <EntityLayer
              entities={entities}
              hoveredEntityId={
                interactionMode === "mouse" ? hoveredEntityId : null
              }
              isoConfig={isoConfig}
              isInteractionDisabled={isDragging}
              onEntityPointerEnter={handleEntityPointerEnter}
              onEntityPointerLeave={handleEntityPointerLeave}
              onEntityPointerMove={handleEntityPointerMove}
              onEntityPointerTap={handleEntityPointerTap}
              selectedEntityId={selectedEntityId}
            />
            {/* Must not capture hits — it sits above buildings and would block hover/click. */}
            <pixiGraphics draw={drawHover} eventMode="none" />
          </pixiContainer>
        </Application>
      ) : null}
      {tooltipEntity && tooltipPoint ? (
        <Tooltip entity={tooltipEntity} point={tooltipPoint} />
      ) : null}
      <button
        type="button"
        className="absolute bottom-4 right-4 rounded-md bg-black/40 px-3 py-1.5 text-sm text-emerald-100 backdrop-blur transition hover:bg-black/55"
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          animateZoomTo(1);
        }}
      >
        Zoom {Math.round(zoom * 100)}%
      </button>
    </div>
  );
}

// ─── convex-connected wrapper ─────────────────────────────────────────────────

function IsometricGridWithConvex({
  pendingPlacement,
  onEntityPlaced,
}: {
  pendingPlacement: PendingPlacement | null;
  onEntityPlaced: () => void;
}) {
  const worldData = useWorldData();
  const connectionState = useConvexConnectionState();
  const createEntity = useMutation(api.entities.create);

  const showOfflineFallback =
    worldData.bootstrapFailed ||
    (!connectionState.isWebSocketConnected &&
      connectionState.connectionRetries > 0);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || worldData.isLoading) return;
    console.log("MyTopia world data", worldData);
  }, [worldData]);

  const handleTilePlaced = useCallback(
    async (gx: number, gy: number) => {
      if (!pendingPlacement) return;
      await createEntity({
        entity: {
          type: pendingPlacement.entityType,
          name: pendingPlacement.name,
          gridX: gx,
          gridY: gy,
          assetId: pendingPlacement.assetId,
          status: "active",
          footprintW: pendingPlacement.footprintW,
          footprintH: pendingPlacement.footprintH,
        },
      });
      onEntityPlaced();
    },
    [pendingPlacement, createEntity, onEntityPlaced],
  );

  if (worldData.isLoading) {
    return <IsometricGridLoading showOfflineFallback={showOfflineFallback} />;
  }

  if (showOfflineFallback) {
    return <IsometricGridLoading showOfflineFallback />;
  }

  return (
    <div className="relative h-full w-full">
      <IsometricGridView
        worldData={worldData}
        onTilePlaced={pendingPlacement ? handleTilePlaced : undefined}
        placementFootprint={
          pendingPlacement
            ? { w: pendingPlacement.footprintW, h: pendingPlacement.footprintH }
            : undefined
        }
      />
      <p className="pointer-events-none absolute bottom-4 left-4 rounded-md bg-black/40 px-3 py-1.5 text-xs text-emerald-100 backdrop-blur">
        {`${worldData.entities.length} entities, ${worldData.assets.length} assets`}
      </p>
    </div>
  );
}

// ─── loading / offline fallback ───────────────────────────────────────────────

function IsometricGridLoading({
  showOfflineFallback,
}: {
  showOfflineFallback: boolean;
}) {
  const fallbackData: WorldData = useMemo(
    () => ({
      world: DEFAULT_WORLD_CONFIG,
      entities: [],
      tileGrid: Array.from({ length: DEFAULT_WORLD_CONFIG.gridHeight }, () =>
        Array.from({ length: DEFAULT_WORLD_CONFIG.gridWidth }, () =>
          DEFAULT_WORLD_CONFIG.defaultTile,
        ),
      ),
      assets: [],
      isLoading: false,
      bootstrapFailed: false,
    }),
    [],
  );

  if (showOfflineFallback) {
    return (
      <div className="relative h-full w-full">
        <IsometricGridView worldData={fallbackData} />
        <p className="pointer-events-none absolute bottom-4 left-4 rounded-md bg-black/40 px-3 py-1.5 text-xs text-amber-100 backdrop-blur">
          Convex is offline locally, so this is the fallback demo grid.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <IsometricGridView worldData={fallbackData} />
      <p className="pointer-events-none absolute bottom-4 left-4 rounded-md bg-black/40 px-3 py-1.5 text-xs text-emerald-100 backdrop-blur">
        Loading world data...
      </p>
    </div>
  );
}

// ─── public export ────────────────────────────────────────────────────────────

/** Isometric scene: tiles, entities, camera. Uses Convex when `NEXT_PUBLIC_CONVEX_URL` is set. */
export function IsometricGrid({
  pendingPlacement,
  onEntityPlaced,
}: {
  pendingPlacement: PendingPlacement | null;
  onEntityPlaced: () => void;
}) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    const offline: WorldData = {
      world: DEFAULT_WORLD_CONFIG,
      entities: [],
      tileGrid: Array.from({ length: DEFAULT_WORLD_CONFIG.gridHeight }, () =>
        Array.from({ length: DEFAULT_WORLD_CONFIG.gridWidth }, () =>
          DEFAULT_WORLD_CONFIG.defaultTile,
        ),
      ),
      assets: [],
      isLoading: false,
      bootstrapFailed: false,
    };
    return (
      <div className="relative h-full w-full">
        <IsometricGridView worldData={offline} />
        <p className="pointer-events-none absolute bottom-4 left-4 rounded-md bg-black/40 px-3 py-1.5 text-xs text-amber-100 backdrop-blur">
          Set NEXT_PUBLIC_CONVEX_URL for live data (run `npx convex dev`).
        </p>
      </div>
    );
  }

  return (
    <IsometricGridWithConvex
      pendingPlacement={pendingPlacement}
      onEntityPlaced={onEntityPlaced}
    />
  );
}
