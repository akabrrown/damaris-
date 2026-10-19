import { z } from 'zod';

export const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  website: z.string().max(0).optional(), // honeypot: must stay empty
});
export type SubscribeInput = z.infer<typeof subscribeSchema>;

export const confirmSchema = z.object({
  token: z.string().min(1),
});
export type ConfirmInput = z.infer<typeof confirmSchema>;

export const subscriberStatusSchema = z.enum(['pending', 'confirmed', 'active', 'unsubscribed', 'bounced', 'complained', 'cleaned']);
export type SubscriberStatus = z.infer<typeof subscriberStatusSchema>;

export const postKindSchema = z.enum(['poem', 'story', 'reflection', 'quote']);
export type PostKind = z.infer<typeof postKindSchema>;

export const publishStatusSchema = z.enum(['draft', 'published']);
export type PublishStatus = z.infer<typeof publishStatusSchema>;

export const postInputSchema = z
  .object({
    kind: postKindSchema,
    slug: z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug must consist of lowercase alphanumeric words separated by single hyphens')
      .max(80)
      .optional(),
    title: z.string().trim().min(1).max(160).nullable().optional(),
    body_md: z.string().min(1).max(200000),
    excerpt: z.string().max(300).nullable().optional(),
    attribution: z.string().max(120).nullable().optional(),
    status: publishStatusSchema.default('draft'),
    notify: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.kind !== 'quote' && (!data.title || data.title.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['title'],
        message: 'Title is required for poems, stories, and reflections.',
      });
    }

    if (data.kind === 'quote') {
      if (data.body_md.length > 600) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['body_md'],
          message: 'Quotes must be at most 600 characters.',
        });
      }
    } else {
      if (data.attribution) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['attribution'],
          message: 'Attribution is only permitted on quotes.',
        });
      }
    }
  });

export type PostInput = z.infer<typeof postInputSchema>;

export const bookProgressSchema = z.enum(['upcoming', 'in_progress', 'available']);
export type BookProgress = z.infer<typeof bookProgressSchema>;

export const bookInputSchema = z
  .object({
    slug: z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug must consist of lowercase alphanumeric words separated by single hyphens')
      .max(80)
      .optional(),
    title: z.string().trim().min(1).max(160),
    subtitle: z.string().max(200).nullable().optional(),
    synopsis_md: z.string().min(1).max(20000),
    excerpt_md: z.string().max(50000).nullable().optional(),
    cover_path: z.string().nullable().optional(),
    cover_alt: z.string().nullable().optional(),
    progress: bookProgressSchema.default('upcoming'),
    purchase_url: z.string().url().regex(/^https:\/\//, 'Purchase URL must be HTTPS').nullable().optional(),
    release_date: z.string().nullable().optional(),
    sort_order: z.number().int().default(0),
    status: publishStatusSchema.default('draft'),
    notify: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.cover_path && (!data.cover_alt || data.cover_alt.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cover_alt'],
        message: 'Cover alt text is required whenever a cover image is provided.',
      });
    }
  });

export type BookInput = z.infer<typeof bookInputSchema>;

export const socialLinkSchema = z.object({
  label: z.string().min(1).max(50),
  url: z.string().url().regex(/^https:\/\//, 'Social link must be HTTPS'),
});

export const siteSettingsSchema = z
  .object({
    site_title: z.string().trim().min(1).max(120),
    tagline: z.string().max(200).nullable().optional(),
    author_name: z.string().trim().min(1).max(120),
    about_md: z.string().max(20000).default(''),
    about_photo_path: z.string().nullable().optional(),
    about_photo_alt: z.string().nullable().optional(),
    contact_email: z.string().email().max(254).nullable().optional(),
    social_links: z.array(socialLinkSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.about_photo_path && (!data.about_photo_alt || data.about_photo_alt.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['about_photo_alt'],
        message: 'Alt text is required whenever an About photo is provided.',
      });
    }
  });

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
