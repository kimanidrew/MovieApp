import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    console.log("🚀 Presign request started");

    // 🔥 DEBUG ENV FIRST
    console.log("ENV CHECK:", {
      bucket: process.env.R2_BUCKET,
      account: process.env.R2_ACCOUNT_ID,
      hasKey: !!process.env.R2_ACCESS_KEY,
      hasSecret: !!process.env.R2_SECRET_KEY,
    });

    const body = await req.json();
    const { fileName, fileType } = body;

    if (!fileName) {
      return NextResponse.json(
        { error: "fileName missing" },
        { status: 400 }
      );
    }

    const key = `uploads/${Date.now()}-${fileName.replace(/\s+/g, "-")}`;

    console.log("🔑 Key:", key);

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      ContentType: fileType || "application/octet-stream",
    });

    const url = await getSignedUrl(r2, command, {
      expiresIn: 600,
    });

    console.log("✅ Signed URL generated");

    return NextResponse.json({
      url,
      key,
    });
  } catch (err: any) {
    console.error("❌ PRESIGN ERROR:", err);

    return NextResponse.json(
      {
        error: err.message,
      },
      { status: 500 }
    );
  }
}