import { Assets, type Texture } from "pixi.js";

const textureByUrl = new Map<string, Texture>();
const inflightByUrl = new Map<string, Promise<Texture>>();
const MAX_CACHED_TEXTURES = 256;

function markTextureRecent(url: string, texture: Texture): Texture {
  textureByUrl.delete(url);
  textureByUrl.set(url, texture);
  return texture;
}

function evictOldestIfNeeded() {
  while (textureByUrl.size > MAX_CACHED_TEXTURES) {
    const oldestKey = textureByUrl.keys().next().value;
    if (oldestKey === undefined) {
      return;
    }

    textureByUrl.delete(oldestKey);
    inflightByUrl.delete(oldestKey);
  }
}

/**
 * Loads a remote texture once and reuses it (Pixi Assets + in-memory map).
 */
export function loadTextureCached(url: string): Promise<Texture> {
  const hit = textureByUrl.get(url);
  if (hit) {
    return Promise.resolve(markTextureRecent(url, hit));
  }

  let inflight = inflightByUrl.get(url);
  if (!inflight) {
    inflight = Assets.load<Texture>(url)
      .then((texture) => {
        markTextureRecent(url, texture);
        evictOldestIfNeeded();
        inflightByUrl.delete(url);
        return texture;
      })
      .catch((error: unknown) => {
        inflightByUrl.delete(url);
        throw error;
      });
    inflightByUrl.set(url, inflight);
  }

  return inflight;
}

export function getCachedTexture(url: string): Texture | undefined {
  const hit = textureByUrl.get(url);
  return hit ? markTextureRecent(url, hit) : undefined;
}
