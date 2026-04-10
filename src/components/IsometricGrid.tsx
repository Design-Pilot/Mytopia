"use client";

import { Application, extend } from "@pixi/react";
import { Container, Graphics } from "pixi.js";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useCamera } from "@/hooks/useCamera";
import {
  createDefaultIsoConfig,
  getGridWorldCenter,
  grassColorForTile,
  GRID_HEIGHT,
  GRID_WIDTH,
  tileToScreen,
} from "@/lib/isoMath";

extend({ Container, Graphics });

const CANVAS_BACKGROUND = 0x2a3d2f;

function drawDiamond(
  g: Graphics,
  cx: number,
  cy: number,
  halfW: number,
  halfH: number,
) {
  g.poly(
    [
      cx,
      cy - halfH,
      cx + halfW,
      cy,
      cx,
      cy + halfH,
      cx - halfW,
      cy,
    ],
    true,
  );
}

export function IsometricGrid() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const isoConfig = useMemo(() => createDefaultIsoConfig(), []);
  const worldCenter = useMemo(
    () => getGridWorldCenter(isoConfig, GRID_WIDTH, GRID_HEIGHT),
    [isoConfig],
  );
  const worldWidth = useMemo(
    () => ((GRID_WIDTH + GRID_HEIGHT) * isoConfig.tileWidth) / 2,
    [isoConfig],
  );
  const worldHeight = useMemo(
    () => ((GRID_WIDTH + GRID_HEIGHT) * isoConfig.tileHeight) / 2,
    [isoConfig],
  );

  const {
    containerRef,
    panX,
    panY,
    zoom,
    animateZoomTo,
    hoverTile,
    cursor,
    onPointerCancel,
    onPointerDown,
    onPointerLeave,
    onPointerMove,
    onPointerUp,
  } = useCamera({
    viewportWidth: size.width,
    viewportHeight: size.height,
    isoConfig,
    worldCenterX: worldCenter.screenX,
    worldCenterY: worldCenter.screenY,
    worldWidth,
    worldHeight,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      setSize({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  const halfW = isoConfig.tileWidth / 2;
  const halfH = isoConfig.tileHeight / 2;

  const drawTiles = useCallback(
    (g: Graphics) => {
      g.clear();
      for (let gx = 0; gx < GRID_WIDTH; gx++) {
        for (let gy = 0; gy < GRID_HEIGHT; gy++) {
          const c = tileToScreen(gx, gy, isoConfig);
          const color = grassColorForTile(gx, gy);
          drawDiamond(g, c.screenX, c.screenY, halfW, halfH);
          g.fill({ color });
        }
      }
    },
    [halfH, halfW, isoConfig],
  );

  const drawHover = useCallback(
    (g: Graphics) => {
      g.clear();
      const ht = hoverTile;
      if (!ht) return;
      const c = tileToScreen(ht.gx, ht.gy, isoConfig);
      const pts = [
        c.screenX,
        c.screenY - halfH,
        c.screenX + halfW,
        c.screenY,
        c.screenX,
        c.screenY + halfH,
        c.screenX - halfW,
        c.screenY,
      ];
      g.poly(pts, true)
        .fill({ color: 0xa8f0c0, alpha: 0.45 })
        .stroke({ width: 2, color: 0xffffff, alpha: 0.9 });
    },
    [hoverTile, halfH, halfW, isoConfig],
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none select-none"
      style={{ cursor }}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerLeave={onPointerLeave}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {size.width > 0 && size.height > 0 ? (
        <Application
          antialias
          backgroundColor={CANVAS_BACKGROUND}
          className="block"
          resizeTo={containerRef}
        >
          <pixiContainer scale={zoom} x={panX} y={panY}>
            <pixiGraphics draw={drawTiles} />
            <pixiGraphics draw={drawHover} />
          </pixiContainer>
        </Application>
      ) : null}
      <button
        type="button"
        className="absolute bottom-4 right-4 rounded-md bg-black/40 px-3 py-1.5 text-sm text-emerald-100 backdrop-blur transition hover:bg-black/55"
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          animateZoomTo(1);
        }}
      >
        Zoom {Math.round(zoom * 100)}%
      </button>
    </div>
  );
}
