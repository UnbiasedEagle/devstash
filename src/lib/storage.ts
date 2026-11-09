import "server-only";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Env } from "@/lib/env";
import {
  attachmentDisposition,
  isAllowedMimeType,
  type UploadKind,
} from "@/lib/upload-rules";

export const UPLOAD_URL_SECONDS = 5 * 60;
export const DOWNLOAD_URL_SECONDS = 10 * 60;

export interface ObjectInfo {
  size: number;
  contentType: string;
  // Identifies this exact content, so a later move can refuse if the object was replaced in between
  etag: string;
}

// The SDK adds a checksum to uploads by default, which a signed browser upload can't send, so it only does so when a call requires it
const client = new S3Client({
  region: "auto",
  endpoint: `https://${r2Env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2Env.R2_ACCESS_KEY_ID,
    secretAccessKey: r2Env.R2_SECRET_ACCESS_KEY,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const Bucket = r2Env.R2_BUCKET;

function isNotFound(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const metadata = "$metadata" in error ? error.$metadata : undefined;
  const status =
    typeof metadata === "object" &&
    metadata !== null &&
    "httpStatusCode" in metadata
      ? metadata.httpStatusCode
      : undefined;
  return status === 404 || ("name" in error && error.name === "NotFound");
}

// Both headers are signed, so R2 rejects an upload whose type or size differs from what the server approved
export function createUploadUrl(options: {
  key: string;
  contentType: string;
  size: number;
}): Promise<string> {
  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket,
      Key: options.key,
      ContentType: options.contentType,
      ContentLength: options.size,
    }),
    {
      expiresIn: UPLOAD_URL_SECONDS,
      signableHeaders: new Set(["content-type", "content-length"]),
    },
  );
}

// Files always download as attachments. Images are served inline with only the type that was stored, never one the link's holder picks. A stored type that isn't on the allowed list for its kind is refused, so a bad row can never make the bucket serve HTML
export function createDownloadUrl(options: {
  key: string;
  kind: UploadKind;
  fileName: string;
  mimeType: string;
}): Promise<string> {
  if (!isAllowedMimeType(options.kind, options.mimeType)) {
    throw new Error("The stored type isn't allowed for this kind of upload");
  }
  const isImage = options.kind === "image";
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket,
      Key: options.key,
      ResponseContentType: options.mimeType,
      ResponseContentDisposition: isImage
        ? "inline"
        : attachmentDisposition(options.fileName),
    }),
    { expiresIn: DOWNLOAD_URL_SECONDS },
  );
}

export async function getObjectInfo(key: string): Promise<ObjectInfo | null> {
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket, Key: key }));
    // A missing size would read as an empty file and pass for a harmless upload, so it is an error instead
    if (head.ContentLength === undefined || head.ETag === undefined) {
      throw new Error("Storage returned no size or ETag for the object");
    }
    return {
      size: head.ContentLength,
      contentType: head.ContentType ?? "",
      etag: head.ETag,
    };
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

// With `ifMatch` the copy fails when the object was replaced after it was checked, because an upload link can be used again until it expires
export async function moveObject(
  from: string,
  to: string,
  options: { ifMatch?: string } = {},
): Promise<void> {
  await client.send(
    new CopyObjectCommand({
      Bucket,
      Key: to,
      CopySource: `${Bucket}/${from.split("/").map(encodeURIComponent).join("/")}`,
      CopySourceIfMatch: options.ifMatch,
    }),
  );
  await deleteObject(from);
}

export async function deleteObject(key: string): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket, Key: key }));
}
