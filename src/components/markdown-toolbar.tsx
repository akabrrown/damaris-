'use client';

import React from 'react';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Link2,
  Minus,
  Indent,
  Outdent,
} from 'lucide-react';
import { PostKind } from '@/lib/schemas';

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  kind?: PostKind;
}

export function wrapSelectionInTextarea(
  textarea: HTMLTextAreaElement,
  value: string,
  before: string,
  after: string,
  placeholder: string,
  onChange: (val: string) => void
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);

  const replacement = selected.length > 0 ? `${before}${selected}${after}` : `${before}${placeholder}${after}`;
  const nextValue = value.slice(0, start) + replacement + value.slice(end);
  onChange(nextValue);

  requestAnimationFrame(() => {
    textarea.focus();
    if (selected.length > 0) {
      textarea.setSelectionRange(start + before.length, end + before.length);
    } else {
      textarea.setSelectionRange(start + before.length, start + before.length + placeholder.length);
    }
  });
}

export function prefixLinesInTextarea(
  textarea: HTMLTextAreaElement,
  value: string,
  prefix: string | ((line: string, index: number) => string),
  onChange: (val: string) => void
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineEndIdx = value.indexOf('\n', end);
  const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;

  const affectedText = value.slice(lineStart, lineEnd);
  const lines = affectedText.split('\n');

  const modifiedLines = lines.map((line, idx) => {
    if (typeof prefix === 'function') {
      return prefix(line, idx);
    }
    return `${prefix}${line}`;
  });

  const replacement = modifiedLines.join('\n');
  const nextValue = value.slice(0, lineStart) + replacement + value.slice(lineEnd);
  onChange(nextValue);

  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(lineStart, lineStart + replacement.length);
  });
}

export function outdentLinesInTextarea(
  textarea: HTMLTextAreaElement,
  value: string,
  spaces = 4,
  onChange: (val: string) => void
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineEndIdx = value.indexOf('\n', end);
  const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;

  const affectedText = value.slice(lineStart, lineEnd);
  const lines = affectedText.split('\n');

  const modifiedLines = lines.map((line) => {
    const spacePrefix = ' '.repeat(spaces);
    if (line.startsWith(spacePrefix)) {
      return line.slice(spaces);
    }
    return line.replace(/^ +/, '');
  });

  const replacement = modifiedLines.join('\n');
  const nextValue = value.slice(0, lineStart) + replacement + value.slice(lineEnd);
  onChange(nextValue);

  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(lineStart, lineStart + replacement.length);
  });
}

