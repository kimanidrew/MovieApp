import { NextResponse } from "next/server";
import { CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";

export const runtime = "nodejs"; // 🔥 MUST HAVE

export async function POST(req: Request) {
  const start = Date.now();

  try {
    console.log("🚀 INIT STARTED");

    const body = await req.json();
    const { fileName, fileType } = body;

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "Missing fileName/fileType" },
        { status: 400 }
      );
    }

    const key = `videos/${crypto.randomUUID()}-${fileName}`;

    console.log("🔑 KEY:", key);

    const command = new CreateMultipartUploadCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      ContentType: fileType || "application/octet-stream",
    });

    console.log("⚙️ SENDING TO R2...");

    const res = await r2.send(command);

    if (!res.UploadId) {
      throw new Error("UploadId missing from R2 response");
    }

    console.log("🟢 INIT SUCCESS:", res.UploadId);

    return NextResponse.json({
      uploadId: res.UploadId,
      key,
    });
  } catch (err: any) {
    console.error("❌ INIT FAILED:", err);

    return NextResponse.json(
      {
        error: err.message,
      },
      { status: 500 }
    );
  }
}