import { describe, it, expect } from 'vitest';
import { buildConfirmationEmail, buildNotificationEmail } from '../email-templates';

describe('Email Templates (Section 10 Design Brief)', () => {
  it('builds confirmation email with paper background, ink text, and confirm link', () => {
    const email = buildConfirmationEmail({
      confirmUrl: 'https://example.com/subscribe/confirm?token=testtoken',
      authorName: 'Test Author',
      siteTitle: "Writer's Home",
    });

    expect(email.subject).toContain("Confirm your subscription");
    expect(email.html).toContain('https://example.com/subscribe/confirm?token=testtoken');
    expect(email.html).toContain('#FAF8F2'); // Paper
    expect(email.html).toContain('#232720'); // Ink
    expect(email.text).toContain('https://example.com/subscribe/confirm?token=testtoken');
  });

  it('builds notification email with full text for poems and unsubscribe link', () => {
    const email = buildNotificationEmail({
      pieceTitle: 'First Morning Rain',
      kind: 'poem',
      fullText: 'The sky opened slowly\nwithout sound.',
      pieceUrl: 'https://example.com/poetry/first-morning-rain',
      unsubscribeUrl: 'https://example.com/subscribe/unsubscribe?t=sub.hmac',
      authorName: 'Test Author',
      siteTitle: "Writer's Home",
    });

    expect(email.subject).toBe('First Morning Rain — Test Author');
    expect(email.html).toContain('First Morning Rain');
    expect(email.html).toContain('The sky opened slowly');
    expect(email.html).toContain('https://example.com/poetry/first-morning-rain');
    expect(email.html).toContain('https://example.com/subscribe/unsubscribe?t=sub.hmac');
    expect(email.text).toContain('The sky opened slowly');
    expect(email.text).toContain('https://example.com/subscribe/unsubscribe?t=sub.hmac');
  });

  it('builds notification email with preview for stories and books', () => {
    const email = buildNotificationEmail({
      pieceTitle: 'A Distant Harbor',
      kind: 'story',
      previewText: 'We arrived at dawn when the fog still hovered...',
      pieceUrl: 'https://example.com/stories/a-distant-harbor',
      unsubscribeUrl: 'https://example.com/subscribe/unsubscribe?t=sub.hmac',
      authorName: 'Test Author',
      siteTitle: "Writer's Home",
    });

    expect(email.subject).toBe('A Distant Harbor — Test Author');
    expect(email.html).toContain('We arrived at dawn');
    expect(email.html).toContain('Continue reading');
    expect(email.html).toContain('Dear reader');
    expect(email.html).toContain('Until words find us again');
  });

  it('builds confirmation email with author signoff', () => {
    const email = buildConfirmationEmail({
      confirmUrl: 'https://example.com/subscribe/confirm?token=testtoken',
      authorName: 'Caroline Damaris Donkor',
      siteTitle: 'Carolinedamaris',
    });

    expect(email.html).toContain('Dear reader');
    expect(email.html).toContain('Until words find us again');
    expect(email.html).toContain('Caroline D.D');
  });
});
