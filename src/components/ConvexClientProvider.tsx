"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { type ReactNode, useMemo } from "react";

type Props = {
  children: ReactNode;
};

export function ConvexClientProvider({ children }: Props) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;

  const client = useMemo(() => {
    if (!url) return null;
    return new ConvexReactClient(url);
  }, [url]);

  if (!url || !client) {
    if (typeof window !== "undefined") {
      console.warn(
        "NEXT_PUBLIC_CONVEX_URL is not set. Add it to .env.local (run `npx convex dev` once).",
      );
    }
    return children;
  }

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
