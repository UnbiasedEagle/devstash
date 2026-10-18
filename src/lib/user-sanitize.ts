const MAX_NAME_LENGTH = 80;
const MAX_IMAGE_URL_LENGTH = 2048;

export function sanitizeName(name: string): string {
  return name.trim().slice(0, MAX_NAME_LENGTH);
}

export function sanitizeImage(image: string | null | undefined): string | null {
  if (!image || image.length > MAX_IMAGE_URL_LENGTH) return null;
  try {
    return new URL(image).protocol === "https:" ? image : null;
  } catch {
    return null;
  }
}
