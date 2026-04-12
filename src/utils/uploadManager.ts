export async function uploadManager(file: File) {
  console.log("📤 Uploading...");

  const res = await fetch("/api/upload/presign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
    }),
  });

  const data = await res.json();

  console.log("📥 Response:", data);

  if (!res.ok) {
    throw new Error(data.error || "Upload failed");
  }

  if (!data.url) {
    throw new Error("No presigned URL returned from server");
  }

  return data;
}