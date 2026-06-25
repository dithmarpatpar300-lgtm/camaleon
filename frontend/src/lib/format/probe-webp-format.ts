export type WebpSourceFormat = "lossy" | "lossless" | "extended";

export function probeWebpFormat(bytes: Uint8Array): WebpSourceFormat | null {
  if (bytes.length < 16) return null;
  if (bytes[0] !== 0x52 || bytes[1] !== 0x49 || bytes[2] !== 0x46 || bytes[3] !== 0x46) return null;
  if (bytes[8] !== 0x57 || bytes[9] !== 0x45 || bytes[10] !== 0x42 || bytes[11] !== 0x50) return null;

  const fourCC = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
  if (fourCC === "VP8 ") return "lossy";
  if (fourCC === "VP8L") return "lossless";
  if (fourCC === "VP8X") {
    return probeWebpExtended(bytes);
  }
  return null;
}

function probeWebpExtended(bytes: Uint8Array): WebpSourceFormat | null {
  const limit = Math.min(bytes.length, 64 * 1024);
  let pos = 12;

  while (pos + 8 <= limit) {
    const fourCC = String.fromCharCode(bytes[pos], bytes[pos + 1], bytes[pos + 2], bytes[pos + 3]);
    const chunkSize = bytes[pos + 4] | (bytes[pos + 5] << 8) | (bytes[pos + 6] << 16) | (bytes[pos + 7] << 24);

    if (fourCC === "VP8 ") return "lossy";
    if (fourCC === "VP8L") return "lossless";

    pos += 8 + chunkSize;
    if (chunkSize % 2 !== 0) pos += 1;
  }

  return "extended";
}
