import type { Id } from "./_generated/dataModel";
import { type MutationCtx, mutation } from "./_generated/server";

const DEFAULT_WORLD = {
  gridWidth: 20,
  gridHeight: 20,
  tileWidth: 64,
  tileHeight: 32,
  defaultTile: "grass" as const,
  timeOfDay: "daylight" as const,
  season: "summer" as const,
  weather: "clear" as const,
};

/** Stable CDN images (CORS-friendly) for Phase 4 demo buildings — no Convex storage upload in mutations. */
const DEMO_SPRITES = [
  "https://picsum.photos/seed/mytopia-studio/56/80",
  "https://picsum.photos/seed/mytopia-workshop/48/72",
  "https://picsum.photos/seed/mytopia-loft/52/88",
] as const;

async function upsertTile(
  ctx: MutationCtx,
  x: number,
  y: number,
  tileType: "road" | "water",
) {
  const existing = await ctx.db
    .query("tiles")
    .withIndex("by_position", (q) => q.eq("x", x).eq("y", y))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, { tileType });
    return;
  }

  await ctx.db.insert("tiles", { x, y, tileType });
}

async function insertPhase4Demo(ctx: MutationCtx, worldId: Id<"world">) {
  const world = await ctx.db.get(worldId);
  if (!world || world.phase4DemoSeeded === true) {
    return;
  }

  for (let x = 4; x <= 15; x++) {
    await upsertTile(ctx, x, 10, "road");
  }

  for (let x = 8; x <= 11; x++) {
    for (let y = 14; y <= 16; y++) {
      await upsertTile(ctx, x, y, "water");
    }
  }

  await ctx.db.insert("entities", {
    type: "building",
    name: "Demo Studio",
    description: "Phase 4 demo building (2×2 footprint)",
    gridX: 6,
    gridY: 6,
    category: "project",
    status: "wip",
    spriteUrl: DEMO_SPRITES[0],
    footprintW: 2,
    footprintH: 2,
  });

  await ctx.db.insert("entities", {
    type: "building",
    name: "Demo Workshop",
    gridX: 12,
    gridY: 8,
    category: "company",
    status: "active",
    spriteUrl: DEMO_SPRITES[1],
    footprintW: 1,
    footprintH: 1,
  });

  await ctx.db.insert("entities", {
    type: "building",
    name: "Demo Loft",
    gridX: 9,
    gridY: 4,
    category: "personal",
    status: "active",
    spriteUrl: DEMO_SPRITES[2],
    footprintW: 1,
    footprintH: 2,
  });

  await ctx.db.patch(worldId, { phase4DemoSeeded: true });
}

export const seedWorld = mutation({
  args: {},
  handler: async (ctx) => {
    let world = await ctx.db.query("world").first();
    let createdWorld = false;

    if (!world) {
      const id = await ctx.db.insert("world", DEFAULT_WORLD);
      world = await ctx.db.get(id);
      createdWorld = true;
      if (!world) {
        throw new Error("Failed to create world.");
      }
    }

    if (createdWorld && world.phase4DemoSeeded !== true) {
      await insertPhase4Demo(ctx, world._id);
      world = await ctx.db.get(world._id);
    }

    return world;
  },
});
