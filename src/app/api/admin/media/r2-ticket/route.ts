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

export async function POST(request: Request) {
  try {
    const { user, error } = await requireRole(request, CONTENT_MANAGEMENT_ROLES);
    if (error) return error;

    const { filename, contentType, assetType } = await request.json();

    if (!filename || !contentType || !assetType) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    if (!r2Endpoint || !r2BucketName || !r2AccessKeyId || !r2SecretAccessKey) {
      return NextResponse.json(
        { error: "Cloudflare R2 credentials are not configured for this environment." },
        { status: 500 }
      );
    }

    let folder = "misc";
    if (assetType === "POSTER") folder = "images/posters";
    else if (assetType === "BACKDROP") folder = "images/backdrops";
    else if (assetType === "VIDEO") folder = "videos/streams";
    else if (assetType === "TRAILER") folder = "videos/trailers";

    const fileExtension = (filename.split(".").pop() || "bin").toLowerCase();
    const uniqueKey = `${folder}/${crypto.randomUUID()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: r2BucketName,
      Key: uniqueKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 });
    const publicUrl = r2PublicDomain
      ? `${r2PublicDomain.replace(/\/$/, "")}/${uniqueKey}`
      : `${r2Endpoint}/${r2BucketName}/${uniqueKey}`;

    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (error: any) {
    console.error("Presigned URL generation error:", error);
    return NextResponse.json({ error: error.message || "Unable to generate an upload URL." }, { status: 500 });
  }
}