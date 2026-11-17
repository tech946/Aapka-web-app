'use client';

import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  type LucideIcon,
} from 'lucide-react';

interface ToolbarAction {
  label: string;
  icon: LucideIcon;
  run: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

interface RichTextToolbarProps {
  editor: Editor;
  onInsertImage: () => void;
  uploading: boolean;
}

function promptLink(editor: Editor) {
  const previous = editor.getAttributes('link').href as string | undefined;
  const href = window.prompt('Link URL (leave empty to remove)', previous ?? 'https://');
  if (href === null) return;
  const chain = editor.chain().focus().extendMarkRange('link');
  if (href.trim() === '') chain.unsetLink().run();
  else chain.setLink({ href: href.trim(), target: /^https?:\/\//.test(href) ? '_blank' : null }).run();
}

export function RichTextToolbar({ editor, onInsertImage, uploading }: RichTextToolbarProps) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      paragraph: e.isActive('paragraph'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      bulletList: e.isActive('bulletList'),
      orderedList: e.isActive('orderedList'),
      blockquote: e.isActive('blockquote'),
      link: e.isActive('link'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const chain = () => editor.chain().focus();

  const groups: ToolbarAction[][] = [
    [
      { label: 'Paragraph', icon: Pilcrow, run: () => chain().setParagraph().run(), isActive: state.paragraph },
      { label: 'Heading', icon: Heading2, run: () => chain().toggleHeading({ level: 2 }).run(), isActive: state.h2 },
      { label: 'Subheading', icon: Heading3, run: () => chain().toggleHeading({ level: 3 }).run(), isActive: state.h3 },
    ],
    [
      { label: 'Bold', icon: Bold, run: () => chain().toggleBold().run(), isActive: state.bold },
      { label: 'Italic', icon: Italic, run: () => chain().toggleItalic().run(), isActive: state.italic },
      { label: 'Underline', icon: Underline, run: () => chain().toggleUnderline().run(), isActive: state.underline },
      { label: 'Strikethrough', icon: Strikethrough, run: () => chain().toggleStrike().run(), isActive: state.strike },
      { label: 'Link', icon: Link2, run: () => promptLink(editor), isActive: state.link },
    ],
    [
      { label: 'Bullet list', icon: List, run: () => chain().toggleBulletList().run(), isActive: state.bulletList },
      { label: 'Numbered list', icon: ListOrdered, run: () => chain().toggleOrderedList().run(), isActive: state.orderedList },
      { label: 'Quote', icon: Quote, run: () => chain().toggleBlockquote().run(), isActive: state.blockquote },
      { label: 'Divider', icon: Minus, run: () => chain().setHorizontalRule().run() },
      { label: uploading ? 'Uploading…' : 'Image', icon: ImagePlus, run: onInsertImage, disabled: uploading },
    ],
    [
      { label: 'Undo', icon: Undo2, run: () => chain().undo().run(), disabled: !state.canUndo },
      { label: 'Redo', icon: Redo2, run: () => chain().redo().run(), disabled: !state.canRedo },
    ],
  ];

  return (
    <div className='dk-rte__toolbar' role='toolbar' aria-label='Formatting'>
      {groups.map((group, i) => (
        <div key={i} className='dk-rte__group'>
          {group.map(({ label, icon: Icon, run, isActive, disabled }) => (
            <button
              key={label}
              type='button'
              className={`dk-rte__btn${isActive ? ' is-active' : ''}`}
              onClick={run}
              disabled={disabled}
              title={label}
              aria-label={label}
              aria-pressed={isActive}
            >
              <Icon size={16} strokeWidth={2} aria-hidden />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
