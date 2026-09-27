import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireRole, CONTENT_MANAGEMENT_ROLES } from "@/lib/admin-auth";

const r2AccountId = process.env.R2_ACCOUNT_ID || process.env.CF_ACCOUNT_ID || "";
const r2BucketName = process.env.R2_BUCKET_NAME || "";
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
const r2PublicDomain = process.env.NEXT_PUBLIC_R2_DOMAIN || process.env.R2_PUBLIC_DOMAIN || "";
const r2Endpoint = process.env.R2_ENDPOINT || (r2AccountId ? `https://${r2AccountId}.r2.cloudflarestorage.com` : "");

const r2Client = new S3Client({
  region: "auto",
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
  },
});

const ASSET_RULES = {
  POSTER: { folder: "images/posters", prefix: "image/" },
  BACKDROP: { folder: "images/backdrops", prefix: "image/" },
  VIDEO: { folder: "videos/streams", prefix: "video/" },
  TRAILER: { folder: "videos/trailers", prefix: "video/" },
} as const;

type AssetType = keyof typeof ASSET_RULES;

export async function POST(request: Request) {
  try {
    const { error } = await requireRole(request, CONTENT_MANAGEMENT_ROLES);
    if (error) return error;

    const { filename, contentType, assetType, sizeInBytes } = await request.json();
    const rule = ASSET_RULES[assetType as AssetType];

    if (!filename || !contentType || !rule) {
      return NextResponse.json({ error: "Choose a valid file before uploading." }, { status: 400 });
    }

    if (!r2Endpoint || !r2BucketName || !r2AccessKeyId || !r2SecretAccessKey) {
      return NextResponse.json(
        { error: "Cloudflare R2 is not configured. Add the R2 bucket, access key, secret, and endpoint environment variables." },
        { status: 500 }
      );
    }

    if (!r2PublicDomain) {
      return NextResponse.json(
        { error: "R2 public media domain is not configured. Set NEXT_PUBLIC_R2_DOMAIN so uploaded media can be viewed by users." },
        { status: 500 }
      );
    }

    if (!contentType.toLowerCase().startsWith(rule.prefix)) {
      return NextResponse.json(
        { error: assetType === "VIDEO" || assetType === "TRAILER" ? "Please select a video file." : "Please select an image file." },
        { status: 415 }
      );
    }

    const maxBytes = assetType === "POSTER" || assetType === "BACKDROP"
      ? 20 * 1024 * 1024
      : 10 * 1024 * 1024 * 1024;

    if (Number.isFinite(Number(sizeInBytes)) && Number(sizeInBytes) > maxBytes) {
      const maxLabel = maxBytes >= 1024 ** 3 ? `${maxBytes / 1024 ** 3} GB` : `${maxBytes / 1024 ** 2} MB`;
      return NextResponse.json({ error: `This file is too large. Maximum allowed size is ${maxLabel}.` }, { status: 413 });
    }

    const safeName = String(filename).split(/[\\/]/).pop()?.replace(/[^a-zA-Z0-9._-]/g, "-") || "upload.bin";
    const fileExtension = (safeName.split(".").pop() || "bin").toLowerCase();
    const uniqueKey = `${rule.folder}/${crypto.randomUUID()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: r2BucketName,
      Key: uniqueKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 });
    const publicUrl = `${r2PublicDomain.replace(/\/$/, "")}/${uniqueKey}`;

    return NextResponse.json({ uploadUrl, publicUrl, key: uniqueKey, expiresIn: 900 });
  } catch (error: any) {
    console.error("Presigned URL generation error:", error);
    return NextResponse.json({ error: error?.message || "Unable to prepare the upload." }, { status: 500 });
  }
}
