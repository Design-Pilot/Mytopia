"use client";

import { useLayoutEffect, useRef, useState } from "react";

import type { WorldEntity } from "@/types/world";

type TooltipProps = {
  entity: WorldEntity;
  point: {
    x: number;
    y: number;
  };
};

const TOOLTIP_OFFSET = 16;
const VIEWPORT_MARGIN = 12;

export function Tooltip({ entity, point }: TooltipProps) {
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const [position, setPosition] = useState(() => ({
    left: point.x + TOOLTIP_OFFSET,
    top: point.y + TOOLTIP_OFFSET,
  }));

  // Measure the tooltip's rendered size when content changes. Reading the DOM
  // only when the entity changes (not on every pointer move) avoids forced
  // layout on the hottest interaction path.
  useLayoutEffect(() => {
    const el = tooltipRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    sizeRef.current = { width, height };
    // Also clamp immediately with the freshly-measured size so the first
    // render after an entity change is already in the right position.
    const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN;
    const maxTop = window.innerHeight - height - VIEWPORT_MARGIN;
    setPosition({
      left: Math.max(VIEWPORT_MARGIN, Math.min(point.x + TOOLTIP_OFFSET, maxLeft)),
      top: Math.max(VIEWPORT_MARGIN, Math.min(point.y + TOOLTIP_OFFSET, maxTop)),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity._id]);

  // Clamp position using the cached size when the pointer moves. No DOM reads.
  useLayoutEffect(() => {
    const { width, height } = sizeRef.current;
    const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN;
    const maxTop = window.innerHeight - height - VIEWPORT_MARGIN;
    setPosition({
      left: Math.max(
        VIEWPORT_MARGIN,
        Math.min(point.x + TOOLTIP_OFFSET, maxLeft),
      ),
      top: Math.max(
        VIEWPORT_MARGIN,
        Math.min(point.y + TOOLTIP_OFFSET, maxTop),
      ),
    });
  }, [point.x, point.y]);

  return (
    <div
      ref={tooltipRef}
      className="pointer-events-none fixed z-50 max-w-xs rounded-xl border border-white/10 bg-slate-950/90 px-4 py-3 text-white shadow-2xl backdrop-blur-md"
      style={{
        left: position.left,
        top: position.top,
      }}
    >
      <div className="space-y-2">
        <div>
          <p className="text-sm font-semibold text-emerald-100">{entity.name}</p>
          {entity.description ? (
            <p className="mt-1 text-sm leading-5 text-slate-200">
              {entity.description}
            </p>
          ) : null}
        </div>

        {entity.techStack?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {entity.techStack.map((tech) => (
              <span
                key={tech}
                className="rounded-full bg-emerald-400/12 px-2 py-0.5 text-xs text-emerald-100"
              >
                {tech}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 text-xs text-slate-300">
          {entity.category ? (
            <span className="rounded-full bg-white/6 px-2 py-0.5">
              {entity.category}
            </span>
          ) : null}
          {entity.status ? (
            <span className="rounded-full bg-white/6 px-2 py-0.5">
              {entity.status}
            </span>
          ) : null}
        </div>

        {entity.url ? (
          <p className="text-xs break-all text-sky-300">{entity.url}</p>
        ) : null}
      </div>
    </div>
  );
}
