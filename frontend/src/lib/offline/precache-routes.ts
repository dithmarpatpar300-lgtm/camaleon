import { getActiveTools } from "../tools/tool-registry";

export const LEGAL_PRECACHE_PATHS = [
  "/privacy",
  "/terms",
  "/about",
  "/contact",
] as const;

export function getToolPrecacheUrls(): string[] {
  return getActiveTools().map((tool) => `/transmute/${tool.slug}`);
}

export function getAllShellPrecacheUrls(): string[] {
  return ["/", "/~offline", ...LEGAL_PRECACHE_PATHS, ...getToolPrecacheUrls()];
}
