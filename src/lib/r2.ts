import { S3Client } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
});

// 🔥 CRITICAL: disable checksum middleware for R2 multipart uploads
// @ts-ignore
r2.middlewareStack.remove("flexibleChecksumsMiddleware");

// ALSO disable optional checksum behavior globally
r2.middlewareStack.add(
  (next) => async (args: any) => {
    delete args.request.headers["x-amz-checksum-crc32"];
    delete args.request.headers["x-amz-checksum-sha1"];
    delete args.request.headers["x-amz-checksum-sha256"];
    return next(args);
  },
  {
    step: "build",
    name: "stripChecksumHeaders",
  }
);