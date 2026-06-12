// app/actions/stream.ts

"use server";

export async function getCloudflareVideoStatus(uid: string) {
  const accountId = process.env.CF_ACCOUNT_ID!;
  const token = process.env.CF_STREAM_TOKEN!;

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${uid}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  const data = await response.json();

  const video = data.result;

  return {
    readyToStream: video.readyToStream,
    status: video.status?.state,
    pctComplete: video.status?.pctComplete ?? 0,
  };
}