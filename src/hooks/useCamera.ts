"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  type IsoMathConfig,
  screenToTile,
} from "@/lib/isoMath";

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 3;
const DRAG_THRESHOLD_PX = 3;
const ZOOM_RESET_DURATION_MS = 220;

export type HoverTile = { gx: number; gy: number };

export type UseCameraOptions = {
  viewportWidth: number;
  viewportHeight: number;
  gridWidth: number;
  gridHeight: number;
  isoConfig: IsoMathConfig;
  worldCenterX: number;
  worldCenterY: number;
  worldWidth: number;
  worldHeight: number;
};

export function useCamera({
  viewportWidth,
  viewportHeight,
  gridWidth,
  gridHeight,
  isoConfig,
  worldCenterX,
  worldCenterY,
  worldWidth,
  worldHeight,
}: UseCameraOptions) {
  const fitPadding = Math.min(
    64,
    Math.max(24, Math.min(viewportWidth, viewportHeight) * 0.05),
  );
  const autoZoom = Math.min(
    MAX_ZOOM,
    Math.max(
      MIN_ZOOM,
      Math.min(
        (viewportWidth - fitPadding * 2) / worldWidth,
        (viewportHeight - fitPadding * 2) / worldHeight,
        1.35,
      ),
    ),
  );

  const [camera, setCamera] = useState<{
    centerWorldX: number;
    centerWorldY: number;
    zoom: number;
  } | null>(null);
  const [hoverTile, setHoverTile] = useState<HoverTile | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const centerWorldX = camera?.centerWorldX ?? worldCenterX;
  const centerWorldY = camera?.centerWorldY ?? worldCenterY;
  const zoom = camera?.zoom ?? autoZoom;
  const panX = viewportWidth / 2 - centerWorldX * zoom;
  const panY = viewportHeight / 2 - centerWorldY * zoom;

  const panXRef = useRef(panX);
  const panYRef = useRef(panY);
  const zoomRef = useRef(zoom);
  const centerWorldXRef = useRef(centerWorldX);
  const centerWorldYRef = useRef(centerWorldY);
  const animationFrameRef = useRef<number | null>(null);
  useEffect(() => {
    panXRef.current = panX;
  }, [panX]);
  useEffect(() => {
    panYRef.current = panY;
  }, [panY]);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  useEffect(() => {
    centerWorldXRef.current = centerWorldX;
  }, [centerWorldX]);
  useEffect(() => {
    centerWorldYRef.current = centerWorldY;
  }, [centerWorldY]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const setCenteredCamera = useCallback(
    (
      nextCenterWorldX: number,
      nextCenterWorldY: number,
      nextZoom: number,
    ) => {
      const normalizedZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, nextZoom),
      );
      const nextPanX =
        viewportWidth / 2 - nextCenterWorldX * normalizedZoom;
      const nextPanY =
        viewportHeight / 2 - nextCenterWorldY * normalizedZoom;

      panXRef.current = nextPanX;
      panYRef.current = nextPanY;
      zoomRef.current = normalizedZoom;
      centerWorldXRef.current = nextCenterWorldX;
      centerWorldYRef.current = nextCenterWorldY;

      setCamera({
        centerWorldX: nextCenterWorldX,
        centerWorldY: nextCenterWorldY,
        zoom: normalizedZoom,
      });
    },
    [viewportHeight, viewportWidth],
  );

  const cancelZoomAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const commitCamera = useCallback(
    (nextPanX: number, nextPanY: number, nextZoom: number) => {
      cancelZoomAnimation();
      const normalizedZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, nextZoom),
      );
      const nextCenterWorldX =
        (viewportWidth / 2 - nextPanX) / normalizedZoom;
      const nextCenterWorldY =
        (viewportHeight / 2 - nextPanY) / normalizedZoom;

      setCenteredCamera(
        nextCenterWorldX,
        nextCenterWorldY,
        normalizedZoom,
      );
    },
    [cancelZoomAnimation, setCenteredCamera, viewportHeight, viewportWidth],
  );

  const animateZoomTo = useCallback(
    (targetZoom: number) => {
      cancelZoomAnimation();

      const normalizedTargetZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, targetZoom),
      );
      const startZoom = zoomRef.current;

      if (Math.abs(startZoom - normalizedTargetZoom) < 0.001) {
        setCenteredCamera(
          centerWorldXRef.current,
          centerWorldYRef.current,
          normalizedTargetZoom,
        );
        return;
      }

      const startTime = performance.now();
      const startCenterWorldX = centerWorldXRef.current;
      const startCenterWorldY = centerWorldYRef.current;

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(
          1,
          elapsed / ZOOM_RESET_DURATION_MS,
        );
        const eased = 1 - Math.pow(1 - progress, 3);
        const nextZoom =
          startZoom + (normalizedTargetZoom - startZoom) * eased;

        setCenteredCamera(
          startCenterWorldX,
          startCenterWorldY,
          nextZoom,
        );

        if (progress < 1) {
          animationFrameRef.current =
            window.requestAnimationFrame(step);
        } else {
          animationFrameRef.current = null;
        }
      };

      animationFrameRef.current = window.requestAnimationFrame(step);
    },
    [cancelZoomAnimation, setCenteredCamera],
  );

  const pointers = useRef(
    new Map<number, { clientX: number; clientY: number }>(),
  );
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    active: boolean;
    lastX: number;
    lastY: number;
  } | null>(null);
  const pinchInitialRef = useRef<{
    distance: number;
    zoom: number;
  } | null>(null);

  const tileFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      const wx = (sx - panXRef.current) / zoomRef.current;
      const wy = (sy - panYRef.current) / zoomRef.current;
      const { gridX, gridY } = screenToTile(wx, wy, isoConfig);
      const gx = Math.round(gridX);
      const gy = Math.round(gridY);
      if (gx >= 0 && gx < gridWidth && gy >= 0 && gy < gridHeight) {
        return { gx, gy };
      }
      return null;
    },
    [gridHeight, gridWidth, isoConfig],
  );

  const applyZoomTowardScreenPoint = useCallback(
    (screenX: number, screenY: number, newZoom: number) => {
      const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
      const wx = (screenX - panXRef.current) / zoomRef.current;
      const wy = (screenY - panYRef.current) / zoomRef.current;
      const nx = screenX - wx * z;
      const ny = screenY - wy * z;
      commitCamera(nx, ny, z);
    },
    [commitCamera],
  );

  const panByScreenDelta = useCallback(
    (deltaX: number, deltaY: number) => {
      commitCamera(
        panXRef.current - deltaX,
        panYRef.current - deltaY,
        zoomRef.current,
      );
    },
    [commitCamera],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const rect = el.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const isPinchGesture = e.ctrlKey || e.metaKey;

      if (isPinchGesture) {
        e.preventDefault();
        const factor = Math.exp(-e.deltaY * 0.01);
        applyZoomTowardScreenPoint(
          sx,
          sy,
          zoomRef.current * factor,
        );
        return;
      }

      e.preventDefault();
      panByScreenDelta(e.deltaX, e.deltaY);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [applyZoomTowardScreenPoint, panByScreenDelta]);

  useEffect(() => {
    return () => cancelZoomAnimation();
  }, [cancelZoomAnimation]);

  const distance = (a: { clientX: number; clientY: number }, b: typeof a) =>
    Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    pointers.current.set(e.pointerId, {
      clientX: e.clientX,
      clientY: e.clientY,
    });

    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      pinchInitialRef.current = {
        distance: distance(pts[0], pts[1]),
        zoom: zoomRef.current,
      };
      dragRef.current = null;
      setIsDragging(false);
      return;
    }

    if (pointers.current.size === 1) {
      pinchInitialRef.current = null;
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        active: false,
        lastX: e.clientX,
        lastY: e.clientY,
      };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (pointers.current.has(e.pointerId)) {
        pointers.current.set(e.pointerId, {
          clientX: e.clientX,
          clientY: e.clientY,
        });
      }

      if (pointers.current.size === 2) {
        const pts = [...pointers.current.values()];
        const dist = distance(pts[0], pts[1]);
        const pi = pinchInitialRef.current;
        const rect = containerRef.current?.getBoundingClientRect();
        if (pi && rect) {
          const newZoom = Math.min(
            MAX_ZOOM,
            Math.max(MIN_ZOOM, pi.zoom * (dist / pi.distance)),
          );
          const midX =
            (pts[0].clientX + pts[1].clientX) / 2 - rect.left;
          const midY =
            (pts[0].clientY + pts[1].clientY) / 2 - rect.top;
          const wx = (midX - panXRef.current) / zoomRef.current;
          const wy = (midY - panYRef.current) / zoomRef.current;
          const nx = midX - wx * newZoom;
          const ny = midY - wy * newZoom;
          commitCamera(nx, ny, newZoom);
        }
        setHoverTile(null);
        return;
      }

      const drag = dragRef.current;
      if (drag && e.pointerId === drag.pointerId) {
        const dx = e.clientX - drag.lastX;
        const dy = e.clientY - drag.lastY;
        drag.lastX = e.clientX;
        drag.lastY = e.clientY;

        const totalDx = e.clientX - drag.startX;
        const totalDy = e.clientY - drag.startY;
        if (!drag.active) {
          if (Math.hypot(totalDx, totalDy) > DRAG_THRESHOLD_PX) {
            drag.active = true;
            setIsDragging(true);
          }
        }
        if (drag.active) {
          commitCamera(
            panXRef.current + dx,
            panYRef.current + dy,
            zoomRef.current,
          );
        }
      }

      if (!drag?.active && pointers.current.size <= 1) {
        setHoverTile(tileFromClient(e.clientX, e.clientY));
      }
    },
    [commitCamera, tileFromClient],
  );

  const endPointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) {
        pinchInitialRef.current = null;
      }
      const drag = dragRef.current;
      if (drag && e.pointerId === drag.pointerId) {
        dragRef.current = null;
        setIsDragging(false);
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
    },
    [],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      endPointer(e);
    },
    [endPointer],
  );

  const onPointerLeave = useCallback(() => {
    if (!isDragging) {
      setHoverTile(null);
    }
  }, [isDragging]);

  return {
    containerRef,
    panX,
    panY,
    zoom,
    animateZoomTo,
    hoverTile,
    cursor: isDragging ? ("grabbing" as const) : ("grab" as const),
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: endPointer,
    onPointerLeave,
  };
}
