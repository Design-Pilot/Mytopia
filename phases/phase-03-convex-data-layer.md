# Phase 3: Convex Data Layer

## Goal

Design and implement the Convex schema, queries, mutations, and seed data. Create the `useWorldData()` hook that assembles all data into a single reactive object for the renderer.

## Prerequisites

- Phase 1 complete (Convex initialized, provider wired up)

## Tech Involved

- Convex (schema, queries, mutations, file storage)
- React (useQuery, useMutation hooks)

## Detailed Tasks

### 1. Read Convex guidelines

**Always read `convex/_generated/ai/guidelines.md` first.** Use context7 to fetch current Convex docs as well.

### 2. Design the schema

Create `convex/schema.ts` with the redesigned tables:

#### `world` table
Single document holding global config:
```ts
world: defineTable({
  gridWidth: v.number(),          // e.g. 20
  gridHeight: v.number(),         // e.g. 20
  tileWidth: v.number(),          // e.g. 64
  tileHeight: v.number(),         // e.g. 32
  defaultTile: v.string(),        // e.g. "grass"
  timeOfDay: v.optional(v.string()),   // "dawn" | "daylight" | "goldenHour" | "dusk" | "night"
  season: v.optional(v.string()),      // "spring" | "summer" | "autumn" | "winter"
  weather: v.optional(v.string()),     // "clear" | "cloudy" | "rain" | "snow"
})
```

#### `entities` table
Unified table for all placed objects (buildings, decorations, vehicles):
```ts
entities: defineTable({
  type: v.string(),               // "building" | "decoration" | "vehicle"
  name: v.string(),               // display name
  description: v.optional(v.string()),
  gridX: v.number(),
  gridY: v.number(),
  
  // Building-specific
  category: v.optional(v.string()),      // "project" | "company" | "education" | etc.
  url: v.optional(v.string()),           // link to project/company
  techStack: v.optional(v.array(v.string())),
  status: v.optional(v.string()),        // "active" | "archived" | "wip"
  
  // Rendering
  assetId: v.optional(v.id("assets")),   // reference to assets table
  spriteUrl: v.optional(v.string()),     // resolved URL (derived on read)
  footprintW: v.optional(v.number()),    // tile footprint width
  footprintH: v.optional(v.number()),    // tile footprint height
  animationFrames: v.optional(v.number()),
  animationSpeed: v.optional(v.number()),
  zIndex: v.optional(v.number()),        // manual z-override
  
  // Vehicle-specific
  pathId: v.optional(v.string()),        // which road path to follow
  speed: v.optional(v.number()),         // movement speed
  
  // Seasonal variants
  seasonalAssets: v.optional(v.object({
    spring: v.optional(v.id("assets")),
    summer: v.optional(v.id("assets")),
    autumn: v.optional(v.id("assets")),
    winter: v.optional(v.id("assets")),
  })),
}).index("by_type", ["type"])
  .index("by_position", ["gridX", "gridY"])
```

#### `tiles` table
Sparse tile overrides (same pattern as v1):
```ts
tiles: defineTable({
  x: v.number(),
  y: v.number(),
  tileType: v.string(),         // "grass" | "water" | "road"
}).index("by_position", ["x", "y"])
```

#### `assets` table
Uploaded sprites with metadata:
```ts
assets: defineTable({
  name: v.string(),              // display name
  storageId: v.id("_storage"),   // Convex file storage reference
  url: v.optional(v.string()),   // derived on read
  type: v.string(),              // "building" | "decoration" | "vehicle" | "tile" | "cloud"
  tags: v.optional(v.array(v.string())),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  animationFrames: v.optional(v.number()),
}).index("by_type", ["type"])
```

### 3. Create query functions

**`convex/world.ts`:**
- `get` — returns the single world config doc

**`convex/entities.ts`:**
- `getAll` — returns all entities with resolved sprite URLs
- `getByType(type)` — returns entities filtered by type

**`convex/tiles.ts`:**
- `getAll` — returns all tile overrides

**`convex/assets.ts`:**
- `getAll` — returns all assets with resolved URLs
- `getByType(type)` — returns assets filtered by type
- `generateUploadUrl` — mutation that returns a signed upload URL

### 4. Create mutation functions

**`convex/world.ts`:**
- `update(fields)` — update world config fields

