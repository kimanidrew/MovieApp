"use server";

export async function createBunnyVideoPlaceholder(
  title: string
) {
  const LIBRARY_ID =
    process.env.BUNNY_LIBRARY_ID;

  const API_KEY =
    process.env.BUNNY_API_KEY;

  if (!LIBRARY_ID || !API_KEY) {
    throw new Error(
      "Missing Bunny environment variables"
    );
  }

  const response = await fetch(
    `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type":
          "application/json",
        AccessKey: API_KEY,
      },
      body: JSON.stringify({
        title,
      }),
    }
  );

  if (!response.ok) {
    const errText =
      await response.text();

    throw new Error(
      `Bunny initialization failed: ${errText}`
    );
  }

  const data = await response.json();

  return {
    bunnyVideoId: data.guid,
  };
}

export async function getBunnyVideoStatus(
  videoId: string
) {
  const LIBRARY_ID =
    process.env.BUNNY_LIBRARY_ID;

  const API_KEY =
    process.env.BUNNY_API_KEY;

  if (!LIBRARY_ID || !API_KEY) {
    throw new Error(
      "Missing Bunny environment variables"
    );
  }

  const response = await fetch(
    `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        AccessKey: API_KEY,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed fetching Bunny video status"
    );
  }

  const data = await response.json();

  return {
    status: data.status,
    encodeProgress:
      data.encodeProgress || 0,
    isFinished: data.status === 4,
  };
}