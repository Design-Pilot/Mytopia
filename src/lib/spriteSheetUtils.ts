import { Rectangle, Texture } from "pixi.js";

export function sliceHorizontalSpriteStrip(
  texture: Texture,
  frameCount: number,
): Texture[] {
  const safeFrameCount = Math.max(1, Math.floor(frameCount));

  if (safeFrameCount <= 1 || texture.width <= 1) {
    return [texture];
  }

  const frameWidth = Math.floor(texture.width / safeFrameCount);
  const frameHeight = Math.floor(texture.height);

  if (frameWidth <= 0 || frameHeight <= 0) {
    return [texture];
  }

  return Array.from({ length: safeFrameCount }, (_, index) => {
    const frameX = index * frameWidth;
    const remainingWidth = texture.width - frameX;
    const width =
      index === safeFrameCount - 1
        ? Math.max(1, Math.floor(remainingWidth))
        : frameWidth;

    return new Texture({
      source: texture.source,
      frame: new Rectangle(frameX, 0, width, frameHeight),
    });
  });
}
