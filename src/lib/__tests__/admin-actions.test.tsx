import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/admin',
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/actions/admin-actions', () => ({
  deletePostAction: vi.fn().mockResolvedValue({ success: true }),
  publishPostAction: vi.fn().mockResolvedValue({ success: true }),
  unpublishPostAction: vi.fn().mockResolvedValue({ success: true }),
  deleteBookAction: vi.fn().mockResolvedValue({ success: true }),
  publishBookAction: vi.fn().mockResolvedValue({ success: true }),
  unpublishBookAction: vi.fn().mockResolvedValue({ success: true }),
  removeSubscriberAction: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/actions/notification-actions', () => ({
  retryFailedDeliveriesAction: vi.fn().mockResolvedValue({ success: true }),
  sendNotificationNowAction: vi.fn().mockResolvedValue({ success: true }),
}));

import { AdminPostRowActions } from '@/components/admin-post-row-actions';
import { AdminBookRowActions } from '@/components/admin-book-row-actions';
import { DeleteSubscriberButton } from '@/components/delete-subscriber-button';
import { NotificationActionButtons } from '@/components/notification-action-buttons';

describe('Admin CRUD Actions & Row Buttons', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  describe('AdminPostRowActions', () => {
    it('renders Edit, Publish, and Delete buttons for draft post', async () => {
      await act(async () => {
        root.render(
          <AdminPostRowActions
            id="p-1"
            kind="poem"
            slug="whispers-of-dawn"
            title="Whispers of Dawn"
            status="draft"
          />
        );
      });

      const editLink = container.querySelector('a[href="/admin/posts/p-1"]');
      expect(editLink).not.toBeNull();
      expect(editLink?.textContent).toContain('Edit');

      const publishBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Publish')
      );
      expect(publishBtn).toBeDefined();

      const deleteBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Delete')
      );
      expect(deleteBtn).toBeDefined();

      // No public view link for drafts
      const viewLink = container.querySelector('a[href="/poem/whispers-of-dawn"]');
      expect(viewLink).toBeNull();
    });

    it('renders View link and Unpublish button for published post', async () => {
      await act(async () => {
        root.render(
          <AdminPostRowActions
            id="p-2"
            kind="story"
            slug="the-old-lantern"
            title="The Old Lantern"
            status="published"
          />
        );
      });

      const viewLink = container.querySelector('a[href="/stories/the-old-lantern"]');
      expect(viewLink).not.toBeNull();
      expect(viewLink?.textContent).toContain('View');

      const unpublishBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Unpublish')
      );
      expect(unpublishBtn).toBeDefined();
    });
  });

  describe('AdminBookRowActions', () => {
    it('renders Edit, Publish, and Delete buttons for draft book', async () => {
      await act(async () => {
        root.render(
          <AdminBookRowActions
            id="b-1"
            slug="quiet-river"
            title="The Quiet River"
            status="draft"
          />
        );
      });

      const editLink = container.querySelector('a[href="/admin/books/b-1"]');
      expect(editLink).not.toBeNull();
      expect(editLink?.textContent).toContain('Edit');

      const publishBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Publish')
      );
      expect(publishBtn).toBeDefined();

      const deleteBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Delete')
      );
      expect(deleteBtn).toBeDefined();
    });

    it('renders View link and Unpublish button for published book', async () => {
      await act(async () => {
        root.render(
          <AdminBookRowActions
            id="b-2"
            slug="morning-light"
            title="Morning Light"
            status="published"
          />
        );
      });

      const viewLink = container.querySelector('a[href="/books/morning-light"]');
      expect(viewLink).not.toBeNull();
      expect(viewLink?.textContent).toContain('View');

      const unpublishBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Unpublish')
      );
      expect(unpublishBtn).toBeDefined();
    });
  });

  describe('DeleteSubscriberButton', () => {
    it('renders Delete button with accessible label', async () => {
      await act(async () => {
        root.render(<DeleteSubscriberButton id="sub-123" email="reader@example.com" />);
      });

      const btn = container.querySelector('button');
      expect(btn).not.toBeNull();
      expect(btn?.textContent).toBe('Delete');
      expect(btn?.getAttribute('aria-label')).toBe('Permanently delete subscriber reader@example.com');
    });
  });

  describe('NotificationActionButtons', () => {
    it('renders Retry button when failed deliveries exist', async () => {
      await act(async () => {
        root.render(<NotificationActionButtons id="notif-1" status="processing" failedCount={3} />);
      });

      const retryBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Retry 3 Failed Deliveries')
      );
      expect(retryBtn).toBeDefined();
    });

    it('renders Send Now button when notification status is pending', async () => {
      await act(async () => {
        root.render(<NotificationActionButtons id="notif-2" status="pending" failedCount={0} />);
      });

      const sendBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Send Now')
      );
      expect(sendBtn).toBeDefined();
    });
  });
});
