export type PrepareProgressStyle = "ring" | "bar";

const STORAGE_KEY = "camaleon:prepareProgressStyle";

export function getPrepareProgressStyle(): PrepareProgressStyle {
  if (typeof window === "undefined") return "ring";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "bar" ? "bar" : "ring";
}

export function setPrepareProgressStyle(style: PrepareProgressStyle): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, style);
}
