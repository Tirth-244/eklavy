import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import Lecture from '../models/Lecture.js';
import { uploadToR2 } from './r2Service.js';

const execPromise = promisify(exec);

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 */
const formatDuration = (seconds) => {
  const secNum = parseInt(seconds, 10);
  const hours = Math.floor(secNum / 3600);
  const minutes = Math.floor((secNum - hours * 3600) / 60);
  const secs = secNum - hours * 3600 - minutes * 60;

  const pad = (n) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${pad(minutes)}:${pad(secs)}`;
};

/**
 * Get video duration using ffprobe
 */
const getVideoDuration = async (inputPath) => {
  try {
    const { stdout } = await execPromise(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`
    );
    const durationSec = parseFloat(stdout.trim());
    if (isNaN(durationSec)) return '00:00';
    return formatDuration(durationSec);
  } catch (error) {
    console.error('Error getting duration via ffprobe:', error);
    return '00:00';
  }
};

/**
 * Processes video: converts to HLS, uploads segments + playlist to R2, updates Lecture model
 */
export const processVideoToHLS = async (lectureId, inputFilePath) => {
  const tempDir = path.join(path.dirname(inputFilePath), `hls-${lectureId}`);
  
  try {
    console.log(`🎬 Starting video processing for lecture ${lectureId}...`);
    
    // Update lecture status to processing
    await Lecture.findByIdAndUpdate(lectureId, { status: 'processing' });

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const playlistName = 'playlist.m3u8';
    const outputPlaylistPath = path.join(tempDir, playlistName);

    // 1. Get video duration
    const duration = await getVideoDuration(inputFilePath);
    console.log(`⏱️ Video duration: ${duration}`);

    // 2. Run FFmpeg command to slice into HLS segments
    console.log('🔄 Running FFmpeg conversion to HLS...');
    // ffmpeg command as specified:
    // ffmpeg -i input.mp4 -codec: copy -start_number 0 -hls_time 10 -hls_list_size 0 -f hls output.m3u8
    const ffmpegCmd = `ffmpeg -i "${inputFilePath}" -codec: copy -start_number 0 -hls_time 10 -hls_list_size 0 -f hls "${outputPlaylistPath}"`;
    await execPromise(ffmpegCmd);
    console.log('✅ HLS conversion completed.');

    // 3. Read generated HLS files in temp directory and upload to R2
    const files = fs.readdirSync(tempDir);
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      throw new Error(`Lecture ${lectureId} not found in database`);
    }

    const courseId = lecture.courseId.toString();
    const uploadPrefix = `courses/${courseId}/lectures/${lectureId}/`;

    console.log(`📤 Uploading HLS files to Cloudflare R2 under: ${uploadPrefix}`);
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const fileKey = `${uploadPrefix}${file}`;
      
      const fileBuffer = fs.readFileSync(filePath);
      const isM3U8 = file.endsWith('.m3u8');
      const contentType = isM3U8 ? 'application/x-mpegURL' : 'video/MP2T';
      
      await uploadToR2(fileKey, fileBuffer, contentType);
    }
    console.log('✅ Upload to R2 completed.');

    // 4. Update Lecture schema status and properties
    const relativeR2Path = `${uploadPrefix}${playlistName}`;
    await Lecture.findByIdAndUpdate(lectureId, {
      status: 'ready',
      r2Path: relativeR2Path,
      duration,
    });
    console.log(`🎉 Lecture ${lectureId} is now READY!`);

  } catch (error) {
    console.error(`❌ Error processing video for lecture ${lectureId}:`, error);
    await Lecture.findByIdAndUpdate(lectureId, { status: 'pending' }); // fallback
  } finally {
    // 5. Clean up temporary directories and source files
    try {
      if (fs.existsSync(inputFilePath)) {
        fs.unlinkSync(inputFilePath);
      }
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      console.log('🧹 Cleaned up local temp files.');
    } catch (cleanupError) {
      console.error('⚠️ Cleanup failed:', cleanupError);
    }
  }
};
