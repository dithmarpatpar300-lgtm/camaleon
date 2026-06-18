import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";
import { getAllShellPrecacheUrls } from "./src/lib/offline/precache-routes";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
  cacheOnNavigation: true,
  reloadOnOnline: false,
  additionalPrecacheEntries: getAllShellPrecacheUrls().map((url) => ({ url, revision })),
  globPublicPatterns: ["pwa/**/*.{png,svg,ico}", "brand/**/*.{png,svg}"],
});

const nextConfig: NextConfig = {};

export default withSerwist(nextConfig);