export function MarkdownToolbar({
  textareaRef,
  value,
  onChange,
  kind,
}: MarkdownToolbarProps) {
  const isPoem = kind === 'poem';
  const isQuote = kind === 'quote';

  const wrapSelection = (before: string, after: string, placeholder: string) => {
    if (!textareaRef.current) return;
    wrapSelectionInTextarea(textareaRef.current, value, before, after, placeholder, onChange);
  };

  const prefixLines = (prefix: string | ((line: string, index: number) => string)) => {
    if (!textareaRef.current) return;
    prefixLinesInTextarea(textareaRef.current, value, prefix, onChange);
  };

  const handleOutdent = (spaces = 4) => {
    if (!textareaRef.current) return;
    outdentLinesInTextarea(textareaRef.current, value, spaces, onChange);
  };

  const handleInsertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);

    const url = window.prompt('Enter target URL (e.g. https://...):', 'https://');
    if (!url) return;

    const linkText = selected.trim() || 'Link description';
    const replacement = `[${linkText}](${url.trim()})`;
    const nextValue = value.slice(0, start) + replacement + value.slice(end);
    onChange(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + replacement.length);
    });
  };

  const handleInsertDivider = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const replacement = '\n\n---\n\n';
    const nextValue = value.slice(0, start) + replacement + value.slice(start);
    onChange(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    });
  };

  return (
    <div
      role="toolbar"
      aria-label="Text Formatting Tools"
      className="flex flex-wrap items-center gap-1.5 p-2 bg-paper-deep border border-line border-b-0 text-ink select-none"
    >
      {/* Bold */}
      <button
        type="button"
        onClick={() => wrapSelection('**', '**', 'bold text')}
        title="Bold (Ctrl+B)"
        aria-label="Bold text"
        className="p-1.5 hover:bg-sage-soft text-ink rounded-xs focus-visible:outline-2 focus-visible:outline-moss cursor-pointer transition-colors"
      >
        <Bold className="w-4 h-4" aria-hidden="true" />
      </button>

      {/* Italic */}
      <button
        type="button"
        onClick={() => wrapSelection('*', '*', 'italic text')}
        title="Italic (Ctrl+I)"
        aria-label="Italic text"
        className="p-1.5 hover:bg-sage-soft text-ink rounded-xs focus-visible:outline-2 focus-visible:outline-moss cursor-pointer transition-colors"
      >
        <Italic className="w-4 h-4" aria-hidden="true" />
      </button>

      {!isQuote && (
        <>
          <span className="w-px h-4 bg-line mx-1" aria-hidden="true" />

          {/* Heading 2 */}
          {!isPoem && (
            <button
              type="button"
              onClick={() => prefixLines('## ')}
              title="Heading 2 (##)"
              aria-label="Heading 2"
              className="p-1.5 hover:bg-sage-soft text-ink rounded-xs focus-visible:outline-2 focus-visible:outline-moss cursor-pointer transition-colors"
            >
              <Heading2 className="w-4 h-4" aria-hidden="true" />
            </button>
          )}

          {/* Heading 3 */}
          {!isPoem && (
            <button
              type="button"
              onClick={() => prefixLines('### ')}
              title="Heading 3 (###)"
              aria-label="Heading 3"
              className="p-1.5 hover:bg-sage-soft text-ink rounded-xs focus-visible:outline-2 focus-visible:outline-moss cursor-pointer transition-colors"
            >
              <Heading3 className="w-4 h-4" aria-hidden="true" />
            </button>
          )}

          {/* Blockquote / Stanza callout */}
          <button
            type="button"
            onClick={() => prefixLines('> ')}
            title="Blockquote (>)"
            aria-label="Blockquote"
            className="p-1.5 hover:bg-sage-soft text-ink rounded-xs focus-visible:outline-2 focus-visible:outline-moss cursor-pointer transition-colors"
          >
            <Quote className="w-4 h-4" aria-hidden="true" />
          </button>

          {/* Lists for Prose */}
          {!isPoem && (
            <>
              <button
                type="button"
                onClick={() => prefixLines('- ')}
                title="Bulleted List (-)"
                aria-label="Bulleted list"
                className="p-1.5 hover:bg-sage-soft text-ink rounded-xs focus-visible:outline-2 focus-visible:outline-moss cursor-pointer transition-colors"
              >
                <List className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => prefixLines((_, idx) => `${idx + 1}. `)}
                title="Numbered List (1.)"
                aria-label="Numbered list"
                className="p-1.5 hover:bg-sage-soft text-ink rounded-xs focus-visible:outline-2 focus-visible:outline-moss cursor-pointer transition-colors"
              >
                <ListOrdered className="w-4 h-4" aria-hidden="true" />
              </button>
            </>
          )}

          {/* Poetry Indentation Controls */}
          {isPoem && (
            <>
              <button
                type="button"
                onClick={() => prefixLines('    ')}
                title="Indent Verse Line (+4 spaces)"
                aria-label="Indent verse line"
                className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-sage-soft text-ink rounded-xs focus-visible:outline-2 focus-visible:outline-moss cursor-pointer transition-colors"
              >
                <Indent className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Indent</span>
              </button>

              <button
                type="button"
                onClick={() => handleOutdent(4)}
                title="Outdent Verse Line (-4 spaces)"
                aria-label="Outdent verse line"
                className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-sage-soft text-ink rounded-xs focus-visible:outline-2 focus-visible:outline-moss cursor-pointer transition-colors"
              >
                <Outdent className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Outdent</span>
              </button>
            </>
          )}

          <span className="w-px h-4 bg-line mx-1" aria-hidden="true" />

          {/* Link */}
          <button
            type="button"
            onClick={handleInsertLink}
            title="Insert Link (Ctrl+K)"
            aria-label="Insert link"
            className="p-1.5 hover:bg-sage-soft text-ink rounded-xs focus-visible:outline-2 focus-visible:outline-moss cursor-pointer transition-colors"
          >
            <Link2 className="w-4 h-4" aria-hidden="true" />
          </button>

          {/* Divider */}
          {!isPoem && (
            <button
              type="button"
              onClick={handleInsertDivider}
              title="Scene Divider (---)"
              aria-label="Insert scene divider"
              className="p-1.5 hover:bg-sage-soft text-ink rounded-xs focus-visible:outline-2 focus-visible:outline-moss cursor-pointer transition-colors"
            >
              <Minus className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </>
      )}

      {/* Hint on right */}
      <span className="ml-auto text-[11px] text-muted font-sans hidden sm:inline">
        {isPoem ? 'Stanzas separated by blank lines' : 'Markdown formatting supported'}
      </span>
    </div>
  );
}