**`convex/entities.ts`:**
- `create(entity)` — create new entity
- `update(id, fields)` — update entity fields
- `remove(id)` — delete entity (and optionally clean up orphaned asset)
- `move(id, gridX, gridY)` — update entity position

**`convex/tiles.ts`:**
- `set(x, y, tileType)` — create or update tile override
- `setBatch(tiles[])` — batch upsert
- `remove(x, y)` — delete override (reverts to default)
- `removeBatch(positions[])` — batch delete

**`convex/assets.ts`:**
- `create(asset)` — register uploaded asset
- `remove(id)` — delete asset and storage file
- `removeUnused()` — clean up orphaned storage

### 5. Create seed function

**`convex/seed.ts`:**
- `seedWorld()` — idempotent: creates world config if none exists
  - Default: 20x20 grid, 64x32 tiles, "grass" default, "daylight" time, "summer" season, "clear" weather
- No seed data for entities/tiles — those come from the admin editor

### 6. Create useWorldData hook

**`src/hooks/useWorldData.ts`:**
```ts
function useWorldData(): WorldData {
  const world = useQuery(api.world.get);
  const entities = useQuery(api.entities.getAll);
  const tiles = useQuery(api.tiles.getAll);
  const assets = useQuery(api.assets.getAll);
  
  // Build tile grid from world config + sparse overrides
  // Assemble into WorldData object
  // Return { world, entities, tileGrid, assets, isLoading }
}
```

### 7. Define TypeScript types

**`src/types/world.ts`:**
```ts
interface WorldConfig { ... }
interface Entity { ... }
interface TileOverride { ... }
interface Asset { ... }
interface WorldData {
  world: WorldConfig;
  entities: Entity[];
  tileGrid: string[][];
  assets: Asset[];
  isLoading: boolean;
}
```

## Testing Steps (Chrome DevTools)

| # | What to Test | How to Verify |
|---|-------------|---------------|
| 1 | Convex dev starts | `npx convex dev` connects without errors |
| 2 | Schema deploys | No schema validation errors in Convex dashboard |
| 3 | Seed runs | World config document appears in Convex dashboard |
| 4 | useWorldData loads | Add `console.log(worldData)` in page.tsx — data appears in console |
| 5 | Tile grid builds | `worldData.tileGrid` is a 20x20 array of "grass" strings |
| 6 | isLoading works | isLoading is true briefly, then false when all queries resolve |
| 7 | Entities query works | `worldData.entities` is an empty array (no seed entities) |
| 8 | Assets query works | `worldData.assets` is an empty array |

## Checklist

- [x] Read `convex/_generated/ai/guidelines.md`
- [x] Fetched current Convex docs via context7
- [x] `convex/schema.ts` created with world, entities, tiles, assets tables
- [x] `convex/world.ts` — get, update queries/mutations
- [x] `convex/entities.ts` — getAll, getByType, create, update, remove, move
- [x] `convex/tiles.ts` — getAll, set, setBatch, remove, removeBatch
- [x] `convex/assets.ts` — getAll, getByType, generateUploadUrl, create, remove, removeUnused (also `update`)
- [x] `convex/seed.ts` — seedWorld function (idempotent)
- [x] Seed runs successfully and creates world config
- [x] `src/types/world.ts` — WorldData, WorldConfig, Entity, Asset types
- [x] `src/hooks/useWorldData.ts` — assembles all queries into WorldData
- [x] useWorldData returns data in React (verified with console.log in `IsometricCanvas` dev mode)
- [x] No Convex errors in console
- [x] Schema deploys cleanly

## Acceptance Criteria

1. `npx convex dev` starts and deploys schema without errors
2. Running the seed function creates a world config document
3. `useWorldData()` returns a complete `WorldData` object with `isLoading` flag
4. The tile grid is correctly assembled from world config defaults + sparse overrides
5. All query and mutation functions exist and are typed

## Files to Create / Modify

| Action | File |
|--------|------|
| Create | `convex/schema.ts` |
| Create | `convex/world.ts` |
| Create | `convex/entities.ts` |
| Create | `convex/tiles.ts` |
| Create | `convex/assets.ts` |
| Create | `convex/seed.ts` |
| Create | `src/types/world.ts` |
| Create | `src/hooks/useWorldData.ts` |
| Modify | `src/app/page.tsx` (add console.log for testing) |

## Blockers / Notes

_Updated during development._
