import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || "", 
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(request: Request) {
  try {
    const { filename, contentType, assetType } = await request.json();

    if (!filename || !contentType || !assetType) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    let folder = "misc";
    if (assetType === "POSTER") folder = "images/posters";
    else if (assetType === "BACKDROP") folder = "images/backdrops";
    else if (assetType === "VIDEO") folder = "videos/streams";
    else if (assetType === "TRAILER") folder = "videos/trailers";

    const fileExtension = filename.split(".").pop();
    const uniqueKey = `${folder}/${crypto.randomUUID()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: uniqueKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 });
    const publicUrl = `${process.env.NEXT_PUBLIC_R2_DOMAIN}/${uniqueKey}`;

    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (error: any) {
    console.error("Presigned URL generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}