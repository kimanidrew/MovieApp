import { NextResponse } from "next/server";
import { UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2";

// Optional: concurrency limiter
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let i = 0;

  async function worker() {
    while (i < items.length) {
      const index = i++;
      results[index] = await fn(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

export async function POST(req: Request) {
  try {
    const { key, uploadId, totalParts } = await req.json();

    // ✅ Basic validation
    if (!key || !uploadId || !totalParts) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    if (typeof totalParts !== "number" || totalParts <= 0) {
      return NextResponse.json(
        { error: "Invalid totalParts" },
        { status: 400 }
      );
    }

    if (totalParts > 1000) {
      return NextResponse.json(
        { error: "Too many parts requested" },
        { status: 400 }
      );
    }

    console.log("🔐 Generating presigned URLs", {
      key,
      uploadId,
      totalParts,
    });

    const partsArray = new Array(totalParts).fill(0);

    // ✅ Controlled concurrency (prevents server overload)
    const urls = await mapWithConcurrency(
      partsArray,
      10, // sweet spot
      async (_, i) => {
        const command = new UploadPartCommand({
          Bucket: process.env.R2_BUCKET!,
          Key: key,
          UploadId: uploadId,
          PartNumber: i + 1,
          ContentLength: undefined,
          ChecksumAlgorithm: undefined,
        });

        command.middlewareStack.remove("flexibleChecksumsMiddleware");

        return getSignedUrl(r2, command, {
          expiresIn: 3600,
          signableHeaders: new Set(["host"]), // ✅ THIS FIXES IT
        });
      }
    );

    return NextResponse.json({ urls });
  } catch (error: any) {
    console.error("❌ Failed to generate URLs:", error);

    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}