import type { Metadata } from "next";

import { ConvexClientProvider } from "@/components/ConvexClientProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "MyTopia",
  description: "Isometric pixel-art portfolio city",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen" suppressHydrationWarning>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
