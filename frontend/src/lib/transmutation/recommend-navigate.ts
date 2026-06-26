import { stageFileHandoffFromFile } from "./file-handoff";

export async function stageForRecommendedTool(
  fileBytes: Uint8Array,
  fileName: string,
  toolSlug: string,
): Promise<string> {
  const file = new File([fileBytes as unknown as BlobPart], fileName);
  const handoffId = await stageFileHandoffFromFile(file);
  return `/transmute/${toolSlug}?handoff=${encodeURIComponent(handoffId)}`;
}
