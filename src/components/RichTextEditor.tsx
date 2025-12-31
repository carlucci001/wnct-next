"use client";

import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  Bold, Italic, Underline, List, ListOrdered, Quote, Link as LinkIcon,
  Image as ImageIcon, Code, Undo, Redo, AlignLeft, AlignCenter, AlignRight,
  Sparkles
} from 'lucide-react';

export interface RichTextEditorHandle {
  insertImage: (url: string) => void;
}

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  onImageRequest?: () => void;
  placeholder?: string;
}

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(({ value, onChange, onImageRequest, placeholder = "Write your story here..." }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);

  // Update editor content when value prop changes externally
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  useImperativeHandle(ref, () => ({
    insertImage: (url: string) => {
      const img = document.createElement('img');
      img.src = url;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
        range.collapse(false);
      } else if (editorRef.current) {
        editorRef.current.appendChild(img);
      }

      handleInput();
      editorRef.current?.focus();
    }
  }));

  const execCommand = (command: string, commandValue?: string) => {
    document.execCommand(command, false, commandValue);
    handleInput();
    editorRef.current?.focus();
  };

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      onChange(editorRef.current.innerHTML);
      isUpdatingRef.current = false;
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  // Format and cleanup HTML content
  const formatContent = () => {
    if (!editorRef.current) return;

    let html = editorRef.current.innerHTML;

    // Remove empty paragraphs and divs
    html = html.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '');
    html = html.replace(/<p>\s*&nbsp;\s*<\/p>/gi, '');
    html = html.replace(/<p><\/p>/gi, '');
    html = html.replace(/<div>\s*<br\s*\/?>\s*<\/div>/gi, '');
    html = html.replace(/<div><\/div>/gi, '');

    // Remove excessive <br> tags (more than 2 in a row)
    html = html.replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>');

    // Remove empty spans
    html = html.replace(/<span>\s*<\/span>/gi, '');

    // Clean up multiple spaces
    html = html.replace(/&nbsp;(&nbsp;)+/gi, ' ');

    // Remove inline styles that clutter content (keep essential ones)
    html = html.replace(/\s*style="[^"]*font-family:[^"]*"/gi, '');
    html = html.replace(/\s*style="[^"]*background-color:\s*transparent[^"]*"/gi, '');

    // Ensure paragraphs have proper structure
    // Convert lone text nodes to paragraphs
    html = html.replace(/^([^<]+)$/gm, '<p>$1</p>');

    // Clean up whitespace between tags
    html = html.replace(/>\s+</g, '><');

    // Add proper spacing back
    html = html.replace(/<\/p><p>/g, '</p>\n<p>');
    html = html.replace(/<\/h([1-6])><([hp])/g, '</h$1>\n<$2');
    html = html.replace(/<\/blockquote><([hp])/g, '</blockquote>\n<$1');

    // Update the editor
    editorRef.current.innerHTML = html;
    handleInput();

    // Show feedback
    alert('Content formatted and cleaned up!');
  };

  interface ToolbarButton {
    icon: React.ComponentType<{ size: number; className?: string }> | null;
    command: string;
    label?: string;
    value?: string;
    custom?: () => void;
  }

  const toolbarButtons: ToolbarButton[] = [
    { icon: null, command: 'separator' },
    { icon: Bold, command: 'bold', label: 'Bold (Ctrl+B)' },
    { icon: Italic, command: 'italic', label: 'Italic (Ctrl+I)' },
    { icon: Underline, command: 'underline', label: 'Underline (Ctrl+U)' },
    { icon: null, command: 'separator' },
    { icon: AlignLeft, command: 'justifyLeft', label: 'Align Left' },
    { icon: AlignCenter, command: 'justifyCenter', label: 'Align Center' },
    { icon: AlignRight, command: 'justifyRight', label: 'Align Right' },
    { icon: null, command: 'separator' },
    { icon: List, command: 'insertUnorderedList', label: 'Bullet List' },
    { icon: ListOrdered, command: 'insertOrderedList', label: 'Numbered List' },
    { icon: Quote, command: 'formatBlock', value: 'blockquote', label: 'Quote' },
    { icon: null, command: 'separator' },
    { icon: LinkIcon, command: 'link', label: 'Insert Link', custom: insertLink },
    { icon: Code, command: 'formatBlock', value: 'pre', label: 'Code Block' },
    { icon: null, command: 'separator' },
    { icon: Undo, command: 'undo', label: 'Undo (Ctrl+Z)' },
    { icon: Redo, command: 'redo', label: 'Redo (Ctrl+Y)' },
  ];

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 flex-wrap">
        {/* Heading Dropdown */}
        <select
          onChange={(e) => execCommand('formatBlock', e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm mr-2"
          defaultValue="p"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>

        {/* Toolbar Buttons */}
        {toolbarButtons.map((btn, idx) => {
          if (btn.command === 'separator') {
            return <div key={idx} className="w-px h-6 bg-gray-300 mx-1" />;
          }

          const Icon = btn.icon;
          if (!Icon) return null;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (btn.custom) {
                  btn.custom();
                } else {
                  execCommand(btn.command, btn.value);
                }
              }}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title={btn.label}
            >
              <Icon size={16} className="text-gray-700" />
            </button>
          );
        })}

        {/* Image Insert Button */}
        {onImageRequest && (
          <>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <button
              type="button"
              onClick={onImageRequest}
              className="p-2 hover:bg-gray-200 rounded transition-colors bg-blue-50"
              title="Insert Image from Library"
            >
              <ImageIcon size={16} className="text-blue-600" />
            </button>
          </>
        )}

        {/* Format/Cleanup Button */}
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={formatContent}
          className="p-2 hover:bg-gray-200 rounded transition-colors bg-amber-50 flex items-center gap-1"
          title="Format & Cleanup Content"
        >
          <Sparkles size={16} className="text-amber-600" />
          <span className="text-xs font-medium text-amber-700 hidden sm:inline">Format</span>
        </button>
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={() => {
          // Allow default paste behavior but clean up afterward
          setTimeout(handleInput, 0);
        }}
        className="min-h-[500px] p-4 focus:outline-none prose prose-lg max-w-none"
        style={{
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }}
        data-placeholder={placeholder}
      />

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          cursor: text;
        }
        [contenteditable]:focus {
          outline: 2px solid #3B82F6;
          outline-offset: -2px;
        }
        [contenteditable] h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
        }
        [contenteditable] h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0;
        }
        [contenteditable] h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.83em 0;
        }
        [contenteditable] h4 {
          font-size: 1em;
          font-weight: bold;
          margin: 1.12em 0;
        }
        [contenteditable] p {
          margin: 1em 0;
        }
        [contenteditable] blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin: 1em 0;
          color: #6b7280;
          font-style: italic;
        }
        [contenteditable] pre {
          background: #f3f4f6;
          padding: 1em;
          border-radius: 0.5em;
          overflow-x: auto;
          font-family: monospace;
        }
        [contenteditable] ul, [contenteditable] ol {
          margin: 1em 0;
          padding-left: 2em;
        }
        [contenteditable] a {
          color: #2563eb;
          text-decoration: underline;
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          margin: 1em 0;
          display: block;
        }
      `}</style>
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
