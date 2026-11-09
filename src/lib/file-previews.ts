import "server-only";
import { createDownloadUrl } from "@/lib/storage";

interface PreviewableItem {
  contentType: string;
  fileKey: string | null;
  fileName: string | null;
  fileMimeType: string | null;
  itemType: { name: string };
}

// A short-lived link for showing an image item inline, made each time a page is rendered. Anything that isn't a complete image item, or whose stored type isn't allowed, gets no link instead of an error, so one bad row can't break a whole list
export async function getImagePreviewUrl(
  item: PreviewableItem,
): Promise<string | null> {
  const { fileKey, fileName, fileMimeType } = item;
  if (
    item.itemType.name !== "Image" ||
    item.contentType !== "FILE" ||
    !fileKey ||
    !fileName ||
    !fileMimeType
  ) {
    return null;
  }

  try {
    return await createDownloadUrl({
      key: fileKey,
      kind: "image",
      fileName,
      mimeType: fileMimeType,
    });
  } catch (error) {
    console.error("Could not create an image preview link", {
      key: fileKey,
      error,
    });
    return null;
  }
}
