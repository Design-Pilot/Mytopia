import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** PixiJS + @pixi/react can misbehave when React Strict Mode double-mounts the canvas. */
  reactStrictMode: false,
};

export default nextConfig;
