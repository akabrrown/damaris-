-- 001: Extensions and Types
create extension if not exists citext;

create type post_kind as enum ('poem', 'story', 'reflection', 'quote');
create type publish_status as enum ('draft', 'published');
create type book_progress as enum ('upcoming', 'in_progress', 'available');
create type subscriber_status as enum ('pending', 'confirmed', 'unsubscribed', 'bounced', 'complained');
create type delivery_status as enum ('queued', 'sent', 'failed');
