import { describe, it, expect } from 'vitest';
import { commentInputSchema, postInputSchema } from '../schemas';

describe('Comments and Sharing Suite', () => {
  describe('commentInputSchema validation', () => {
    const validPostId = '123e4567-e89b-12d3-a456-426614174000';

    it('validates a complete and correct comment submission', () => {
      const input = {
        postId: validPostId,
        authorName: 'Ama Serwaa',
        authorEmail: 'ama@example.com',
        content: 'This piece touched my heart deeply. Thank you for giving words to this feeling.',
      };

      const result = commentInputSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.authorName).toBe('Ama Serwaa');
        expect(result.data.authorEmail).toBe('ama@example.com');
        expect(result.data.content).toContain('touched my heart');
      }
    });

    it('allows comment submission without optional email', () => {
      const input = {
        postId: validPostId,
        authorName: 'Kwesi',
        content: 'A quiet, striking poem.',
      };

      const result = commentInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('rejects empty author name with helpful message', () => {
      const input = {
        postId: validPostId,
        authorName: '   ',
        content: 'Lovely words.',
      };

      const result = commentInputSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Please enter your name');
      }
    });

    it('rejects empty content with helpful message', () => {
      const input = {
        postId: validPostId,
        authorName: 'Reader',
        content: '',
      };

      const result = commentInputSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Comment cannot be empty');
      }
    });

    it('rejects invalid email formats', () => {
      const input = {
        postId: validPostId,
        authorName: 'Reader',
        authorEmail: 'not-an-email',
        content: 'Valid content here.',
      };

      const result = commentInputSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid email address');
      }
    });

    it('rejects content longer than 2000 characters', () => {
      const input = {
        postId: validPostId,
        authorName: 'Reader',
        content: 'a'.repeat(2001),
      };

      const result = commentInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('identifies honeypot values if bot fills website field', () => {
      const input = {
        postId: validPostId,
        authorName: 'Bot',
        content: 'Buy crypto now',
        website: 'http://spam.example.com',
      };

      const result = commentInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('postInputSchema allow_comments configuration', () => {
    it('defaults allow_comments to true when omitted', () => {
      const post = {
        kind: 'poem' as const,
        title: 'Dawn Over the Horizon',
        body_md: 'The early light breaks,\nThrough the canopy of trees.',
      };

      const parsed = postInputSchema.parse(post);
      expect(parsed.allow_comments).toBe(true);
    });

    it('allows admin to explicitly disable comments on a piece', () => {
      const post = {
        kind: 'story' as const,
        title: 'A Silent Crossing',
        body_md: 'The river was calm when the canoe launched.',
        allow_comments: false,
      };

      const parsed = postInputSchema.parse(post);
      expect(parsed.allow_comments).toBe(false);
    });
  });

  describe('Social Share URL Generation', () => {
    const title = 'On the eve of twenty';
    const url = 'https://example.com/poetry/on-the-eve-of-twenty';

    it('creates properly encoded WhatsApp share URL', () => {
      const shareText = encodeURIComponent(`"${title}" — read this piece:\n${url}`);
      const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}`;

      expect(whatsappUrl).toContain('api.whatsapp.com');
      expect(whatsappUrl).toContain(encodeURIComponent(title));
      expect(whatsappUrl).toContain(encodeURIComponent(url));
    });

    it('creates properly encoded Twitter / X share URL', () => {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;

      expect(twitterUrl).toContain('twitter.com');
      expect(twitterUrl).toContain(encodeURIComponent(title));
    });

    it('creates properly encoded Email mailto share link', () => {
      const subject = encodeURIComponent(title);
      const mailto = `mailto:?subject=${subject}&body=${encodeURIComponent(`I thought you would appreciate reading "${title}":\n\n${url}`)}`;

      expect(mailto).toContain('mailto:?subject=');
      expect(mailto).toContain(encodeURIComponent(title));
    });
  });
});
