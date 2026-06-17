import {
  getPrepareProgressStylePref,
  setPrepareProgressStylePref,
} from "@/lib/prefs/notices-prefs";

export type PrepareProgressStyle = "ring" | "bar";

export function getPrepareProgressStyle(): PrepareProgressStyle {
  return getPrepareProgressStylePref();
}

export function setPrepareProgressStyle(style: PrepareProgressStyle): void {
  setPrepareProgressStylePref(style);
}
