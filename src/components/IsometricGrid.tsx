"use client";

import { Application, extend } from "@pixi/react";
import { useConvexConnectionState } from "convex/react";
import { Container, Graphics } from "pixi.js";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EntityLayer } from "@/components/EntityLayer";
import { TileLayer } from "@/components/TileLayer";
import { useCamera } from "@/hooks/useCamera";
import { useWorldData } from "@/hooks/useWorldData";
import {
  createDefaultIsoConfig,
  getGridWorldCenter,
  tileToScreen,
} from "@/lib/isoMath";
import { DEFAULT_WORLD_CONFIG, type WorldData } from "@/types/world";

extend({ Container, Graphics });

const CANVAS_BACKGROUND = 0x2a3d2f;

function IsometricGridView({
  worldData,
}: {
  worldData: WorldData;
}) {
  const {
    world: {
      gridWidth,
      gridHeight,
      tileWidth,
      tileHeight,
      defaultTile,
    },
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

    const update = () => {
      setSize({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  const halfW = isoConfig.tileWidth / 2;
  const halfH = isoConfig.tileHeight / 2;

  const drawHover = useCallback(
    (g: Graphics) => {
      g.clear();
      const ht = hoverTile;
      if (!ht) return;
      const c = tileToScreen(ht.gx, ht.gy, isoConfig);
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
        .fill({ color: 0xa8f0c0, alpha: 0.45 })
        .stroke({ width: 2, color: 0xffffff, alpha: 0.9 });
    },
    [hoverTile, halfH, halfW, isoConfig],
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none select-none"
      style={{ cursor }}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerLeave={onPointerLeave}
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
            <TileLayer
              defaultTile={defaultTile}
              gridHeight={gridHeight}
              gridWidth={gridWidth}
              isoConfig={isoConfig}
              tileGrid={tileGrid}
            />
            <EntityLayer entities={entities} isoConfig={isoConfig} />
            <pixiGraphics draw={drawHover} />
          </pixiContainer>
        </Application>
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

function IsometricGridWithConvex() {
  const worldData = useWorldData();
  const connectionState = useConvexConnectionState();
  const showOfflineFallback =
    worldData.bootstrapFailed ||
    (!connectionState.isWebSocketConnected &&
      connectionState.connectionRetries > 0);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || worldData.isLoading) {
      return;
    }

    console.log("MyTopia world data", worldData);
  }, [worldData]);

  if (worldData.isLoading) {
    return <IsometricGridLoading showOfflineFallback={showOfflineFallback} />;
  }

  if (showOfflineFallback) {
    return <IsometricGridLoading showOfflineFallback />;
  }

  return (
    <div className="relative h-full w-full">
      <IsometricGridView worldData={worldData} />
      <p className="pointer-events-none absolute left-4 bottom-4 rounded-md bg-black/40 px-3 py-1.5 text-xs text-emerald-100 backdrop-blur">
        {`${worldData.entities.length} entities, ${worldData.assets.length} assets`}
      </p>
    </div>
  );
}

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
        <p className="pointer-events-none absolute left-4 bottom-4 rounded-md bg-black/40 px-3 py-1.5 text-xs text-amber-100 backdrop-blur">
          Convex is offline locally, so this is the fallback demo grid.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <IsometricGridView worldData={fallbackData} />
      <p className="pointer-events-none absolute left-4 bottom-4 rounded-md bg-black/40 px-3 py-1.5 text-xs text-emerald-100 backdrop-blur">
        Loading world data...
      </p>
    </div>
  );
}

/** Isometric scene: tiles, entities, camera. Uses Convex when `NEXT_PUBLIC_CONVEX_URL` is set. */
export function IsometricGrid() {
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
        <p className="pointer-events-none absolute left-4 bottom-4 rounded-md bg-black/40 px-3 py-1.5 text-xs text-amber-100 backdrop-blur">
          Set NEXT_PUBLIC_CONVEX_URL for live data (run `npx convex dev`).
        </p>
      </div>
    );
  }

  return <IsometricGridWithConvex />;
}
