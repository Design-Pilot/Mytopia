"use client";

import { useEffect, useState } from "react";

import { IsometricGrid } from "@/components/IsometricGrid";
import { useWorldData } from "@/hooks/useWorldData";

/** Full-viewport Pixi scene: isometric grid + camera (Phase 2). */
export function IsometricCanvas() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <IsometricGrid />;
  }

  return <ConnectedIsometricCanvas />;
}

function ConnectedIsometricCanvas() {
  const worldData = useWorldData();

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || worldData.isLoading) {
      return;
    }

    console.log("MyTopia world data", worldData);
  }, [worldData]);

  if (worldData.isLoading) {
    return <LoadingWorldCanvas />;
  }

  return (
    <div className="relative h-full w-full">
      <IsometricGrid
        gridWidth={worldData.world.gridWidth}
        gridHeight={worldData.world.gridHeight}
        tileWidth={worldData.world.tileWidth}
        tileHeight={worldData.world.tileHeight}
        tileGrid={worldData.tileGrid}
      />
      <p className="pointer-events-none absolute left-4 bottom-4 rounded-md bg-black/40 px-3 py-1.5 text-xs text-emerald-100 backdrop-blur">
        {worldData.isLoading
          ? "Loading world data..."
          : `${worldData.entities.length} entities, ${worldData.assets.length} assets`}
      </p>
    </div>
  );
}

function LoadingWorldCanvas() {
  const [showOfflineFallback, setShowOfflineFallback] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setShowOfflineFallback(true);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (showOfflineFallback) {
    return (
      <div className="relative h-full w-full">
        <IsometricGrid />
        <p className="pointer-events-none absolute left-4 bottom-4 rounded-md bg-black/40 px-3 py-1.5 text-xs text-amber-100 backdrop-blur">
          Convex is offline locally, so this is the fallback demo grid.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <IsometricGrid />
      <p className="pointer-events-none absolute left-4 bottom-4 rounded-md bg-black/40 px-3 py-1.5 text-xs text-emerald-100 backdrop-blur">
        Loading world data...
      </p>
    </div>
  );
}
