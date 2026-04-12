import { withRetry } from "@/lib/retry";
import { saveUploadState, loadUploadState, clearUploadState, getUploadKey } from "./uploadResume";

type Part = { ETag: string; PartNumber: number };

export async function uploadLargeFile(
  file: File,
  onProgress?: (p: number) => void
) {
  console.log("🎬 START UPLOAD", file.name);

  const CHUNK_SIZE = 15 * 1024 * 1024; // 15 MB
  const totalParts = Math.ceil(file.size / CHUNK_SIZE);

  const uploadKey = getUploadKey(file);
  let uploadId = "";
  let key = "";
  let urls: string[] = [];
  const parts: Part[] = [];
  const completed = new Set<number>();

  let uploadedBytes = 0;
  const controller = new AbortController();
  let lastEmit = 0;

  // =========================
  // STRICT URL FETCH
  // =========================
  async function fetchUrls() {
    console.log("🔐 Fetching presigned URLs...");

    const res = await fetch("/api/upload/multipart/urls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, uploadId, totalParts }),
    });

    const data = await res.json();

    console.log("📦 URL RESPONSE:", data);

    if (!Array.isArray(data.urls)) {
      throw new Error("Invalid URL response (not array)");
    }

    if (data.urls.length !== totalParts) {
      throw new Error(
        `URL mismatch: expected ${totalParts}, got ${data.urls.length}`
      );
    }

    if (data.urls.some((u: any) => typeof u !== "string" || !u)) {
      throw new Error("Invalid undefined URL detected");
    }

    return data.urls;
  }

  // =========================
  // INIT / RESUME
  // =========================
  let saved = loadUploadState(uploadKey);

  if (saved) {
    console.log("♻️ RESUME FOUND", saved);

    uploadId = saved.uploadId;
    key = saved.key;

    saved.parts?.forEach((p: Part) => {
      parts.push(p);
      completed.add(p.PartNumber);
    });

    uploadedBytes = saved.parts?.reduce((sum: number, p: Part) => {
      const start = (p.PartNumber - 1) * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      return sum + (end - start);
    }, 0);

    // 🔥 FORCE REFRESH IF URLS INVALID
    if (!saved.urls || !saved.urls.length) {
      urls = await fetchUrls();
    } else {
      urls = saved.urls;
    }

    saveUploadState(uploadKey, {
      uploadId,
      key,
      urls,
      parts,
      urlsCreatedAt: Date.now(),
    });
  } else {
    console.log("🆕 NEW UPLOAD");

    const init = await fetch("/api/upload/multipart/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileType: file.type,
        fileName: file.name,
      }),
    }).then((r) => r.json());

    uploadId = init.uploadId;
    key = init.key;

    // Fetch new URLs for each part
    urls = await fetchUrls();

    saveUploadState(uploadKey, {
      uploadId,
      key,
      urls,
      parts: [],
      urlsCreatedAt: Date.now(),
    });
  }

  // =========================
  // PROGRESS
  // =========================
  function emit(force = false) {
    const now = Date.now();
    if (!force && now - lastEmit < 200) return;

    lastEmit = now;

    const progress = Math.min(
      99,
      Math.round((uploadedBytes / file.size) * 100)
    );

    console.log(`📊 ${progress}%`);
    onProgress?.(progress);

    saveUploadState(uploadKey, {
      uploadId,
      key,
      urls,
      parts,
    });
  }

  // =========================
  // SAFE PUT (HARD GUARD)
  // =========================
  async function safePut(url: string, chunk: Blob, part: number) {
    if (!url) {
      throw new Error(`🚨 Missing URL for part ${part}`);
    }

    const res = await fetch(url, {
      method: "PUT",
      body: chunk,
      signal: controller.signal,
      mode: "cors",
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("❌ PUT ERROR:", text);
      throw new Error(`HTTP ${res.status} - ${text}`);
    }

    const etag = res.headers.get("ETag");
    if (!etag) throw new Error("Missing ETag");

    return etag.replace(/"/g, "");
  }

  // =========================
  // UPLOAD PART
  // =========================
  async function uploadPart(part: number) {
    if (completed.has(part)) return;

    const url = urls?.[part - 1];

    // 🔥 HARD STOP (prevents /undefined)
    if (!url) {
      console.error("🚨 INVALID URL STATE", {
        part,
        urlsLength: urls?.length,
      });
      throw new Error(`Missing URL for part ${part}`);
    }

    const start = (part - 1) * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    // Fetch a fresh URL for the part
    const freshUrls = await fetchUrls();
    urls[part - 1] = freshUrls[part - 1];

    const etag = await withRetry(
      () => safePut(urls[part - 1], chunk, part),
      { retries: 5 }
    );

    parts.push({ PartNumber: part, ETag: etag });
    completed.add(part);
    uploadedBytes += chunk.size;

    emit();
  }

  // =========================
  // CONCURRENCY
  // =========================
  let next = 1;
  const concurrency = 3;

  async function worker() {
    while (next <= totalParts) {
      const p = next++;
      await uploadPart(p);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));

  console.log("📦 FINALIZING");

  const sorted = parts.sort((a, b) => a.PartNumber - b.PartNumber);

  await fetch("/api/upload/multipart/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, uploadId, parts: sorted }),
  });

  console.log("✅ COMPLETE");

  clearUploadState(uploadKey);
  onProgress?.(100);

  return {
    url: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`,
    key,
  };
}