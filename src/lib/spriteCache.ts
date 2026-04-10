import { Assets, type Texture } from "pixi.js";

const textureByUrl = new Map<string, Texture>();
const inflightByUrl = new Map<string, Promise<Texture>>();

/**
 * Loads a remote texture once and reuses it (Pixi Assets + in-memory map).
 */
export function loadTextureCached(url: string): Promise<Texture> {
  const hit = textureByUrl.get(url);
  if (hit) {
    return Promise.resolve(hit);
  }

  let inflight = inflightByUrl.get(url);
  if (!inflight) {
    inflight = Assets.load<Texture>(url)
      .then((texture) => {
        textureByUrl.set(url, texture);
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
  return textureByUrl.get(url);
}
