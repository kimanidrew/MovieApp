import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { fileName, fileType } = await req.json();

    if (!fileName) {
      return NextResponse.json({ error: "fileName missing" }, { status: 400 });
    }

    const key = `uploads/${Date.now()}-${fileName.replace(/\s+/g, "-")}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      ContentType: fileType || "application/octet-stream",
    });

    const uploadUrl = await getSignedUrl(r2, command, {
      expiresIn: 600,
    });

    // ✅ IMPORTANT: generate PUBLIC URL
    const publicUrl = `https://${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;

    return NextResponse.json({
      uploadUrl, // for PUT
      key,
      publicUrl, // for viewing
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}