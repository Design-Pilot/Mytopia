import { v } from "convex/values";

import { type Doc } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import {
  entityCreationFields,
  entityPatchFields,
  entityTypeValidator,
} from "./validators";

type EntityDoc = Doc<"entities">;

function assertSpriteUrl(spriteUrl: string | undefined) {
  if (!spriteUrl) {
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(spriteUrl);
  } catch {
    throw new Error("spriteUrl must be a valid URL.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("spriteUrl must use https.");
  }
}

async function resolveEntitySpriteUrl(
  ctx: QueryCtx,
  entity: EntityDoc,
): Promise<string | undefined> {
  if (entity.spriteUrl) {
    return entity.spriteUrl;
  }

  const world = await ctx.db.query("world").first();
  const seasonalAssetId =
    world?.season !== undefined
      ? entity.seasonalAssets?.[world.season]
      : undefined;
  const assetId = seasonalAssetId ?? entity.assetId;

  if (!assetId) {
    return undefined;
  }

  const asset = await ctx.db.get(assetId);
  if (!asset) {
    return undefined;
  }

  return (await ctx.storage.getUrl(asset.storageId)) ?? undefined;
}

async function hydrateEntity(ctx: QueryCtx, entity: EntityDoc) {
  return {
    ...entity,
    spriteUrl: await resolveEntitySpriteUrl(ctx, entity),
  };
}

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const entities = await ctx.db.query("entities").collect();
    return await Promise.all(entities.map((entity) => hydrateEntity(ctx, entity)));
  },
});

export const getByType = query({
  args: {
    type: entityTypeValidator,
  },
  handler: async (ctx, args) => {
    const entities = await ctx.db
      .query("entities")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();

    return await Promise.all(entities.map((entity) => hydrateEntity(ctx, entity)));
  },
});

export const create = mutation({
  args: {
    entity: v.object(entityCreationFields),
  },
  handler: async (ctx, args) => {
    assertSpriteUrl(args.entity.spriteUrl);
    const id = await ctx.db.insert("entities", args.entity);
    return await ctx.db.get(id);
  },
});

export const update = mutation({
  args: {
    id: v.id("entities"),
    patch: v.object(entityPatchFields),
  },
  handler: async (ctx, args) => {
    assertSpriteUrl(args.patch.spriteUrl);
    await ctx.db.patch(args.id, args.patch);
    return await ctx.db.get(args.id);
  },
});

export const remove = mutation({
  args: {
    id: v.id("entities"),
  },
  handler: async (ctx, args) => {
    const entity = await ctx.db.get(args.id);
    if (!entity) {
      return null;
    }

    await ctx.db.delete(args.id);
    return entity;
  },
});

export const move = mutation({
  args: {
    id: v.id("entities"),
    gridX: v.number(),
    gridY: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      gridX: args.gridX,
      gridY: args.gridY,
    });
    return await ctx.db.get(args.id);
  },
});
