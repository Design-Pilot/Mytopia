"use client";

import { useState } from "react";

import type { WorldEntity } from "@/types/world";

type EditFields = {
  gridX: number;
  gridY: number;
  footprintW: number;
  footprintH: number;
};

export function EntityEditPanel({
  entity,
  onClose,
  onSave,
  onDelete,
  onFootprintChange,
}: {
  entity: WorldEntity;
  onClose: () => void;
  onSave: (patch: EditFields) => Promise<void>;
  onDelete: () => Promise<void>;
  onFootprintChange?: (w: number, h: number) => void;
}) {
  const [fields, setFields] = useState<EditFields>({
    gridX: entity.gridX,
    gridY: entity.gridY,
    footprintW: entity.footprintW ?? 1,
    footprintH: entity.footprintH ?? 1,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (key: keyof EditFields, value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    const next = { ...fields, [key]: num };
    setFields(next);
    if (key === "footprintW" || key === "footprintH") {
      onFootprintChange?.(next.footprintW, next.footprintH);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(fields);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onDelete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setDeleting(false);
    }
  };

  const busy = saving || deleting;

  return (
    <div
      className="absolute top-4 right-4 w-56 rounded-lg bg-black/70 p-4 text-sm text-white backdrop-blur"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate font-semibold">{entity.name}</span>
        <button
          type="button"
          className="shrink-0 text-white/50 hover:text-white"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <p className="mb-1 text-xs text-white/50">Position</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-0.5">
              <span className="text-xs text-white/60">Grid X</span>
              <input
                type="number"
                min={0}
                value={fields.gridX}
                onChange={(e) => setField("gridX", e.target.value)}
                className="rounded bg-white/10 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="text-xs text-white/60">Grid Y</span>
              <input
                type="number"
                min={0}
                value={fields.gridY}
                onChange={(e) => setField("gridY", e.target.value)}
                className="rounded bg-white/10 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </label>
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs text-white/50">Footprint (tiles)</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-0.5">
              <span className="text-xs text-white/60">Width</span>
              <input
                type="number"
                min={1}
                value={fields.footprintW}
                onChange={(e) => setField("footprintW", e.target.value)}
                className="rounded bg-white/10 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="text-xs text-white/60">Height</span>
              <input
                type="number"
                min={1}
                value={fields.footprintH}
                onChange={(e) => setField("footprintH", e.target.value)}
                className="rounded bg-white/10 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </label>
          </div>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={handleSave}
          className="flex-1 rounded bg-emerald-600 px-2 py-1.5 text-xs font-medium hover:bg-emerald-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handleDelete}
          className="rounded bg-red-700 px-2 py-1.5 text-xs font-medium hover:bg-red-600 disabled:opacity-50"
        >
          {deleting ? "…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
