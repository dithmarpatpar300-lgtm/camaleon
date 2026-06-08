import type { ToolDefinition } from "@/lib/tools/types";

export { supportsClientResize } from "./post-resize-route";

export function mimeTypeForTool(tool: ToolDefinition): string {
  switch (tool.fromFormat) {
    case "PNG":
      return "image/png";
    case "JPG":
      return "image/jpeg";
    case "WEBP":
      return "image/webp";
    case "BMP":
      return "image/bmp";
    default:
      return "application/octet-stream";
  }
}
