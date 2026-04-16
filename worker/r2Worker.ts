import fs from "fs";
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
});

/**
 * 🔥 Internal progress updater (no external import)
 */
async function updateProgress(jobId: string, progress: number, status = "processing") {
  const payload = {
    jobId,
    progress,
    status,
    updatedAt: Date.now(),
  };

  console.log(`📊 [${jobId}] → ${progress}% (${status})`);

  // non-blocking Redis write
  import("../src/lib/redis").then(({ redis }) => {
    redis
      .set(`yt-job:${jobId}`, JSON.stringify(payload))
      .then((res) => {
        console.log(`✅ Redis OK [${jobId}] → ${res}`);
      })
      .catch((err) => {
        console.error(`❌ Redis error [${jobId}]`, err);
      });
  });

  return payload;
}

export async function uploadToR2(
  filePath: string,
  key: string,
  jobId?: string
) {
  console.log("📦 Starting multipart upload:", filePath);

  const fileSize = fs.statSync(filePath).size;
  const CHUNK_SIZE = 10 * 1024 * 1024;

  console.log("📏 File size:", (fileSize / 1024 / 1024).toFixed(2), "MB");

  // -------------------------
  // INIT MULTIPART
  // -------------------------
  const createRes = await s3.send(
    new CreateMultipartUploadCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      ContentType: "video/mp4",
    })
  );

  const uploadId = createRes.UploadId!;
  console.log("🆔 UploadId:", uploadId);

  const parts: { ETag: string; PartNumber: number }[] = [];

  let partNumber = 1;
  let uploadedBytes = 0;

  // -------------------------
  // UPLOAD PARTS
  // -------------------------
  const fileStream = fs.createReadStream(filePath, {
    highWaterMark: CHUNK_SIZE,
  });

  for await (const chunk of fileStream) {
    console.log(`📤 Uploading part ${partNumber}...`);

    const res = await s3.send(
      new UploadPartCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: chunk,
      })
    );

    console.log(`✅ Part ${partNumber} uploaded`);

    parts.push({
      ETag: res.ETag!,
      PartNumber: partNumber,
    });

    uploadedBytes += chunk.length;

    const percent = Math.round((uploadedBytes / fileSize) * 100);

    console.log(`📊 Upload progress: ${percent}%`);

    if (jobId) {
      updateProgress(jobId, percent, "uploading");
    }

    partNumber++;
  }

  // -------------------------
  // COMPLETE
  // -------------------------
  console.log("🔄 Completing multipart upload...");

  await s3.send(
    new CompleteMultipartUploadCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    })
  );

  console.log("🎉 Upload COMPLETE");

  if (jobId) {
    updateProgress(jobId, 100, "done");
  }

  return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;
}