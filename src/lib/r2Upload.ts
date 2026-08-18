/**
 * Uploads a file to Cloudflare R2 via a presigned URL.
 * Uses XMLHttpRequest to support real upload progress tracking.
 */
export async function uploadFileToR2(
  file: File,
  assetType: "VIDEO" | "POSTER" | "BACKDROP" | "TRAILER",
  onProgress?: (percent: number) => void
): Promise<string> {
  // 1. Acquire presigned upload URL
  const response = await fetch("/api/admin/media/r2-ticket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      assetType,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to acquire R2 upload credentials.");
  }

  if (!data.uploadUrl) {
    throw new Error("R2 upload URL missing from server response.");
  }

  // 2. Upload the file to the presigned URL with progress tracking via XHR
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", data.uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data.publicUrl as string);
      } else {
        reject(new Error(`Upload to Cloudflare R2 failed (HTTP ${xhr.status}).`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error while uploading to Cloudflare R2. Please check your connection and try again."));
    };

    xhr.ontimeout = () => {
      reject(new Error("Upload timed out. For very large video files, consider uploading a smaller file or check your network speed."));
    };

    xhr.send(file);
  });
}