import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { worldPatchFields } from "./validators";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("world").first();
  },
});

export const update = mutation({
  args: {
    patch: v.object(worldPatchFields),
  },
  handler: async (ctx, args) => {
    const world = await ctx.db.query("world").first();

    if (!world) {
      throw new Error("World config does not exist yet. Seed it first.");
    }

    await ctx.db.patch(world._id, args.patch);
    return await ctx.db.get(world._id);
  },
});
