export async function uploadManager(file: File) {
  console.log("📤 Requesting presigned URL for upload...");

  // Step 1: Request presigned URL from the server
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

  // Parse the response from the presigned URL request
  const data = await res.json();

  console.log("📥 Response from presigned URL:", data);

  // Step 2: Check if the request was successful
  if (!res.ok) {
    throw new Error(data.error || "Failed to get presigned URL");
  }

  // Ensure the presigned URL is available
  if (!data.url) {
    throw new Error("No presigned URL returned from server");
  }

  // Step 3: Upload the file to the presigned URL
  console.log("📤 Uploading file to presigned URL...");
  const uploadRes = await fetch(data.url, {
    method: "PUT", // Typically, presigned URLs expect a PUT request
    headers: {
      "Content-Type": file.type, // The content type should match the file's MIME type
    },
    body: file,
  });

  // Check the file upload response
  if (!uploadRes.ok) {
    throw new Error("File upload failed to presigned URL");
  }

  console.log("📥 File successfully uploaded!");

  // Step 4: Return the data needed for further processing (e.g., URL, key)
  return data;
}