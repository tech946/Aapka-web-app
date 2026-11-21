import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

const MAX_DIMENSION = 2000;
const COMPRESS_ABOVE_BYTES = 1.5 * 1024 * 1024;

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

async function compressImage(file: File): Promise<Blob> {
  if (file.size <= COMPRESS_ABOVE_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', 0.85)
    );
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export async function uploadBookingDocument(file: File): Promise<string> {
  const blob = await compressImage(file);
  const contentType = blob.type || file.type || 'image/jpeg';

  const res = await fetch('/api/checkout/document-upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contentType }),
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
    .uploadToSignedUrl(data.path, data.token, blob, { contentType });

  if (error) {
    throw new Error(`Could not upload "${file.name}". Please try again.`);
  }

  return data.publicUrl;
}
