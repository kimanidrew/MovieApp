import { exec } from "child_process";

export async function processVideo(inputPath: string, outputDir: string) {
  console.log("🎬 START PROCESSING:", inputPath);

  // 1. HLS conversion (streaming)
  await run(`
    ffmpeg -i ${inputPath} \
    -codec: copy \
    -start_number 0 \
    -hls_time 10 \
    -hls_list_size 0 \
    -f hls ${outputDir}/index.m3u8
  `);

  console.log("📺 HLS CREATED");

  // 2. Thumbnails
  await run(`
    ffmpeg -i ${inputPath} -ss 00:00:05 -vframes 1 ${outputDir}/thumb.jpg
  `);

  console.log("🖼 THUMBNAIL CREATED");

  // 3. Multiple qualities
  await run(`
    ffmpeg -i ${inputPath} -vf scale=1280:720 ${outputDir}/720p.mp4
  `);

  console.log("🎥 720p READY");
}

function run(cmd: string) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout) => {
      if (err) return reject(err);
      console.log(stdout);
      resolve(stdout);
    });
  });
}