import { type Doc, type Id } from "../../convex/_generated/dataModel";

export type TimeOfDay = "dawn" | "daylight" | "goldenHour" | "dusk" | "night";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type Weather = "clear" | "cloudy" | "rain" | "snow";
export type TileType = "grass" | "water" | "road";
export type EntityType = "building" | "decoration" | "vehicle";
export type EntityCategory =
  | "project"
  | "company"
  | "education"
  | "community"
  | "personal"
  | "landmark";
export type EntityStatus = "active" | "archived" | "wip";
export type AssetType = "building" | "decoration" | "vehicle" | "tile" | "cloud";

export type WorldConfig = {
  gridWidth: number;
  gridHeight: number;
  tileWidth: number;
  tileHeight: number;
  defaultTile: TileType;
  timeOfDay?: TimeOfDay;
  season?: Season;
  weather?: Weather;
  phase4DemoSeeded?: boolean;
  phase6DemoSeeded?: boolean;
  phase7DemoSeeded?: boolean;
};

export type SeasonalAssets = Partial<Record<Season, Id<"assets">>>;

export type WorldEntity = Doc<"entities"> & {
  type: EntityType;
  category?: EntityCategory;
  status?: EntityStatus;
  spriteUrl?: string;
  seasonalAssets?: SeasonalAssets;
};

export type TileOverride = Doc<"tiles"> & {
  tileType: TileType;
};

export type WorldAsset = Doc<"assets"> & {
  type: AssetType;
  url?: string;
};

export type TileGrid = TileType[][];

export type WorldData = {
  world: WorldConfig;
  entities: WorldEntity[];
  tileGrid: TileGrid;
  assets: WorldAsset[];
  isLoading: boolean;
  bootstrapFailed: boolean;
};

export const DEFAULT_WORLD_CONFIG: WorldConfig = {
  gridWidth: 20,
  gridHeight: 20,
  tileWidth: 64,
  tileHeight: 32,
  defaultTile: "grass",
  timeOfDay: "daylight",
  season: "summer",
  weather: "clear",
};
