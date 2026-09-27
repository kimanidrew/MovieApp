const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 10 * 1024 * 1024 * 1024;

export async function uploadFileToR2(
  file: File,
  assetType: "VIDEO" | "POSTER" | "BACKDROP" | "TRAILER",
  onProgress?: (percent: number) => void
): Promise<string> {
  if (!file) throw new Error("Please choose a file first.");

  const isVideo = assetType === "VIDEO" || assetType === "TRAILER";
  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;

  if (file.size > maxBytes) {
    const maxLabel = isVideo ? "10 GB" : "20 MB";
    throw new Error(`This file is too large. Maximum allowed size is ${maxLabel}.`);
  }

  if (isVideo && !file.type.startsWith("video/")) {
    throw new Error("Please select a video file.");
  }
  if (!isVideo && !file.type.startsWith("image/")) {
    throw new Error("Please select an image file.");
  }

  const response = await fetch("/api/admin/media/r2-ticket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      assetType,
      sizeInBytes: file.size,
    }),
  });

  let data: any = null;
  try { data = await response.json(); } catch { /* handled below */ }

  if (!response.ok) {
    throw new Error(data?.error || "Unable to prepare the R2 upload.");
  }
  if (!data?.uploadUrl || !data?.publicUrl) {
    throw new Error("The storage service returned an incomplete upload response.");
  }

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", data.uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.timeout = isVideo ? 30 * 60 * 1000 : 5 * 60 * 1000;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve(data.publicUrl as string);
      } else {
        reject(new Error(`R2 upload failed (HTTP ${xhr.status}). Check the R2 bucket CORS policy and try again.`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error while uploading. Check your internet connection and R2 bucket CORS settings."));
    xhr.ontimeout = () => reject(new Error("Upload timed out. Check your connection and try again."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    xhr.send(file);
  });
}
