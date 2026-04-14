// @/app/api/upload/multipart/complete/route.ts
import { NextResponse } from "next/server";
import { CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";

export async function POST(req: Request) {
  try {
    const { key, uploadId, parts } = await req.json();
    
    console.log(`🔄 Finalizing multipart upload for key: ${key}, UploadId: ${uploadId}`);
    const command = new CompleteMultipartUploadCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    });

    await r2.send(command);
    console.log(`✅ Multipart upload completed successfully for key: ${key}`);
    return NextResponse.json({ message: "Upload completed successfully." });
  } catch (error: any) {
    console.error(`❌ Error completing multipart upload: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}