import { api } from '@/lib/api/client';

export type UploadFolder = 'blogs' | 'cms';

export async function uploadImage(file: File, folder: UploadFolder): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);
  const { url } = await api.post<{ url: string }>('/api/dashboard/uploads', form);
  return url;
}

export function pickImageFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/avif,image/gif';
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}
