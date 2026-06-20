/** Build a same-origin GET request for shell precache keys (main thread or SW). */
export function toShellRequest(path: string): Request {
  const origin =
    typeof location !== "undefined"
      ? location.origin
      : typeof self !== "undefined" && "location" in self
        ? self.location.origin
        : "http://localhost";

  return new Request(new URL(path, origin).href, {
    method: "GET",
    credentials: "same-origin",
  });
}
