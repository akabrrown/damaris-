import { PostKind, PublishStatus, BookProgress, SubscriberStatus } from './schemas';

export interface Post {
  id: string;
  kind: PostKind;
  slug: string;
  title: string | null;
  body_md: string;
  excerpt: string | null;
  attribution: string | null;
  status: PublishStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  synopsis_md: string;
  excerpt_md: string | null;
  cover_path: string | null;
  cover_alt: string | null;
  progress: BookProgress;
  purchase_url: string | null;
  release_date: string | null;
  sort_order: number;
  status: PublishStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface SiteSettings {
  id: number;
  site_title: string;
  tagline: string | null;
  author_name: string;
  about_md: string;
  about_photo_path: string | null;
  about_photo_alt: string | null;
  contact_email: string | null;
  social_links: SocialLink[];
  updated_at: string;
}

export interface Subscriber {
  id: string;
  email: string;
  status: SubscriberStatus;
  consented_at: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  source: 'web' | 'admin_import';
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  post_id: string | null;
  book_id: string | null;
  status: 'pending' | 'processing' | 'done' | 'failed';
  created_at: string;
  completed_at: string | null;
  post?: Post;
  book?: Book;
}

export interface NotificationDelivery {
  id: string;
  notification_id: string;
  subscriber_id: string;
  status: 'queued' | 'sent' | 'failed';
  provider_message_id: string | null;
  attempts: number;
  last_error: string | null;
  sent_at: string | null;
  created_at: string;
}
