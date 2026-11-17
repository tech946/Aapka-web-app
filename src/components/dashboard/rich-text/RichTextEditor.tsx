'use client';

import { useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/api/client';
import { pickImageFile, uploadImage, type UploadFolder } from '@/lib/upload-client';
import { ImageNode } from './image-node';
import { RichTextToolbar } from './RichTextToolbar';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  uploadFolder: UploadFolder;
  placeholder?: string;
  minHeight?: number;
  readOnly?: boolean;
}

export function RichTextEditor({ value, onChange, uploadFolder, placeholder = 'Start writing…', minHeight = 320, readOnly = false }: RichTextEditorProps) {
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true },
      }),
      ImageNode,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: { attributes: { class: 'dk-rte__content', style: `min-height:${minHeight}px` } },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
  });

  const insertImage = async () => {
    if (!editor) return;
    const file = await pickImageFile();
    if (!file) return;
    setUploading(true);
    try {
      const src = await uploadImage(file, uploadFolder);
      editor.chain().focus().insertContent({ type: 'image', attrs: { src, alt: '' } }).run();
    } catch (err) {
      toast.error(errorMessage(err, 'Image upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className='dk-rte'>
      {editor && !readOnly && <RichTextToolbar editor={editor} onInsertImage={insertImage} uploading={uploading} />}
      <EditorContent editor={editor} />
    </div>
  );
}
