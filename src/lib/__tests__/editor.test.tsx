import { describe, it, expect } from 'vitest';
import {
  wrapSelectionInTextarea,
  prefixLinesInTextarea,
  outdentLinesInTextarea,
  alignSelectionInTextarea,
} from '@/components/markdown-toolbar';
import { renderVerse, renderVerseLineHtml, sanitizeMarkdown } from '@/lib/content-renderer';
import { generateExcerpt } from '@/lib/excerpt';

describe('Editor Formatting Tools & Public Parity Pipeline', () => {
  it('wraps selected text with bold markdown markers', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'She walked into the quiet night';
    textarea.selectionStart = 11;
    textarea.selectionEnd = 15; // "into"

    let updatedValue = '';
    wrapSelectionInTextarea(textarea, textarea.value, '**', '**', 'bold text', (val) => {
      updatedValue = val;
    });

    expect(updatedValue).toBe('She walked **into** the quiet night');
  });

  it('inserts placeholder when no text is selected', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'Quiet moments: ';
    textarea.selectionStart = 15;
    textarea.selectionEnd = 15;

    let updatedValue = '';
    wrapSelectionInTextarea(textarea, textarea.value, '*', '*', 'italic text', (val) => {
      updatedValue = val;
    });

    expect(updatedValue).toBe('Quiet moments: *italic text*');
  });

  it('prefixes line with heading markdown', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'First Chapter\nSome text';
    textarea.selectionStart = 4;
    textarea.selectionEnd = 4;

    let updatedValue = '';
    prefixLinesInTextarea(textarea, textarea.value, '## ', (val) => {
      updatedValue = val;
    });

    expect(updatedValue).toBe('## First Chapter\nSome text');
  });

  it('indents verse line by 4 spaces and outdents correctly', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'Verse line 1\nVerse line 2';
    // Cursor on second line
    textarea.selectionStart = 15;
    textarea.selectionEnd = 15;

    let indentedValue = '';
    prefixLinesInTextarea(textarea, textarea.value, '    ', (val) => {
      indentedValue = val;
    });
    expect(indentedValue).toBe('Verse line 1\n    Verse line 2');

    // Outdent
    textarea.value = indentedValue;
    textarea.selectionStart = 18;
    textarea.selectionEnd = 18;
    let outdentedValue = '';
    outdentLinesInTextarea(textarea, textarea.value, 4, (val) => {
      outdentedValue = val;
    });
    expect(outdentedValue).toBe('Verse line 1\nVerse line 2');
  });

  it('guarantees formatted poem lines render identically in public and editor preview', () => {
    const rawPoetry = 'Line one\n    *italics* and **bold** with [a link](https://example.com)';
    const stanzas = renderVerse(rawPoetry);
    expect(stanzas).toHaveLength(1);
    expect(stanzas[0]).toHaveLength(2);

    const line2Html = renderVerseLineHtml(stanzas[0][1]);
    expect(line2Html).toContain('&nbsp;&nbsp;&nbsp;&nbsp;');
    expect(line2Html).toContain('<em>italics</em>');
    expect(line2Html).toContain('<strong>bold</strong>');
    expect(line2Html).toContain('href="https://example.com"');
    expect(line2Html).toContain('rel="noopener noreferrer"');
  });

  it('guarantees markdown lists and headers render clean sanitized html for stories and reflections', () => {
    const rawMarkdown = '## Chapter Title\n\n- Point one\n- Point two\n\n> A soft whisper';
    const html = sanitizeMarkdown(rawMarkdown);
    expect(html).toContain('<h2>Chapter Title</h2>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>Point one</li>');
    expect(html).toContain('<li>Point two</li>');
    expect(html).toContain('<blockquote>');
  });

  it('autogenerates clean verse excerpts from raw poem markdown', () => {
    const poem = '# Title\n\nI stepped into the quiet dawn,\nBefore the stars were completely gone;\n\nA second stanza follows here.';
    const excerpt = generateExcerpt(poem, 'poem');
    expect(excerpt).toBe('I stepped into the quiet dawn,\nBefore the stars were completely gone;');
  });

  it('autogenerates clean prose excerpts from story markdown without headers or markdown markers', () => {
    const story = '### Prologue\n\nIt was a **cold** and misty morning on the hill. The village bells were ringing in the distance.';
    const excerpt = generateExcerpt(story, 'story');
    expect(excerpt).toBe('It was a cold and misty morning on the hill. The village bells were ringing in the distance.');
  });

  it('aligns text to center, right, and justify with clean html div wrappers', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'Center this stanza';
    textarea.selectionStart = 0;
    textarea.selectionEnd = 18;

    let centeredValue = '';
    alignSelectionInTextarea(textarea, textarea.value, 'center', (val) => {
      centeredValue = val;
    });

    expect(centeredValue).toBe('<div align="center">\n\nCenter this stanza\n\n</div>');

    const html = sanitizeMarkdown(centeredValue);
    expect(html).toContain('align="center"');
  });

  it('removes alignment wrapper when align left is chosen', () => {
    const textarea = document.createElement('textarea');
    textarea.value = '<div align="center">\n\nAlready centered text\n\n</div>';
    textarea.selectionStart = 0;
    textarea.selectionEnd = textarea.value.length;

    let leftValue = '';
    alignSelectionInTextarea(textarea, textarea.value, 'left', (val) => {
      leftValue = val;
    });

    expect(leftValue).toBe('Already centered text');
  });
});
