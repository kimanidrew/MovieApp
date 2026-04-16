import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET!,
  },
});

export async function uploadToR2(filePath: string, key: string) {
  console.log("☁️ Uploading to R2:", key);

  const file = fs.readFileSync(filePath);

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: file,
      ContentType: "video/mp4",
    })
  );

  const url = `${process.env.R2_PUBLIC_URL}/${key}`;

  console.log("✅ R2 uploaded:", url);

  return url;
}