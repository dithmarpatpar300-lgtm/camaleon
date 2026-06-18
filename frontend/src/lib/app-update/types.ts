export type AppUpdateSource = "service-worker" | "version-beacon";

export type VersionBeacon = {
  version: string;
  buildId?: string;
};
