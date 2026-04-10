"use client";

import { useMutation, useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import { useEffect, useMemo, useRef } from "react";

import { api as generatedApi } from "../../convex/_generated/api";
import {
  DEFAULT_WORLD_CONFIG,
  type TileGrid,
  type TileOverride,
  type WorldData,
} from "@/types/world";

const api = generatedApi as typeof generatedApi & {
  world: {
    get: FunctionReference<"query">;
  };
  entities: {
    getAll: FunctionReference<"query">;
  };
  tiles: {
    getAll: FunctionReference<"query">;
  };
  assets: {
    getAll: FunctionReference<"query">;
  };
  seed: {
    seedWorld: FunctionReference<"mutation">;
  };
};

function buildTileGrid(
  gridWidth: number,
  gridHeight: number,
  defaultTile: WorldData["world"]["defaultTile"],
  tiles: TileOverride[],
): TileGrid {
  const tileGrid = Array.from({ length: gridHeight }, () =>
    Array.from({ length: gridWidth }, () => defaultTile),
  );

  for (const tile of tiles) {
    if (
      tile.x >= 0 &&
      tile.x < gridWidth &&
      tile.y >= 0 &&
      tile.y < gridHeight
    ) {
      tileGrid[tile.y][tile.x] = tile.tileType;
    }
  }

  return tileGrid;
}

export function useWorldData(): WorldData {
  const world = useQuery(api.world.get);
  const entities = useQuery(api.entities.getAll);
  const tiles = useQuery(api.tiles.getAll);
  const assets = useQuery(api.assets.getAll);
  const seedWorld = useMutation(api.seed.seedWorld);
  const hasRequestedSeedRef = useRef(false);

  useEffect(() => {
    if (world !== null || hasRequestedSeedRef.current) {
      return;
    }

    hasRequestedSeedRef.current = true;
    void seedWorld().catch((error: unknown) => {
      console.error("Failed to seed the world config.", error);
      hasRequestedSeedRef.current = false;
    });
  }, [seedWorld, world]);

  const worldConfig = world ?? DEFAULT_WORLD_CONFIG;
  const resolvedEntities = entities ?? [];
  const resolvedAssets = assets ?? [];

  const tileGrid = useMemo(
    () =>
      buildTileGrid(
        worldConfig.gridWidth,
        worldConfig.gridHeight,
        worldConfig.defaultTile,
        tiles ?? [],
      ),
    [
      worldConfig.defaultTile,
      worldConfig.gridHeight,
      worldConfig.gridWidth,
      tiles,
    ],
  );

  const isLoading =
    world === undefined ||
    entities === undefined ||
    tiles === undefined ||
    assets === undefined ||
    world === null;

  return {
    world: worldConfig,
    entities: resolvedEntities,
    tileGrid,
    assets: resolvedAssets,
    isLoading,
  };
}
