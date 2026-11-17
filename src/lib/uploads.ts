import 'server-only';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ApiError, badRequest } from '@/lib/api/errors';

const BUCKET = 'images';
const MAX_BYTES = 8 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

export const UPLOAD_FOLDERS = ['blogs', 'cms'] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export async function uploadImage(file: File, folder: UploadFolder): Promise<string> {
  const ext = EXTENSIONS[file.type];
  if (!ext) throw badRequest('Use a JPG, PNG, WebP, AVIF or GIF image.');
  if (file.size > MAX_BYTES) throw badRequest('Images must be 8 MB or smaller.');

  const path = `${folder}/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ext}`;
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (error) {
    console.error('[uploads]', error);
    throw new ApiError(500, 'Upload failed. Please try again.');
  }

  return supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
