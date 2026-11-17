'use client';

import { useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/api/client';
import { pickImageFile, uploadImage, type UploadFolder } from '@/lib/upload-client';

interface ImageFieldProps {
  value: string;
  onChange: (url: string) => void;
  folder: UploadFolder;
  aspect?: 'wide' | 'square';
}

export function ImageField({ value, onChange, folder, aspect = 'wide' }: ImageFieldProps) {
  const [uploading, setUploading] = useState(false);

  const upload = async () => {
    const file = await pickImageFile();
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadImage(file, folder));
    } catch (err) {
      toast.error(errorMessage(err, 'Image upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className='dk-image-field'>
      <button type='button' className={`dk-image-field__preview dk-image-field__preview--${aspect}`} onClick={upload} disabled={uploading}>
        {value ? (
          <img src={value} alt='' />
        ) : (
          <span className='dk-image-field__empty'>
            <ImagePlus size={20} aria-hidden />
            {uploading ? 'Uploading…' : 'Upload image'}
          </span>
        )}
      </button>
      <div className='dk-image-field__row'>
        <input type='url' value={value} placeholder='…or paste an image URL' onChange={(e) => onChange(e.target.value)} />
        {value && (
          <>
            <button type='button' className='btn_secondary btn_small' onClick={upload} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Replace'}
            </button>
            <button type='button' className='btn_secondary btn_small' onClick={() => onChange('')} aria-label='Remove image'>
              <Trash2 size={14} aria-hidden />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
