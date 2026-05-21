import "dotenv/config";
import { Worker } from "bullmq";
import { spawn } from "child_process";
import fs from "fs";

new Worker("youtube-download", async (job) => {
  const { url } = job.data;

  const filePath = `/tmp/${job.id}.mp4`;

  // Download best source
  await new Promise((resolve, reject) => {
    const proc = spawn("yt-dlp", [
      "-f",
      "bv*+ba/best",
      "-o",
      filePath,
      url,
    ]);

    proc.on("close", (code) => {
      code === 0 ? resolve(true) : reject();
    });
  });

  // Upload to Cloudflare Stream
  const form = new FormData();

  form.append(
    "file",
    new Blob([fs.readFileSync(filePath)]),
    "video.mp4"
  );

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/stream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CF_STREAM_TOKEN}`,
      },
      body: form,
    }
  );

  const data = await res.json();

  console.log(data);

  fs.unlinkSync(filePath);
});