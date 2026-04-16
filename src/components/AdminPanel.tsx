"use client";

import { useMutation } from "convex/react";
import { useRef, useState } from "react";

import { api } from "../../convex/_generated/api";
import { type Id } from "../../convex/_generated/dataModel";

type AssetType = "building" | "decoration" | "vehicle";
type UploadPhase = "idle" | "uploading" | "ready";

type Props = {
  isPendingPlacement: boolean;
  onAssetReadyToPlace: (
    assetId: Id<"assets">,
    name: string,
    entityType: AssetType,
    footprintW: number,
    footprintH: number,
  ) => void;
  onCancelPlacement: () => void;
};

export function AdminPanel({
  isPendingPlacement,
  onAssetReadyToPlace,
  onCancelPlacement,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("decoration");
  const [frames, setFrames] = useState(1);
  const [footprintW, setFootprintW] = useState(1);
  const [footprintH, setFootprintH] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.assets.generateUploadUrl);
  const createAsset = useMutation(api.assets.create);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setPhase("uploading");
    setError(null);

    try {
      const dims = await getImageDimensions(file);
      const uploadUrl = await generateUploadUrl();

      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);

      const { storageId } = (await res.json()) as { storageId: string };
      const assetName = name.trim() || file.name.replace(/\.[^.]+$/, "");

      const asset = await createAsset({
        asset: {
          name: assetName,
          storageId: storageId as Id<"_storage">,
          type: assetType,
          width: dims.width,
          height: dims.height,
          ...(frames > 1 ? { animationFrames: frames } : {}),
        },
      });

      if (!asset) throw new Error("Asset creation returned null.");

      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setPhase("ready");
      onAssetReadyToPlace(asset._id, assetName, assetType, footprintW, footprintH);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setPhase("idle");
    }
  }

  function handleCancel() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPhase("idle");
    setPreviewUrl(null);
    setName("");
    setFrames(1);
    setFootprintW(1);
    setFootprintH(1);
    if (fileRef.current) fileRef.current.value = "";
    onCancelPlacement();
  }

  function stopProp(e: React.PointerEvent | React.MouseEvent) {
    e.stopPropagation();
  }

  return (
    <>
      <button
        type="button"
        className="absolute right-4 top-4 z-10 rounded-md bg-black/50 px-3 py-1.5 text-sm text-white backdrop-blur transition hover:bg-black/70"
        onPointerDown={stopProp}
        onPointerUp={stopProp}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((v) => !v);
        }}
      >
        {isOpen ? "✕ Close" : "⚙ Admin"}
      </button>

      {isOpen && (
        <div
          className="absolute right-4 top-12 z-10 w-64 rounded-lg bg-black/75 p-4 text-sm text-white backdrop-blur"
          onPointerDown={stopProp}
          onPointerUp={stopProp}
          onClick={stopProp}
        >
          {isPendingPlacement ? (
            <PlacementReadyView
              previewUrl={previewUrl}
              footprintW={footprintW}
              footprintH={footprintH}
              onCancel={handleCancel}
            />
          ) : phase === "uploading" ? (
            <p className="text-xs text-white/60">Uploading…</p>
          ) : (
            <UploadForm
              fileRef={fileRef}
              name={name}
              assetType={assetType}
              frames={frames}
              footprintW={footprintW}
              footprintH={footprintH}
              error={error}
              onNameChange={setName}
              onTypeChange={setAssetType}
              onFramesChange={setFrames}
              onFootprintChange={(w, h) => {
                setFootprintW(w);
                setFootprintH(h);
              }}
              onFileChange={(f) => {
                if (f && !name) setName(f.name.replace(/\.[^.]+$/, ""));
              }}
              onUpload={handleUpload}
            />
          )}
        </div>
      )}
    </>
  );
}

// ─── sub-views ────────────────────────────────────────────────────────────────

function PlacementReadyView({
  previewUrl,
  footprintW,
  footprintH,
  onCancel,
}: {
  previewUrl: string | null;
  footprintW: number;
  footprintH: number;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="font-medium text-emerald-300">Click a tile to place</p>
      {previewUrl && (
        <>
          {/* blob: URLs are not supported by next/image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="asset preview"
            className="h-16 w-auto rounded border border-white/20 object-contain"
          />
        </>
      )}
      <p className="text-xs text-white/50">
        Footprint:{" "}
        <span className="text-white/80">
          {footprintW}×{footprintH} tile{footprintW * footprintH !== 1 ? "s" : ""}
        </span>
        . Hover a tile — it highlights gold. Click to place.
      </p>
      <button
        type="button"
        className="w-full rounded bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
}

const FOOTPRINT_PRESETS: [number, number][] = [
  [1, 1], [2, 1], [3, 1],
  [1, 2], [2, 2], [3, 2],
  [1, 3], [2, 3], [3, 3],
];

function FootprintPicker({
  w,
  h,
  onChange,
}: {
  w: number;
  h: number;
  onChange: (w: number, h: number) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-white/60">
        Footprint (tiles)
      </label>
      <div className="grid grid-cols-3 gap-1">
        {FOOTPRINT_PRESETS.map(([pw, ph]) => {
          const active = pw === w && ph === h;
          return (
            <button
              key={`${pw}x${ph}`}
              type="button"
              className={`rounded px-1 py-1 text-xs transition ${
                active
                  ? "bg-yellow-500/80 text-black font-medium"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
              onClick={() => onChange(pw, ph)}
            >
              {pw}×{ph}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UploadForm({
  fileRef,
  name,
  assetType,
  frames,
  footprintW,
  footprintH,
  error,
  onNameChange,
  onTypeChange,
  onFramesChange,
  onFootprintChange,
  onFileChange,
  onUpload,
}: {
  fileRef: React.RefObject<HTMLInputElement | null>;
  name: string;
  assetType: AssetType;
  frames: number;
  footprintW: number;
  footprintH: number;
  error: string | null;
  onNameChange: (v: string) => void;
  onTypeChange: (v: AssetType) => void;
  onFramesChange: (v: number) => void;
  onFootprintChange: (w: number, h: number) => void;
  onFileChange: (f: File | null) => void;
  onUpload: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="font-medium">Upload Asset</p>

      <div>
        <label className="mb-1 block text-xs text-white/60">Image file</label>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="w-full text-xs text-white/80 file:mr-2 file:rounded file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-xs file:text-white hover:file:bg-white/20"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-white/60">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Auto-filled from filename"
          className="w-full rounded bg-white/10 px-2 py-1 text-xs placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-white/60">Type</label>
        <select
          value={assetType}
          onChange={(e) => onTypeChange(e.target.value as AssetType)}
          className="w-full rounded bg-white/10 px-2 py-1 text-xs text-white focus:outline-none"
        >
          <option value="decoration">Decoration</option>
          <option value="building">Building</option>
          <option value="vehicle">Vehicle</option>
        </select>
      </div>

      <FootprintPicker w={footprintW} h={footprintH} onChange={onFootprintChange} />

      <div>
        <label className="mb-1 block text-xs text-white/60">
          Animation frames{" "}
          <span className="text-white/30">(1 = static)</span>
        </label>
        <input
          type="number"
          min={1}
          max={64}
          value={frames}
          onChange={(e) =>
            onFramesChange(Math.max(1, parseInt(e.target.value, 10) || 1))
          }
          className="w-full rounded bg-white/10 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-white/30"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="button"
        className="w-full rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium transition hover:bg-emerald-500"
        onClick={onUpload}
      >
        Upload &amp; Place
      </button>
    </div>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image dimensions."));
    };
    img.src = url;
  });
}
