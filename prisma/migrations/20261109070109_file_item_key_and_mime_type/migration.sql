-- The column now holds the object key in the private bucket, not a link, so it is renamed instead of dropped and recreated
-- AlterTable
ALTER TABLE "Item" RENAME COLUMN "fileUrl" TO "fileKey";

-- AlterTable
ALTER TABLE "Item" ADD COLUMN "fileMimeType" TEXT;
