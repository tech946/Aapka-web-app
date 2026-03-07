/**
 * Upload and delete images using Supabase Storage bucket "images"
 * Same strategy as before: save URLs to tables, but now using Supabase instead of Cloudinary
 */

const BUCKET_NAME = 'images';

/**
 * Upload image to Supabase Storage (images bucket)
 * Uses API route for server-side upload with service role
 */
export async function uploadImageToSupabase(
  file: File,
  folder: string = 'packages'
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await fetch('/api/storage/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Failed to upload image');
  }

  const data = await response.json();
  return data.url;
}

/**
 * Upload PDF to Supabase Storage (documents bucket)
 * Uses API route for server-side upload with service role
 */
export async function uploadPdfToSupabase(
  file: File,
  folder: string = 'pdf'
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await fetch('/api/storage/upload-pdf', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Failed to upload PDF');
  }

  const data = await response.json();
  return data.url;
}

/**
 * Delete image from Supabase Storage
 * Extracts path from Supabase storage URL and deletes it
 */
export async function deleteImageFromSupabase(imageUrl: string): Promise<void> {
  if (!imageUrl || !imageUrl.includes('supabase')) {
    return; // Not a Supabase URL, skip deletion
  }

  try {
    // Extract path from Supabase storage URL
    // Format: https://{project}.supabase.co/storage/v1/object/public/images/{path}
    const match = imageUrl.match(/\/object\/public\/images\/(.+)$/);
    if (!match) return;

    const path = match[1];

    const response = await fetch('/api/storage/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });

    if (!response.ok) {
      console.error('Failed to delete image from Supabase storage');
    }
  } catch (error) {
    console.error('Error deleting image from Supabase storage:', error);
  }
}

/**
 * Delete PDF from Supabase Storage (packages bucket)
 */
export async function deletePdfFromSupabase(pdfUrl: string): Promise<void> {
  if (!pdfUrl || !pdfUrl.includes('supabase')) {
    return;
  }

  try {
    const match = pdfUrl.match(/\/object\/public\/packages\/(.+)$/);
    if (!match) return;

    const path = match[1];

    const response = await fetch('/api/storage/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, bucket: 'packages' }),
    });

    if (!response.ok) {
      console.error('Failed to delete PDF from Supabase storage');
    }
  } catch (error) {
    console.error('Error deleting PDF from Supabase storage:', error);
  }
}
