import { v } from "convex/values";

import { type Doc } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { assetFields, assetPatchFields, assetTypeValidator } from "./validators";

type AssetDoc = Doc<"assets">;

async function hydrateAsset(ctx: QueryCtx, asset: AssetDoc) {
  return {
    ...asset,
    url: (await ctx.storage.getUrl(asset.storageId)) ?? undefined,
  };
}

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const assets = await ctx.db.query("assets").collect();
    return await Promise.all(assets.map((asset) => hydrateAsset(ctx, asset)));
  },
});

export const getByType = query({
  args: {
    type: assetTypeValidator,
  },
  handler: async (ctx, args) => {
    const assets = await ctx.db
      .query("assets")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();

    return await Promise.all(assets.map((asset) => hydrateAsset(ctx, asset)));
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    asset: v.object(assetFields),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("assets", args.asset);
    return await ctx.db.get(id);
  },
});

export const update = mutation({
  args: {
    id: v.id("assets"),
    patch: v.object(assetPatchFields),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, args.patch);
    return await ctx.db.get(args.id);
  },
});

export const remove = mutation({
  args: {
    id: v.id("assets"),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.id);
    if (!asset) {
      return null;
    }

    const entities = await ctx.db.query("entities").collect();
    const isUsed = entities.some(
      (entity) =>
        entity.assetId === args.id ||
        Object.values(entity.seasonalAssets ?? {}).some(
          (seasonalAssetId) => seasonalAssetId === args.id,
        ),
    );

    if (isUsed) {
      throw new Error("Asset is still referenced by an entity.");
    }

    await ctx.storage.delete(asset.storageId);
    await ctx.db.delete(args.id);
    return asset;
  },
});

export const removeUnused = mutation({
  args: {},
  handler: async (ctx) => {
    const entities = await ctx.db.query("entities").collect();
    const referencedAssets = new Set<string>();

    for (const entity of entities) {
      if (entity.assetId) {
        referencedAssets.add(entity.assetId);
      }

      for (const seasonalAssetId of Object.values(entity.seasonalAssets ?? {})) {
        if (seasonalAssetId) {
          referencedAssets.add(seasonalAssetId);
        }
      }
    }

    const assets = await ctx.db.query("assets").collect();
    const removed = [];

    for (const asset of assets) {
      if (referencedAssets.has(asset._id)) {
        continue;
      }

      await ctx.storage.delete(asset.storageId);
      await ctx.db.delete(asset._id);
      removed.push(asset);
    }

    return removed;
  },
});
