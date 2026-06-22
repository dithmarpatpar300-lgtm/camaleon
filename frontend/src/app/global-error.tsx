"use client";

import { useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Camaleon global error:", error);
  }, [error]);

  const msg = error?.message ?? String(error ?? "Unknown error");
  const isChunkError =
    msg.includes("ChunkLoadError") ||
    msg.includes("Loading chunk") ||
    msg.includes("Failed to fetch");

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-[#0E0F11]`}
      >
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
          <h1 className="text-xl font-semibold text-[#F2F4F5]">
            {isChunkError
              ? "Page not available offline"
              : "Something went wrong"}
          </h1>
          <p className="max-w-md text-sm text-[#9BA1A8]">
            {isChunkError
              ? "This page couldn't load because Camaleon is in offline mode. Reload the page or disable offline mode in Settings to continue."
              : "An unexpected error occurred. Reloading the page usually fixes it."}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-[#262A2F] bg-[#1C1F23] px-4 py-2 text-sm font-medium text-[#F2F4F5] hover:border-[#22C55E]/30"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="rounded-lg border border-[#262A2F] bg-[#1C1F23] px-4 py-2 text-sm font-medium text-[#F2F4F5] hover:border-[#22C55E]/30"
            >
              Go home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
