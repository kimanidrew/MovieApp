// app/api/cloudinary-signature/route.ts
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // These must exactly match the error's "String to sign"
    const paramsToSign = {
      eager: "sp_auto/m3u8",
      eager_async: "true",
      folder: "movieflix",
      timestamp: timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    console.log("🛠️ Generated Signature for:", paramsToSign);

    return NextResponse.json({
      ...paramsToSign,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (error: any) {
    console.error("❌ Signature Route Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
