"use client";

import { IsometricGrid } from "@/components/IsometricGrid";

/** Full-viewport Pixi scene: isometric tiles, entities, camera (Phase 4). */
export function IsometricCanvas() {
  return (
    <div className="relative h-full w-full">
      <IsometricGrid />
    </div>
  );
}
