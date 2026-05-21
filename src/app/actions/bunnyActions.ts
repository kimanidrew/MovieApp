"use server";

export async function createBunnyVideoPlaceholder(title: string) {
  const LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
  const API_KEY = process.env.BUNNY_API_KEY;

  if (!LIBRARY_ID || !API_KEY) {
    throw new Error("Missing Bunny environmental configuration values.");
  }

  const response = await fetch(
    `https://bunnycdn.com{LIBRARY_ID}/videos`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        AccessKey: API_KEY,
      },
      body: JSON.stringify({ title }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Bunny placeholder initialization failed: ${errText}`);
  }

  const data = await response.json();
  return { bunnyVideoId: data.guid };
}
