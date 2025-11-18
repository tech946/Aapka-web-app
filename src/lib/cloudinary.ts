/**
 * Upload image to Cloudinary from frontend
 * This uses unsigned upload with upload preset
 */
export async function uploadImageToCloudinary(
  file: File,
  folder: string = 'packages'
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append(
    'upload_preset',
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ''
  );
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Failed to upload image');
  }

  const data = await response.json();
  return data.secure_url;
}

/**
 * Delete image from Cloudinary
 * Extracts public_id from URL and deletes it
 */
export async function deleteImageFromCloudinary(
  imageUrl: string
): Promise<void> {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
    return; // Not a Cloudinary URL, skip deletion
  }

  try {
    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
    const urlParts = imageUrl.split('/upload/');
    if (urlParts.length < 2) return;

    const pathAfterUpload = urlParts[1];
    // Remove version if present (v1234567890/)
    const pathWithoutVersion = pathAfterUpload.replace(/^v\d+\//, '');
    // Remove file extension
    const publicId = pathWithoutVersion.replace(/\.[^/.]+$/, '');

    // Delete using server-side API
    const response = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_id: publicId }),
    });

    if (!response.ok) {
      console.error('Failed to delete image from Cloudinary');
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
  }
}

/**
 * Extract public_id from Cloudinary URL (for server-side deletion)
 */
export function extractPublicIdFromUrl(url: string): string | null {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }

  try {
    const urlParts = url.split('/upload/');
    if (urlParts.length < 2) return null;

    const pathAfterUpload = urlParts[1];
    const pathWithoutVersion = pathAfterUpload.replace(/^v\d+\//, '');
    const publicId = pathWithoutVersion.replace(/\.[^/.]+$/, '');
    return publicId;
  } catch {
    return null;
  }
}
