export type Locale = "en" | "es";

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export type Dictionary = Record<string, string | Record<string, unknown>>;
