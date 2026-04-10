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
    const existing = await ctx.db.query("world").first();

    if (existing) {
      return existing;
    }

    const id = await ctx.db.insert("world", DEFAULT_WORLD);
    return await ctx.db.get(id);
  },
});
