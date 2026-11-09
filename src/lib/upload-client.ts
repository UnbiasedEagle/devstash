import { validateUpload, type UploadKind } from "@/lib/upload-rules";

export const UPLOAD_FAILED_MESSAGE =
  "The upload failed. Check your connection and try again.";

export class UploadAbortedError extends Error {}
export class UploadFailedError extends Error {}

// The same rules the server applies, so a file that would be refused is caught before anything is sent
export function validateChosenFile(
  kind: UploadKind,
  file: File,
): string | undefined {
  const result = validateUpload({
    kind,
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  });
  return result.ok ? undefined : result.error;
}

// The title a file gets until the user changes it: its name without the extension
export function titleFromFileName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return (dot > 0 ? fileName.slice(0, dot) : fileName).trim();
}

// XMLHttpRequest rather than fetch because fetch can't report upload progress. The browser can't read why R2 refused an upload (its error responses carry no CORS headers), so every failure is the same one
export function uploadFile(options: {
  url: string;
  contentType: string;
  file: File;
  onProgress: (percent: number) => void;
  signal: AbortSignal;
}): Promise<void> {
  const { url, contentType, file, onProgress, signal } = options;

  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new UploadAbortedError());
      return;
    }

    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("Content-Type", contentType);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new UploadFailedError(`Upload refused (${request.status})`));
    };
    request.onerror = () => reject(new UploadFailedError("Upload failed"));
    request.onabort = () => reject(new UploadAbortedError());
    signal.addEventListener("abort", () => request.abort(), { once: true });

    request.send(file);
  });
}
