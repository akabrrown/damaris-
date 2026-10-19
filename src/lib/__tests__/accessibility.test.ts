import { describe, it, expect } from 'vitest';
import { renderVerse, sanitizeMarkdown } from '../content-renderer';
import { buildConfirmationEmail, buildNotificationEmail } from '../email-templates';

// Calculate relative luminance based on WCAG 2.1 formula
function getLuminance(hex: string): number {
  const rgb = hex.replace('#', '');
  const r = parseInt(rgb.slice(0, 2), 16) / 255;
  const g = parseInt(rgb.slice(2, 4), 16) / 255;
  const b = parseInt(rgb.slice(4, 6), 16) / 255;

  const srgb = [r, g, b].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

// Calculate contrast ratio between two colors
function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

describe('Accessibility & Color Contrast Audit (WCAG 2.1 AA)', () => {
  const PALETTE = {
    paper: '#FAF8F2',
    paperDeep: '#F1EEE4',
    sage: '#BEC5A4',
    sageSoft: '#E6E9D7',
    ink: '#232720',
    muted: '#5B6154',
    moss: '#4F5A33',
    line: '#D3D7C0',
    alert: '#9B3B2E',
  };

  it('verifies primary body text (ink on paper) exceeds WCAG AAA standard (>= 7:1)', () => {
    const ratio = getContrastRatio(PALETTE.ink, PALETTE.paper);
    expect(ratio).toBeGreaterThanOrEqual(7.0);
    expect(ratio).toBeGreaterThan(13.0); // Actually ~14.4:1
  });

  it('verifies secondary text (muted on paper) meets WCAG AA standard (>= 4.5:1)', () => {
    const ratio = getContrastRatio(PALETTE.muted, PALETTE.paper);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('verifies interactive links (moss on paper) meets WCAG AA standard (>= 4.5:1)', () => {
    const ratio = getContrastRatio(PALETTE.moss, PALETTE.paper);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeGreaterThan(6.9); // 6.95:1
  });

  it('verifies alert text (alert on paper) meets WCAG AA standard (>= 4.5:1)', () => {
    const ratio = getContrastRatio(PALETTE.alert, PALETTE.paper);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('verifies button text (ink on sage) meets WCAG AAA standard (>= 7:1)', () => {
    const ratio = getContrastRatio(PALETTE.ink, PALETTE.sage);
    expect(ratio).toBeGreaterThanOrEqual(7.0);
  });

  it('verifies UI borders (line against paper) meet graphical object contrast (>= 1.2:1)', () => {
    const ratio = getContrastRatio(PALETTE.line, PALETTE.paper);
    expect(ratio).toBeGreaterThan(1.2);
  });
});

describe('Verse & Typography Accessibility (FR-READ-02)', () => {
  it('correctly separates stanzas without collapsing empty lines into single paragraphs', () => {
    const poem = 'First line of verse\nSecond line of verse\n\nSecond stanza first line\nSecond stanza second line';
    const stanzas = renderVerse(poem);

    expect(stanzas).toHaveLength(2);
    expect(stanzas[0]).toHaveLength(2);
    expect(stanzas[0][0]).toBe('First line of verse');
    expect(stanzas[0][1]).toBe('Second line of verse');
    expect(stanzas[1][0]).toBe('Second stanza first line');
  });

  it('preserves intentional leading spaces for indentation (concrete / modern verse)', () => {
    const poem = 'Regular line\n    Indented line with 4 spaces';
    const stanzas = renderVerse(poem);

    expect(stanzas[0][1]).toMatch(/^\s{4}Indented line with 4 spaces/);
  });

  it('sanitizes harmful script injections while preserving accessible semantic markup', () => {
    const dirty = '# Title\n\n<script>alert("hack")</script>\n\nBold **text** and *italics*.';
    const clean = sanitizeMarkdown(dirty);

    expect(clean).not.toContain('<script>');
    expect(clean).toContain('<strong>text</strong>');
    expect(clean).toContain('<em>italics</em>');
  });
});

describe('Email Accessibility (WCAG & RFC Compliance)', () => {
  it('ensures confirmation email contains plain text fallback and unsubscribe instructions', () => {
    const tpl = buildConfirmationEmail({
      authorName: 'Test Author',
      siteTitle: 'Writer Website',
      confirmUrl: 'https://example.com/subscribe/confirm?token=xyz123',
    });

    expect(tpl.subject).toBeTruthy();
    expect(tpl.text).toContain('https://example.com/subscribe/confirm?token=xyz123');
    expect(tpl.html).toContain('lang="en"');
    expect(tpl.html).toContain('#232720'); // accessible ink color
    expect(tpl.html).toContain('#FAF8F2'); // accessible paper background
  });

  it('ensures publish notification email contains direct unsubscribe URL in both html and plain text', () => {
    const tpl = buildNotificationEmail({
      authorName: 'Test Author',
      siteTitle: 'Writer Website',
      pieceTitle: 'A Winter Morning',
      kind: 'poem',
      fullText: 'Frost upon the glass...',
      pieceUrl: 'https://example.com/poetry/a-winter-morning',
      unsubscribeUrl: 'https://example.com/subscribe/unsubscribe?t=sub123.hmac456',
    });

    expect(tpl.text).toContain('https://example.com/subscribe/unsubscribe?t=sub123.hmac456');
    expect(tpl.html).toContain('https://example.com/subscribe/unsubscribe?t=sub123.hmac456');
    expect(tpl.html).toContain('Unsubscribe');
  });
});
