"use client";

import { useState } from "react";

import { AdminPanel } from "@/components/AdminPanel";
import { IsometricGrid } from "@/components/IsometricGrid";
import { type Id } from "../../convex/_generated/dataModel";

export type PendingPlacement = {
  assetId: Id<"assets">;
  name: string;
  entityType: "building" | "decoration" | "vehicle";
  footprintW: number;
  footprintH: number;
};

/** Full-viewport Pixi scene: isometric tiles, entities, camera. */
export function IsometricCanvas() {
  const [pending, setPending] = useState<PendingPlacement | null>(null);

  return (
    <div className="relative h-full w-full">
      <IsometricGrid
        pendingPlacement={pending}
        onEntityPlaced={() => setPending(null)}
      />
      <AdminPanel
        isPendingPlacement={pending !== null}
        onAssetReadyToPlace={(assetId, name, entityType, footprintW, footprintH) =>
          setPending({ assetId, name, entityType, footprintW, footprintH })
        }
        onCancelPlacement={() => setPending(null)}
      />
    </div>
  );
}
