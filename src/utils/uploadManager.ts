export async function uploadManager(file: File) {
  const res = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to get presigned URL");
  }

  // ✅ Upload using uploadUrl
  const uploadRes = await fetch(data.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error("Upload failed");
  }

  // ✅ RETURN PUBLIC URL
  return {
    url: data.publicUrl,
    key: data.key,
  };
}