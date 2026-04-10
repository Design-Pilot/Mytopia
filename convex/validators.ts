import { v } from "convex/values";

export const timeOfDayValidator = v.union(
  v.literal("dawn"),
  v.literal("daylight"),
  v.literal("goldenHour"),
  v.literal("dusk"),
  v.literal("night"),
);

export const seasonValidator = v.union(
  v.literal("spring"),
  v.literal("summer"),
  v.literal("autumn"),
  v.literal("winter"),
);

export const weatherValidator = v.union(
  v.literal("clear"),
  v.literal("cloudy"),
  v.literal("rain"),
  v.literal("snow"),
);

export const entityTypeValidator = v.union(
  v.literal("building"),
  v.literal("decoration"),
  v.literal("vehicle"),
);

export const entityCategoryValidator = v.union(
  v.literal("project"),
  v.literal("company"),
  v.literal("education"),
  v.literal("community"),
  v.literal("personal"),
  v.literal("landmark"),
);

export const entityStatusValidator = v.union(
  v.literal("active"),
  v.literal("archived"),
  v.literal("wip"),
);

export const tileTypeValidator = v.union(
  v.literal("grass"),
  v.literal("water"),
  v.literal("road"),
);

export const assetTypeValidator = v.union(
  v.literal("building"),
  v.literal("decoration"),
  v.literal("vehicle"),
  v.literal("tile"),
  v.literal("cloud"),
);

export const seasonalAssetFields = {
  spring: v.optional(v.id("assets")),
  summer: v.optional(v.id("assets")),
  autumn: v.optional(v.id("assets")),
  winter: v.optional(v.id("assets")),
};

export const worldFields = {
  gridWidth: v.number(),
  gridHeight: v.number(),
  tileWidth: v.number(),
  tileHeight: v.number(),
  defaultTile: tileTypeValidator,
  timeOfDay: v.optional(timeOfDayValidator),
  season: v.optional(seasonValidator),
  weather: v.optional(weatherValidator),
};

export const worldPatchFields = {
  gridWidth: v.optional(v.number()),
  gridHeight: v.optional(v.number()),
  tileWidth: v.optional(v.number()),
  tileHeight: v.optional(v.number()),
  defaultTile: v.optional(tileTypeValidator),
  timeOfDay: v.optional(timeOfDayValidator),
  season: v.optional(seasonValidator),
  weather: v.optional(weatherValidator),
};

export const entityCreationFields = {
  type: entityTypeValidator,
  name: v.string(),
  description: v.optional(v.string()),
  gridX: v.number(),
  gridY: v.number(),
  category: v.optional(entityCategoryValidator),
  url: v.optional(v.string()),
  techStack: v.optional(v.array(v.string())),
  status: v.optional(entityStatusValidator),
  assetId: v.optional(v.id("assets")),
  footprintW: v.optional(v.number()),
  footprintH: v.optional(v.number()),
  animationFrames: v.optional(v.number()),
  animationSpeed: v.optional(v.number()),
  zIndex: v.optional(v.number()),
  pathId: v.optional(v.string()),
  speed: v.optional(v.number()),
  seasonalAssets: v.optional(v.object(seasonalAssetFields)),
};

export const entityPatchFields = {
  type: v.optional(entityTypeValidator),
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  gridX: v.optional(v.number()),
  gridY: v.optional(v.number()),
  category: v.optional(entityCategoryValidator),
  url: v.optional(v.string()),
  techStack: v.optional(v.array(v.string())),
  status: v.optional(entityStatusValidator),
  assetId: v.optional(v.id("assets")),
  footprintW: v.optional(v.number()),
  footprintH: v.optional(v.number()),
  animationFrames: v.optional(v.number()),
  animationSpeed: v.optional(v.number()),
  zIndex: v.optional(v.number()),
  pathId: v.optional(v.string()),
  speed: v.optional(v.number()),
  seasonalAssets: v.optional(v.object(seasonalAssetFields)),
};

export const assetFields = {
  name: v.string(),
  storageId: v.id("_storage"),
  type: assetTypeValidator,
  tags: v.optional(v.array(v.string())),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  animationFrames: v.optional(v.number()),
};

export const assetPatchFields = {
  name: v.optional(v.string()),
  storageId: v.optional(v.id("_storage")),
  type: v.optional(assetTypeValidator),
  tags: v.optional(v.array(v.string())),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  animationFrames: v.optional(v.number()),
};
