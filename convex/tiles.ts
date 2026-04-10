import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { tileTypeValidator } from "./validators";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tiles").collect();
  },
});

export const set = mutation({
  args: {
    x: v.number(),
    y: v.number(),
    tileType: tileTypeValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tiles")
      .withIndex("by_position", (q) => q.eq("x", args.x).eq("y", args.y))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { tileType: args.tileType });
      return await ctx.db.get(existing._id);
    }

    const id = await ctx.db.insert("tiles", args);
    return await ctx.db.get(id);
  },
});

export const setBatch = mutation({
  args: {
    tiles: v.array(
      v.object({
        x: v.number(),
        y: v.number(),
        tileType: tileTypeValidator,
      }),
    ),
  },
  handler: async (ctx, args) => {
    const results = [];

    for (const tile of args.tiles) {
      const existing = await ctx.db
        .query("tiles")
        .withIndex("by_position", (q) => q.eq("x", tile.x).eq("y", tile.y))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, { tileType: tile.tileType });
        results.push(await ctx.db.get(existing._id));
        continue;
      }

      const id = await ctx.db.insert("tiles", tile);
      results.push(await ctx.db.get(id));
    }

    return results;
  },
});

export const remove = mutation({
  args: {
    x: v.number(),
    y: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tiles")
      .withIndex("by_position", (q) => q.eq("x", args.x).eq("y", args.y))
      .unique();

    if (!existing) {
      return null;
    }

    await ctx.db.delete(existing._id);
    return existing;
  },
});

export const removeBatch = mutation({
  args: {
    positions: v.array(
      v.object({
        x: v.number(),
        y: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const removed = [];

    for (const position of args.positions) {
      const existing = await ctx.db
        .query("tiles")
        .withIndex("by_position", (q) =>
          q.eq("x", position.x).eq("y", position.y),
        )
        .unique();

      if (!existing) {
        continue;
      }

      await ctx.db.delete(existing._id);
      removed.push(existing);
    }

    return removed;
  },
});
