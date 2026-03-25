import { useEffect, useRef } from 'react';
import { BubbleMenu, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { Editor } from '@tiptap/react';
import type { RichTextNode } from '../../types/board';
import { tiptapToRichText } from '../lib/tiptap';

interface Props {
  content: RichTextNode;
  isEditing: boolean;
  onSave: (content: RichTextNode, isEmpty: boolean) => void;
  onEditorReady?: (editor: Editor) => void;
}

export default function RichTextEditor({ content, isEditing, onSave, onEditorReady }: Props) {
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const hasSaved = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: content as object,
    editable: false,
    editorProps: {
      attributes: {
        style: [
          'outline: none',
          'font-family: var(--font-sans)',
          'font-size: 16px',
          'color: var(--text-primary)',
          'overflow-wrap: break-word',
          'word-break: break-word',
          'min-height: 24px',
        ].join(';'),
      },
    },
    onBlur: ({ editor: e }) => {
      setTimeout(() => {
        if (!e.isFocused && !hasSaved.current) {
          hasSaved.current = true;
          onSaveRef.current(tiptapToRichText(e.getJSON()), e.isEmpty);
        }
      }, 150);
    },
  });

  useEffect(() => {
    if (editor && onEditorReady) onEditorReady(editor);
  }, [editor]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!editor) return;
    if (isEditing) {
      hasSaved.current = false;
      editor.setEditable(true);
      setTimeout(() => editor.commands.focus('end'), 0);
    } else {
      if (!hasSaved.current) {
        hasSaved.current = true;
        onSaveRef.current(tiptapToRichText(editor.getJSON()), editor.isEmpty);
      }
      editor.setEditable(false);
    }
  }, [editor, isEditing]);

  if (!editor) return null;

  return (
    <>
      <style>{`
        .ProseMirror { cursor: inherit; }
        .ProseMirror p { margin: 0; padding: 0; }
        .ProseMirror code {
          font-family: var(--font-mono);
          font-size: 13px;
          background: var(--item-hover-bg);
          padding: 1px 4px;
          border-radius: 3px;
        }
        .ProseMirror pre {
          background: var(--item-hover-bg);
          border-radius: 6px;
          padding: 10px 12px;
          margin: 4px 0;
          overflow-x: auto;
          white-space: pre;
          tab-size: 2;
        }
        .ProseMirror pre code {
          background: none;
          padding: 0;
          border-radius: 0;
          font-family: var(--font-mono);
          font-size: 13px;
          white-space: pre;
        }
        .altq-bubble {
          display: flex;
          gap: 2px;
          background: var(--panel-bg);
          border: 1px solid var(--toolbar-border);
          border-radius: 6px;
          padding: 3px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .altq-bubble-btn {
          height: 26px;
          padding: 0 8px;
          border: none;
          border-radius: 4px;
          background: transparent;
          color: var(--text-secondary);
          font-family: var(--font-sans);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }
        .altq-bubble-btn:hover {
          background: var(--item-hover-bg);
          color: var(--text-primary);
        }
        .altq-bubble-btn.active {
          background: var(--item-hover-bg);
          color: var(--text-primary);
        }
      `}</style>

      {/* Always mounted — shouldShow guards visibility to avoid removeChild errors */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 80, zIndex: 2000 }}
        shouldShow={({ editor: e }) => isEditing && !e.state.selection.empty}
      >
        <div className="altq-bubble">
          <button
            className={`altq-bubble-btn${editor.isActive('bold') ? ' active' : ''}`}
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
            style={{ fontWeight: 700 }}
          >B</button>
          <button
            className={`altq-bubble-btn${editor.isActive('italic') ? ' active' : ''}`}
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
            style={{ fontStyle: 'italic' }}
          >I</button>
          <button
            className={`altq-bubble-btn${editor.isActive('code') ? ' active' : ''}`}
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleCode().run(); }}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
          >`</button>
          <button
            className={`altq-bubble-btn${editor.isActive('codeBlock') ? ' active' : ''}`}
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleCodeBlock().run(); }}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
          >{'{ }'}</button>
        </div>
      </BubbleMenu>

      <EditorContent editor={editor} />
    </>
  );
}
