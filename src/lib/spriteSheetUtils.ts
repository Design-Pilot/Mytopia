import { Rectangle, Texture } from "pixi.js";

export function sliceHorizontalSpriteStrip(
  texture: Texture,
  frameCount: number,
): Texture[] {
  // Use the texture's existing frame so atlas sub-textures are sliced
  // relative to their actual offset on the source image rather than (0, 0).
  const sourceFrame = texture.frame;
  const stripWidth = Math.floor(sourceFrame.width);
  const stripHeight = Math.floor(sourceFrame.height);

  const safeFrameCount = Math.max(1, Math.floor(frameCount));

  if (safeFrameCount <= 1 || stripWidth <= 1) {
    return [texture];
  }

  const frameWidth = Math.floor(stripWidth / safeFrameCount);
  const frameHeight = stripHeight;

  if (frameWidth <= 0 || frameHeight <= 0) {
    return [texture];
  }

  return Array.from({ length: safeFrameCount }, (_, index) => {
    const frameX = sourceFrame.x + index * frameWidth;
    const remainingWidth = stripWidth - index * frameWidth;
    const width =
      index === safeFrameCount - 1
        ? Math.max(1, Math.floor(remainingWidth))
        : frameWidth;

    return new Texture({
      source: texture.source,
      frame: new Rectangle(frameX, sourceFrame.y, width, frameHeight),
    });
  });
}
