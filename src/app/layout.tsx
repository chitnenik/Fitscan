import type { Metadata, Viewport } from "next";
import BottomNav from "@/components/BottomNav";
import { ScanProvider } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitScan · Clothes that actually fit",
  description: "Scan your body, verify sizes across retailers, and shop only what fits.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05080f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh font-sans antialiased">
        <ScanProvider>
          <div className="mx-auto min-h-dvh max-w-md pb-24">{children}</div>
          <BottomNav />
        </ScanProvider>
      </body>
    </html>
  );
}
