import { NextResponse } from "next/server";
import { CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";

export async function POST(req: Request) {
  try {
    const { key, uploadId, parts } = await req.json();

    console.log("📦 COMPLETING UPLOAD:", { key, uploadId });

    const cmd = new CompleteMultipartUploadCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.sort((a: any, b: any) => a.PartNumber - b.PartNumber),
      },
    });

    const res = await r2.send(cmd);

    console.log("🎉 COMPLETE SUCCESS:", res);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("❌ COMPLETE ERROR:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}