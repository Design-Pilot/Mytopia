import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import {
  assetFields,
  entityCreationFields,
  tileTypeValidator,
  worldFields,
} from "./validators";

export default defineSchema({
  world: defineTable(worldFields),
  entities: defineTable(entityCreationFields)
    .index("by_type", ["type"])
    .index("by_position", ["gridX", "gridY"]),
  tiles: defineTable({
    x: v.number(),
    y: v.number(),
    tileType: tileTypeValidator,
  }).index("by_position", ["x", "y"]),
  assets: defineTable({
    ...assetFields,
    url: v.optional(v.string()),
  }).index("by_type", ["type"]),
});
