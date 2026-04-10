import { IsometricCanvas } from "@/components/IsometricCanvas";

export default function HomePage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <IsometricCanvas />
      <p className="pointer-events-none absolute left-4 top-4 rounded-md bg-black/40 px-3 py-1.5 text-sm text-emerald-100 backdrop-blur">
        MyTopia — Phase 3 data layer
      </p>
    </main>
  );
}
