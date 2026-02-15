'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Paragraph from '@tiptap/extension-paragraph';
import { Button, Space, Tooltip } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  UndoOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import {
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Minus,
  Strikethrough,
} from 'lucide-react';
import { useEffect } from 'react';

interface TipTapEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  height?: number;
}

const TipTapEditor: React.FC<TipTapEditorProps> = ({
  content = '',
  onChange,
  placeholder = 'Start typing...',
  className = '',
  height = 200,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        paragraph: {},
        bold: {},
        italic: {},
        strike: {},
        code: {},
        codeBlock: {},
        blockquote: {},
        horizontalRule: {},
        hardBreak: false,
      }),
      BulletList,
      OrderedList,
      ListItem,
      Paragraph,
    ],
    content,
    immediatelyRender: false, // Fix SSR hydration mismatch
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none ${className}`,
        style: `min-height: ${height}px; padding: 12px; border: 1px solid #d9d9d9; border-radius: 6px;`,
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const MenuButton = ({
    onClick,
    isActive = false,
    icon,
    tooltip,
  }: {
    onClick: () => void;
    isActive?: boolean;
    icon: React.ReactNode;
    tooltip: string;
  }) => (
    <Tooltip title={tooltip}>
      <Button
        type={isActive ? 'primary' : 'default'}
        size='small'
        icon={icon}
        onClick={onClick}
        className='tiptap-toolbar-btn'
        style={{
          backgroundColor: isActive ? 'var(--accent, #ff4c00)' : 'transparent',
          borderColor: isActive ? 'var(--accent, #ff4c00)' : 'var(--border, #e5e7eb)',
          color: isActive ? '#fff' : 'var(--text, #111827)',
        }}
      />
    </Tooltip>
  );

  const Divider = () => (
    <div
      style={{
        width: '1px',
        height: '20px',
        backgroundColor: 'var(--border, #e5e7eb)',
        margin: '0 4px',
      }}
    />
  );

  return (
    <div className='tiptap-editor'>
      {/* Toolbar */}
      <div className='tiptap-toolbar'>
        <Space size='small' wrap>
          {/* Headings */}
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            icon={<Heading1 size={16} />}
            tooltip='Heading 1'
          />
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            icon={<Heading2 size={16} />}
            tooltip='Heading 2'
          />
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            icon={<Heading3 size={16} />}
            tooltip='Heading 3'
          />
          <Divider />
          {/* Text formatting */}
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            icon={<BoldOutlined />}
            tooltip='Bold'
          />
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            icon={<ItalicOutlined />}
            tooltip='Italic'
          />
          <MenuButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            icon={<Strikethrough size={16} />}
            tooltip='Strikethrough'
          />
          <MenuButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            icon={<Code size={16} />}
            tooltip='Inline Code'
          />
          <Divider />
          {/* Lists */}
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            icon={<UnorderedListOutlined />}
            tooltip='Bullet List'
          />
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            icon={<OrderedListOutlined />}
            tooltip='Numbered List'
          />
          <Divider />
          {/* Block elements */}
          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            icon={<Quote size={16} />}
            tooltip='Blockquote'
          />
          <MenuButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            icon={<Code size={16} style={{ fontWeight: 'bold' }} />}
            tooltip='Code Block'
          />
          <MenuButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            icon={<Minus size={16} />}
            tooltip='Horizontal Rule'
          />
          <Divider />
          {/* History */}
          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            icon={<UndoOutlined />}
            tooltip='Undo'
          />
          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            icon={<RedoOutlined />}
            tooltip='Redo'
          />
        </Space>
      </div>

      {/* Editor Content */}
      <div style={{ position: 'relative' }}>
        <EditorContent
          editor={editor}
          style={{
            minHeight: `${height}px`,
          }}
        />

        {/* Placeholder */}
        {editor.isEmpty && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              color: '#bfbfbf',
              pointerEvents: 'none',
              fontSize: '14px',
            }}
          >
            {placeholder}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className='tiptap-instructions'>
        Headings (H1–H3), bold, italic, lists, blockquote, code blocks. Press Enter for new paragraphs.
      </div>
    </div>
  );
};

export default TipTapEditor;
