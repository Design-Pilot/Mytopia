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
const BUILDING_DEMO_SPRITES = [
  "https://dummyimage.com/56x80/2f6b4c/e8fff3.png?text=S",
  "https://dummyimage.com/48x72/355d86/e8f0ff.png?text=W",
  "https://dummyimage.com/52x88/7a4b33/fff4e8.png?text=L",
] as const;

function svgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const DECORATION_DEMO_SPRITES = {
  animatedFountainStrip: svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="144" height="48" viewBox="0 0 144 48">
      <rect width="144" height="48" fill="#1f2937"/>
      <g transform="translate(0 0)">
        <ellipse cx="24" cy="40" rx="16" ry="6" fill="#0f766e"/>
        <ellipse cx="24" cy="37" rx="12" ry="4" fill="#67e8f9" fill-opacity="0.9"/>
        <rect x="21" y="18" width="6" height="16" rx="3" fill="#67e8f9"/>
        <circle cx="24" cy="14" r="3" fill="#cffafe"/>
      </g>
      <g transform="translate(48 0)">
        <ellipse cx="24" cy="40" rx="16" ry="6" fill="#0f766e"/>
        <ellipse cx="24" cy="36" rx="13" ry="5" fill="#7dd3fc" fill-opacity="0.95"/>
        <rect x="20" y="14" width="8" height="18" rx="4" fill="#7dd3fc"/>
        <circle cx="24" cy="10" r="4" fill="#e0f2fe"/>
      </g>
      <g transform="translate(96 0)">
        <ellipse cx="24" cy="40" rx="16" ry="6" fill="#0f766e"/>
        <ellipse cx="24" cy="37" rx="12" ry="4" fill="#a5f3fc" fill-opacity="0.92"/>
        <rect x="21" y="20" width="6" height="13" rx="3" fill="#a5f3fc"/>
        <circle cx="24" cy="17" r="2.5" fill="#ecfeff"/>
      </g>
    </svg>
  `),
  bench: "https://dummyimage.com/56x36/6b4f3a/f8ecdc.png?text=Bench",
  shrubs: "https://dummyimage.com/72x54/355f3a/e6ffe8.png?text=Bush",
  streetlamp: "https://dummyimage.com/36x76/2b2f36/fef3c7.png?text=Lamp",
  willowTree: svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="72" height="112" viewBox="0 0 72 112">
      <rect width="72" height="112" fill="none"/>
      <rect x="31" y="54" width="10" height="42" rx="4" fill="#5b3a29"/>
      <ellipse cx="36" cy="36" rx="23" ry="28" fill="#3f7a47"/>
      <ellipse cx="22" cy="42" rx="11" ry="20" fill="#5fa35d" fill-opacity="0.95"/>
      <ellipse cx="50" cy="44" rx="12" ry="22" fill="#69b06a" fill-opacity="0.92"/>
      <path d="M18 54 C14 66 16 78 22 88" stroke="#82c67d" stroke-width="4" stroke-linecap="round"/>
      <path d="M28 58 C24 72 26 88 31 98" stroke="#8fd387" stroke-width="4" stroke-linecap="round"/>
      <path d="M44 58 C46 70 45 86 41 99" stroke="#8fd387" stroke-width="4" stroke-linecap="round"/>
      <path d="M54 54 C58 66 57 78 52 91" stroke="#82c67d" stroke-width="4" stroke-linecap="round"/>
    </svg>
  `),
  gardenBush: svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="72" height="56" viewBox="0 0 72 56">
      <rect width="72" height="56" fill="none"/>
      <ellipse cx="21" cy="32" rx="15" ry="14" fill="#3f7f43"/>
      <ellipse cx="36" cy="24" rx="18" ry="16" fill="#5ca85a"/>
      <ellipse cx="52" cy="33" rx="15" ry="13" fill="#46894a"/>
      <ellipse cx="36" cy="40" rx="24" ry="8" fill="#2d5f34" fill-opacity="0.45"/>
    </svg>
  `),
} as const;

async function findEntityByName(ctx: MutationCtx, name: string) {
  const entities = await ctx.db.query("entities").collect();
  return entities.find((entity) => entity.name === name) ?? null;
}

async function upsertDemoEntity(
  ctx: MutationCtx,
  name: string,
  value: Omit<
    Parameters<typeof ctx.db.insert<"entities">>[1],
    "name"
  >,
) {
  const existing = await findEntityByName(ctx, name);

  if (existing) {
    await ctx.db.patch(existing._id, value);
    return existing._id;
  }

  return await ctx.db.insert("entities", {
    ...value,
    name,
  });
}

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
  if (!world) {
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

  await upsertDemoEntity(ctx, "Demo Studio", {
    type: "building",
    description: "Phase 4 demo building (2×2 footprint)",
    gridX: 6,
    gridY: 6,
    category: "project",
    status: "wip",
    spriteUrl: BUILDING_DEMO_SPRITES[0],
    footprintW: 2,
    footprintH: 2,
  });

  await upsertDemoEntity(ctx, "Demo Workshop", {
    type: "building",
    gridX: 12,
    gridY: 8,
    category: "company",
    status: "active",
    spriteUrl: BUILDING_DEMO_SPRITES[1],
    footprintW: 1,
    footprintH: 1,
  });

  await upsertDemoEntity(ctx, "Demo Loft", {
    type: "building",
    gridX: 9,
    gridY: 4,
    category: "personal",
    status: "active",
    spriteUrl: BUILDING_DEMO_SPRITES[2],
    footprintW: 1,
    footprintH: 2,
  });

  await ctx.db.patch(worldId, { phase4DemoSeeded: true });
}

async function insertPhase6Demo(ctx: MutationCtx, worldId: Id<"world">) {
  const world = await ctx.db.get(worldId);
  if (!world) {
    return;
  }

  await upsertDemoEntity(ctx, "Streetlamp", {
    type: "decoration",
    description: "Phase 6 demo decoration with a warm light glow.",
    gridX: 10,
    gridY: 9,
    spriteUrl: DECORATION_DEMO_SPRITES.streetlamp,
    footprintW: 1,
    footprintH: 1,
  });

  await upsertDemoEntity(ctx, "Bench", {
    type: "decoration",
    description: "Phase 6 demo decoration placed near the workshop.",
    gridX: 13,
    gridY: 9,
    spriteUrl: DECORATION_DEMO_SPRITES.bench,
    footprintW: 1,
    footprintH: 1,
  });

  await upsertDemoEntity(ctx, "Shrub Cluster", {
    type: "decoration",
    description: "Phase 6 demo greenery for the island paths.",
    gridX: 7,
    gridY: 9,
    spriteUrl: DECORATION_DEMO_SPRITES.shrubs,
    footprintW: 1,
    footprintH: 1,
  });

  await upsertDemoEntity(ctx, "Fountain Ripple", {
    type: "decoration",
    description: "Phase 6 animated strip demo using a single horizontal sprite.",
    gridX: 10,
    gridY: 13,
    spriteUrl: DECORATION_DEMO_SPRITES.animatedFountainStrip,
    animationFrames: 3,
    animationSpeed: 0.12,
    footprintW: 1,
    footprintH: 1,
  });

  await ctx.db.patch(worldId, { phase6DemoSeeded: true });
}

async function insertPhase7Demo(ctx: MutationCtx, worldId: Id<"world">) {
  const world = await ctx.db.get(worldId);
  if (!world) {
    return;
  }

  await upsertDemoEntity(ctx, "Willow Tree", {
    type: "decoration",
    description: "Phase 7 sway demo tree for ambient motion polish.",
    gridX: 5,
    gridY: 8,
    spriteUrl: DECORATION_DEMO_SPRITES.willowTree,
    footprintW: 1,
    footprintH: 1,
  });

  await upsertDemoEntity(ctx, "Garden Bush", {
    type: "decoration",
    description: "Phase 7 sway demo greenery near the central path.",
    gridX: 9,
    gridY: 11,
    spriteUrl: DECORATION_DEMO_SPRITES.gardenBush,
    footprintW: 1,
    footprintH: 1,
  });

  await upsertDemoEntity(ctx, "Shrub Cluster", {
    type: "decoration",
    description: "Phase 7 updated greenery tuned for ambient sway.",
    gridX: 7,
    gridY: 9,
    spriteUrl: DECORATION_DEMO_SPRITES.gardenBush,
    footprintW: 1,
    footprintH: 1,
  });

  await ctx.db.patch(worldId, { phase7DemoSeeded: true });
}

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

    if (world) {
      await insertPhase4Demo(ctx, world._id);
      world = await ctx.db.get(world._id);
    }

    if (world) {
      await insertPhase6Demo(ctx, world._id);
      world = await ctx.db.get(world._id);
    }

    if (world) {
      await insertPhase7Demo(ctx, world._id);
      world = await ctx.db.get(world._id);
    }

    return world;
  },
});
