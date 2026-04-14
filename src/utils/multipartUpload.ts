// @/lib/uploadLargeFile.ts
import { withRetry } from "@/lib/retry";
import { saveUploadState, loadUploadState, clearUploadState, getUploadKey } from "./uploadResume";

type Part = { ETag: string; PartNumber: number };

async function fetchUrls(key: string, uploadId: string, totalParts: number) {
  console.log(`🔐 Fetching presigned URLs for upload key: ${key}, UploadId: ${uploadId}`);

  const res = await fetch("/api/upload/multipart/urls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key,
      uploadId,
      totalParts,
    }),
  });

  const data = await res.json();
  console.log(`📦 URL Response:`, data);

  if (data.error) {
    console.error("❌ Error fetching URLs:", data.error);
    throw new Error(`Error fetching URLs: ${data.error}`);
  }

  if (!Array.isArray(data.urls) || data.urls.length !== totalParts) {
    console.error("❌ Mismatch in URLs length. Expected:", totalParts, "Got:", data.urls.length);
    throw new Error(`URL mismatch. Expected ${totalParts} parts, but got ${data.urls.length}`);
  }

  return data.urls;
}

async function safePut(url: string, chunk: Blob, part: number): Promise<string> {
  console.log(`📤 Uploading part ${part} to URL: ${url}`);
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": chunk.size.toString(),
    },
    body: chunk,
  });

  if (!res.ok) {
    console.error(`❌ Error uploading part ${part}: ${res.statusText}`);
    throw new Error(`Error uploading part ${part}: ${res.statusText}`);
  }

  const etag = res.headers.get("ETag");
  if (!etag) {
    console.error(`❌ Missing ETag for part ${part}`);
    throw new Error(`Missing ETag for part ${part}`);
  }

  return etag;
}

export async function uploadLargeFile(
  files: File[],
  onProgress?: (p: number) => void
) {
  console.log(`🎬 Starting upload for files: ${files.map((f) => f.name)}`);
  const CHUNK_SIZE = 15 * 1024 * 1024; // 15 MB per part
  let totalParts = 0;

  files.forEach((file) => {
    totalParts += Math.ceil(file.size / CHUNK_SIZE);
  });

  const uploadKey = getUploadKey(files);
  let uploadId = "";
  let key = "";
  let urls: string[] = [];
  const parts: Part[] = [];
  const completed = new Set<number>();
  let uploadedBytes = 0;

  let saved = loadUploadState(uploadKey);

  if (saved) {
    console.log("♻️ Resuming from saved state:", saved);
    uploadId = saved.uploadId;
    key = saved.key;
    saved.parts?.forEach((p: Part) => { parts.push(p); completed.add(p.PartNumber); });
    uploadedBytes = saved.parts?.reduce((sum: number, p: Part) => sum + (p.PartNumber - 1) * CHUNK_SIZE, 0);

    // Check if URLs are expired or missing
    if (!saved.urls || !saved.urls.length || Date.now() - saved.urlsCreatedAt > 1000 * 60 * 55) {
      console.log("🔄 URLs expired or missing, fetching fresh URLs...");
      urls = await fetchUrls(key, uploadId, totalParts);
    } else {
      console.log("✅ Using saved URLs...");
      urls = saved.urls;
    }
  } else {
    console.log("🆕 Starting new upload...");
    const init = await fetch("/api/upload/multipart/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileType: "application/x-mpegURL",
        fileName: files.map((f) => f.name).join(", "),
      }),
    }).then((r) => r.json());
    
    uploadId = init.uploadId;
    key = init.key;

    // Fetch URLs for all parts
    urls = await fetchUrls(key, uploadId, totalParts);
  }

  function emit() {
    const progress = Math.min(
      99,
      Math.round((uploadedBytes / files.reduce((sum, file) => sum + file.size, 0)) * 100)
    );
    console.log(`📊 Upload Progress: ${progress}%`);
    onProgress?.(progress);
    saveUploadState(uploadKey, { uploadId, key, urls, parts });
  }

  async function uploadPart(file: File, part: number) {
    if (completed.has(part)) return;

    const url = urls[part - 1];
    if (!url) {
      console.error(`❌ Missing URL for part ${part}`);
      throw new Error(`Missing URL for part ${part}`);
    }

    const chunk = file.slice((part - 1) * CHUNK_SIZE, part * CHUNK_SIZE);
    const etag = await withRetry(() => safePut(url, chunk, part), { retries: 5 });

    parts.push({ PartNumber: part, ETag: etag });
    completed.add(part);
    uploadedBytes += chunk.size;
    emit();
  }

  let next = 1;
  const concurrency = 3;
  async function worker(file: File) {
    while (next <= totalParts) {
      const p = next++;
      await uploadPart(file, p);
    }
  }

  await Promise.all(files.map(worker));

  const sorted = parts.sort((a, b) => a.PartNumber - b.PartNumber);
  await fetch("/api/upload/multipart/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, uploadId, parts: sorted }),
  });

  console.log(`✅ Upload completed successfully for key: ${key}`);
  clearUploadState(uploadKey);
  onProgress?.(100);

  return {
    url: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`,
    key,
  };
}