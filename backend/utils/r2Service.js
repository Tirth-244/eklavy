import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
  endpoint: process.env.R2_ENDPOINT, // e.g. https://<accountid>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  region: 'auto',
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';

/**
 * Uploads a file buffer or stream to Cloudflare R2
 * @param {string} key - R2 destination key/path
 * @param {Buffer|ArrayBuffer|string} body - File content
 * @param {string} contentType - Mime-type
 */
export const uploadToR2 = async (key, body, contentType) => {
  if (!BUCKET_NAME) {
    throw new Error('R2_BUCKET_NAME is not configured');
  }
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  return r2Client.send(command);
};

/**
 * Downloads a file from Cloudflare R2
 * @param {string} key - R2 key/path
 */
export const getFromR2 = async (key) => {
  if (!BUCKET_NAME) {
    throw new Error('R2_BUCKET_NAME is not configured');
  }
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  const response = await r2Client.send(command);
  return response.Body; // Stream
};

export default r2Client;
