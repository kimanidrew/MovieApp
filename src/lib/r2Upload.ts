export async function uploadFileToR2(file: File, assetType: "VIDEO" | "POSTER" | "BACKDROP" | "TRAILER") {
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

  const uploadResponse = await fetch(data.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Upload to Cloudflare R2 failed.");
  }

  return data.publicUrl as string;
}
