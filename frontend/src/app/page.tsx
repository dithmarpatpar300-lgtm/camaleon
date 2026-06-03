"use client";

import { useCallback, useState } from "react";

export default function Home() {
  const [dragging, setDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const jpegFiles = files.filter((f) =>
      f.name.match(/\.(jpg|jpeg)$/i)
    );

    if (jpegFiles.length === 0) {
      return;
    }

    // Placeholder: transmutation logic will be wired here via Web Workers + Wasm
    console.log("Accepted JPEG files:", jpegFiles.map((f) => f.name));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-8">
      <h1 className="mb-6 text-4xl font-bold text-zinc-50">Camaleon</h1>
      <p className="mb-8 text-zinc-400">
        Drop a <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm font-mono text-emerald-400">.jpg</code> or <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm font-mono text-emerald-400">.jpeg</code> file to transmute it to <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm font-mono text-emerald-400">.png</code>
      </p>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex h-64 w-full max-w-xl items-center justify-center rounded-2xl border-2 border-dashed transition-colors ${
          dragging
            ? "border-emerald-400 bg-emerald-400/10"
            : "border-zinc-700 bg-zinc-900"
        }`}
      >
        <span className="text-zinc-500">
          {dragging ? "Release to transmute" : " Drag & drop JPEG here"}
        </span>
      </div>
    </main>
  );
}
