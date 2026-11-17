import { UPLOAD_PERMISSIONS } from '@/lib/access';
import { withPermission } from '@/lib/api/route';
import { badRequest } from '@/lib/api/errors';
import { UPLOAD_FOLDERS, uploadImage, type UploadFolder } from '@/lib/uploads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withPermission(UPLOAD_PERMISSIONS, async (req) => {
  const form = await req.formData();
  const file = form.get('file');
  const folder = String(form.get('folder') ?? '');

  if (!(file instanceof File)) throw badRequest('Choose an image to upload.');
  if (!UPLOAD_FOLDERS.includes(folder as UploadFolder)) throw badRequest('Unknown upload folder.');

  return { url: await uploadImage(file, folder as UploadFolder) };
});
