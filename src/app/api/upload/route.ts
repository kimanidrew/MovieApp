import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('video') as File | null;
    const thumbnail = formData.get('thumbnail') as File | null;
    const title = formData.get('title') as string || 'Untitled';
    const description = formData.get('description') as string || '';
    const releaseYear = formData.get('releaseYear') as string;
    
    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${file.name.replace(/\s+/g, '-')}`;
    
    const publicDir = join(process.cwd(), 'public', 'videos');
    await mkdir(publicDir, { recursive: true });
    
    const filepath = join(publicDir, filename);
    await writeFile(filepath, buffer);
    const videoUrl = `/videos/${filename}`;
    
    let thumbnailUrl = null;
    if (thumbnail) {
      const thumbBytes = await thumbnail.arrayBuffer();
      const thumbFilename = `${uniqueSuffix}-${thumbnail.name.replace(/\s+/g, '-')}`;
      const thumbDir = join(process.cwd(), 'public', 'thumbnails');
      await mkdir(thumbDir, { recursive: true });
      await writeFile(join(thumbDir, thumbFilename), Buffer.from(thumbBytes));
      thumbnailUrl = `/thumbnails/${thumbFilename}`;
    }

    const video = await prisma.video.create({
      data: {
        title,
        description,
        releaseYear: releaseYear ? parseInt(releaseYear, 10) : new Date().getFullYear(),
        videoUrl,
        thumbnailUrl
      }
    });

    // START BACKGROUND ADAPTIVE HLS CONVERSION
    const hlsDir = join(process.cwd(), 'public', 'videos', 'hls', video.id);
    await mkdir(hlsDir, { recursive: true });

    ffmpeg(filepath)
      .outputOptions([
        '-preset veryfast',
        '-g 48', '-sc_threshold 0',
        '-map 0:v:0', '-map 0:v:0',
        '-s:v:0 1280x720', '-c:v:0 libx264', '-b:v:0 1500k',
        '-s:v:1 854x480', '-c:v:1 libx264', '-b:v:1 800k',
        // Provide audio map only if audio stream safely exists, dropping the ? complex notation for compatibility. Assumes file has audio.
        '-map 0:a:0', '-map 0:a:0',
        '-c:a copy',
        '-var_stream_map', 'v:0,a:0 v:1,a:1',
        '-master_pl_name', 'master.m3u8',
        '-f hls',
        '-hls_time 10',
        '-hls_list_size 0',
        '-hls_segment_filename', join(hlsDir, 'v%v_segment%d.ts')
      ])
      .output(join(hlsDir, 'v%v_playlist.m3u8'))
      .on('end', async () => {
        console.log('HLS Conversion finished for', video.id);
        const hlsManifestUrl = `/videos/hls/${video.id}/master.m3u8`;
        try {
          await prisma.video.update({
            where: { id: video.id },
            data: { hlsManifestUrl }
          });
          console.log('HLS path saved to DB.');
        } catch (dbErr) {
          console.error('Failed to update DB with HLS path:', dbErr);
        }
      })
      .on('error', (err) => {
        console.error('HLS Conversion Error. It will fallback to MP4. Error:', err.message);
      })
      .run();

    return NextResponse.json({ success: true, video });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Upload failed', details: error.message }, { status: 500 });
  }
}
