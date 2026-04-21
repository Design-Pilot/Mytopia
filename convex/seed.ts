import { mutation } from "./_generated/server";

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

export const seedWorld = mutation({
  args: {},
  handler: async (ctx) => {
    let world = await ctx.db.query("world").first();

    if (!world) {
      const id = await ctx.db.insert("world", DEFAULT_WORLD);
      world = await ctx.db.get(id);
      if (!world) {
        throw new Error("Failed to create world.");
      }
    }

    // Skip demo entity/tile insertion — mark flags so they never run.
    if (world && !world.phase4DemoSeeded) {
      await ctx.db.patch(world._id, { phase4DemoSeeded: true });
      world = await ctx.db.get(world._id);
    }

    if (world && !world.phase6DemoSeeded) {
      await ctx.db.patch(world._id, { phase6DemoSeeded: true });
      world = await ctx.db.get(world._id);
    }

    if (world && !world.phase7DemoSeeded) {
      await ctx.db.patch(world._id, { phase7DemoSeeded: true });
      world = await ctx.db.get(world._id);
    }

    return world;
  },
});

/** Names of all demo entities created by phase 4/6/7 seed functions. */
const DEMO_ENTITY_NAMES = [
  "Demo Studio",
  "Demo Workshop",
  "Demo Loft",
  "Streetlamp",
  "Bench",
  "Shrub Cluster",
  "Fountain Ripple",
  "Willow Tree",
  "Garden Bush",
];

/** Demo tile overrides created by phase 4. */
const DEMO_TILES: { x: number; y: number }[] = [
  // road tiles: x=4..15 at y=10
  ...Array.from({ length: 12 }, (_, i) => ({ x: i + 4, y: 10 })),
  // water tiles: x=8..11, y=14..16
  ...Array.from({ length: 4 }, (_, i) =>
    Array.from({ length: 3 }, (_, j) => ({ x: i + 8, y: j + 14 })),
  ).flat(),
];

/**
 * Remove all demo entities and tile overrides seeded by phases 4/6/7.
 * User-added entities are not affected.
 */
export const removeDemoContent = mutation({
  args: {},
  handler: async (ctx) => {
    let removedEntities = 0;
    let removedTiles = 0;

    // Delete demo entities by name
    for (const name of DEMO_ENTITY_NAMES) {
      const entities = await ctx.db
        .query("entities")
        .filter((q) => q.eq(q.field("name"), name))
        .collect();
      for (const entity of entities) {
        await ctx.db.delete(entity._id);
        removedEntities++;
      }
    }

    // Delete demo tile overrides
    for (const { x, y } of DEMO_TILES) {
      const tile = await ctx.db
        .query("tiles")
        .withIndex("by_position", (q) => q.eq("x", x).eq("y", y))
        .first();
      if (tile) {
        await ctx.db.delete(tile._id);
        removedTiles++;
      }
    }

    return { removedEntities, removedTiles };
  },
});
