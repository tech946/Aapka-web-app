import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

const MAX_DIMENSION = 2000;
const COMPRESS_ABOVE_BYTES = 1.5 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function readJsonResponse<T = any>(
  res: Response,
  fallbackMessage: string
): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    if (res.status === 413) {
      throw new Error(
        'Your documents are too large to upload. Please use smaller photos and try again.'
      );
    }
    throw new Error(fallbackMessage);
  }
}

async function toJpeg(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    return await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', 0.85)
    );
  } catch {
    return null;
  }
}

async function prepareImage(file: File): Promise<Blob> {
  const type = file.type === 'image/jpg' ? 'image/jpeg' : file.type;
  const accepted = ACCEPTED_TYPES.includes(type);

  if (accepted && file.size <= COMPRESS_ABOVE_BYTES) {
    return type === file.type ? file : new Blob([file], { type });
  }

  const jpeg = await toJpeg(file);
  if (jpeg && (!accepted || jpeg.size < file.size)) return jpeg;
  if (accepted) return type === file.type ? file : new Blob([file], { type });

  throw new Error(
    `"${file.name}" can't be uploaded. Please use a JPG or PNG photo.`
  );
}

export async function uploadBookingDocument(file: File): Promise<string> {
  const blob = await prepareImage(file);

  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `"${file.name}" is larger than 5 MB. Please upload a smaller photo.`
    );
  }

  const res = await fetch('/api/checkout/document-upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contentType: blob.type }),
  });
  const data = await readJsonResponse<{
    bucket?: string;
    path?: string;
    token?: string;
    publicUrl?: string;
    error?: string;
  }>(res, 'Could not prepare your document upload. Please try again.');

  if (!res.ok || !data.bucket || !data.path || !data.token || !data.publicUrl) {
    throw new Error(data.error || 'Could not prepare your document upload. Please try again.');
  }

  const { error } = await createBrowserSupabaseClient()
    .storage.from(data.bucket)
    .uploadToSignedUrl(data.path, data.token, blob, { contentType: blob.type });

  if (error) {
    throw new Error(`Could not upload "${file.name}". Please try again.`);
  }

  return data.publicUrl;
}
