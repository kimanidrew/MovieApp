// src/lib/r2.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_R2_DOMAIN || ""; // e.g. "https://media.mydomain.com" or "https://pub-xxxx.r2.dev"

// Initialize S3-compatible R2 Client
export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Normalizes filenames into a URL-friendly and unique format
 */
const sanitizeFilename = (filename: string): string => {
  const clean = filename
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${Date.now()}-${clean}`;
};

// Specialized path builders for catalog organization
export const buildVideoKey = (filename: string) => `videos/master/${sanitizeFilename(filename)}`;
export const buildPosterKey = (filename: string) => `graphics/posters/${sanitizeFilename(filename)}`;
export const buildBackdropKey = (filename: string) => `graphics/backdrops/${sanitizeFilename(filename)}`;
export const buildLogoKey = (filename: string) => `graphics/logos/${sanitizeFilename(filename)}`;
export const buildTrailerKey = (filename: string) => `videos/trailers/${sanitizeFilename(filename)}`;

/**
 * Builds the permanent, public URL of an uploaded asset
 */
export const buildPublicUrl = (key: string): string => {
  const domain = R2_PUBLIC_DOMAIN.replace(/\/$/, "");
  return `${domain}/${key}`;
};

/**
 * Generates a direct secure PUT upload URL valid for 15 minutes
 */
export const createUploadUrl = async (key: string, contentType: string): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(r2Client, command, { expiresIn: 900 }); // 15 minutes
};