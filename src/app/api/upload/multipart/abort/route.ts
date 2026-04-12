import { NextResponse } from "next/server";
import { AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2"; // Assuming this is your custom R2 client setup

export async function POST(req: Request) {
  try {
    const { key, uploadId } = await req.json(); // Extract key and uploadId from the request body

    console.log("🚨 ABORTING UPLOAD:", { key, uploadId });

    // Construct the AbortMultipartUploadCommand
    const cmd = new AbortMultipartUploadCommand({
      Bucket: process.env.R2_BUCKET!, // R2 bucket name
      Key: key, // The file's key or path in the bucket
      UploadId: uploadId, // The upload ID you want to abort
    });

    // Send the command using the R2 client
    const res = await r2.send(cmd);

    console.log("🎉 ABORT SUCCESS:", res);

    // Return success response
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("❌ ABORT ERROR:", e);
    // Return error response if something goes wrong
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}