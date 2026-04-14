// @/app/api/upload/multipart/urls/route.ts
import { NextResponse } from "next/server";
import { UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, uploadId, totalParts } = body;

    if (!key || !uploadId || !totalParts) {
      console.error("❌ Missing parameters: key, uploadId, or totalParts.");
      return NextResponse.json(
        { error: "Missing required parameters: key, uploadId, and totalParts are required." },
        { status: 400 }
      );
    }

    console.log(`🔐 Generating signed URLs for multipart upload: ${uploadId}`);
    const urlPromises = [];
    for (let i = 1; i <= totalParts; i++) {
      const command = new UploadPartCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: key,
        UploadId: uploadId,
        PartNumber: i,
      });

      urlPromises.push(getSignedUrl(r2, command, { expiresIn: 3600 }));
    }

    const urls = await Promise.all(urlPromises);
    console.log(`✅ Generated ${urls.length} signed URLs for upload.`);
    return NextResponse.json({ urls });
  } catch (error: any) {
    console.error(`❌ Error generating signed URLs: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}