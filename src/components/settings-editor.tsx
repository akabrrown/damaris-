'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateSiteSettingsAction } from '@/lib/actions/admin-actions';
import { createClient } from '@/lib/supabase/client';
import { SocialLink } from '@/lib/types';

interface SettingsEditorProps {
  initialSettings: {
    site_title: string;
    tagline: string | null;
    author_name: string;
    about_md: string;
    about_photo_path: string | null;
    about_photo_alt: string | null;
    contact_email: string | null;
    social_links: SocialLink[];
  };
}

export function SettingsEditor({ initialSettings }: SettingsEditorProps) {
  const router = useRouter();

  const [siteTitle, setSiteTitle] = useState(initialSettings.site_title);
  const [tagline, setTagline] = useState(initialSettings.tagline || '');
  const [authorName, setAuthorName] = useState(initialSettings.author_name);
  const [aboutMd, setAboutMd] = useState(initialSettings.about_md);
  const [photoPath, setPhotoPath] = useState(initialSettings.about_photo_path || '');
  const [photoAlt, setPhotoAlt] = useState(initialSettings.about_photo_alt || '');
  const [contactEmail, setContactEmail] = useState(initialSettings.contact_email || '');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(initialSettings.social_links || []);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 2 MB limit.');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMessage('Only JPEG, PNG, or WebP images are permitted.');
      return;
    }

    setUploadingPhoto(true);
    setErrorMessage('');

    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || 'webp';
      const path = `about/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

      const { data, error } = await supabase.storage.from('media').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(data.path);
      setPhotoPath(publicUrlData.publicUrl);
    } catch (err: unknown) {
      setErrorMessage(`Upload failed: ${(err as Error).message}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddSocialLink = () => {
    setSocialLinks([...socialLinks, { label: '', url: 'https://' }]);
  };

  const handleRemoveSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const handleSocialLinkChange = (index: number, field: 'label' | 'url', value: string) => {
    const updated = [...socialLinks];
    updated[index][field] = value;
    setSocialLinks(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (photoPath && !photoAlt.trim()) {
      setErrorMessage('Photo alt text is required whenever an author photo is uploaded.');
      return;
    }

    startTransition(async () => {
      try {
        await updateSiteSettingsAction({
          site_title: siteTitle,
          tagline: tagline || null,
          author_name: authorName,
          about_md: aboutMd,
          about_photo_path: photoPath || null,
          about_photo_alt: photoAlt || null,
          contact_email: contactEmail || null,
          social_links: socialLinks.filter((l) => l.label && l.url),
        });

        setSuccessMessage('Settings and About page updated successfully.');
        router.refresh();
      } catch (err: unknown) {
        setErrorMessage((err as Error).message);
      }
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-3xl pb-16">
      {errorMessage && (
        <div role="alert" className="p-4 bg-paper-deep border border-alert text-alert text-sm">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div role="status" className="p-4 bg-sage-soft border border-line text-ink text-sm">
          {successMessage}
        </div>
      )}

      <div className="bg-paper p-6 sm:p-8 border border-line space-y-6">
        <h2 className="font-serif text-2xl text-ink font-normal border-b border-line pb-3">
          Site Identity &amp; Author
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="settings-author" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1">
              Author Name *
            </label>
            <input
              type="text"
              id="settings-author"
              required
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-3 py-2 bg-paper border border-ink text-ink text-base rounded-none"
            />
          </div>

          <div>
            <label htmlFor="settings-title" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1">
              Site Title *
            </label>
            <input
              type="text"
              id="settings-title"
              required
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              className="w-full px-3 py-2 bg-paper border border-ink text-ink text-base rounded-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="settings-tagline" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1">
            Site Tagline / Subtitle
          </label>
          <input
            type="text"
            id="settings-tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="w-full px-3 py-2 bg-paper border border-ink text-ink text-base rounded-none"
          />
        </div>

        <div>
          <label htmlFor="settings-email" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1">
            Public Contact Email
          </label>
          <input
            type="email"
            id="settings-email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full px-3 py-2 bg-paper border border-ink text-ink text-base rounded-none"
            placeholder="author@example.com"
          />
        </div>
      </div>

      {/* Author Photo & Bio */}
      <div className="bg-paper p-6 sm:p-8 border border-line space-y-6">
        <h2 className="font-serif text-2xl text-ink font-normal border-b border-line pb-3">
          About Biography &amp; Photo
        </h2>

        {/* Photo Upload */}
        <div className="p-4 bg-paper-deep border border-line space-y-4">
          <span className="text-xs uppercase tracking-wider text-muted font-semibold block">
            Author Portrait (Max 2 MB &middot; JPEG, PNG, or WebP)
          </span>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoUpload}
            disabled={uploadingPhoto}
            className="text-sm file:mr-4 file:py-2 file:px-4 file:border file:border-ink file:bg-sage file:text-xs file:font-semibold"
          />
          {uploadingPhoto && <p className="text-xs text-muted">Uploading photo…</p>}

          {photoPath && (
            <div className="space-y-3">
              <p className="text-xs text-muted">Current Photo: {photoPath}</p>
              <div>
                <label htmlFor="photo-alt" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1">
                  Photo Alt Text * (Required for accessibility)
                </label>
                <input
                  type="text"
                  id="photo-alt"
                  required
                  value={photoAlt}
                  onChange={(e) => setPhotoAlt(e.target.value)}
                  placeholder="e.g. Portrait photograph of Caroline Damaris Donkor"
                  className="w-full px-3 py-2 bg-paper border border-ink text-ink text-sm rounded-none"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="about-bio" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1">
            Author Biography (Markdown)
          </label>
          <textarea
            id="about-bio"
            rows={10}
            value={aboutMd}
            onChange={(e) => setAboutMd(e.target.value)}
            placeholder="Write your biography, literary background, and notes..."
            className="w-full p-3 bg-paper border border-ink text-ink text-base rounded-none font-sans"
          />
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-paper p-6 sm:p-8 border border-line space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="font-serif text-2xl text-ink font-normal">
            Social &amp; External Links
          </h2>
          <button
            type="button"
            onClick={handleAddSocialLink}
            className="px-3 py-1 bg-sage/60 hover:bg-sage border border-ink text-xs font-medium cursor-pointer"
          >
            + Add Link
          </button>
        </div>

        {socialLinks.map((link, idx) => (
          <div key={idx} className="flex items-center space-x-3">
            <input
              type="text"
              aria-label={`Social link label ${idx + 1}`}
              placeholder="Label (e.g. Twitter, Instagram, Substack)"
              value={link.label}
              onChange={(e) => handleSocialLinkChange(idx, 'label', e.target.value)}
              className="w-1/3 px-3 py-2 bg-paper border border-ink text-sm"
            />
            <input
              type="url"
              aria-label={`Social link URL ${idx + 1}`}
              placeholder="https://..."
              value={link.url}
              onChange={(e) => handleSocialLinkChange(idx, 'url', e.target.value)}
              className="flex-1 px-3 py-2 bg-paper border border-ink text-sm"
            />
            <button
              type="button"
              onClick={() => handleRemoveSocialLink(idx)}
              aria-label={`Remove social link ${link.label || idx + 1}`}
              className="text-xs text-alert hover:underline px-2 cursor-pointer min-h-[32px]"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-8 py-3 bg-sage hover:bg-sage/80 border border-ink text-ink font-semibold text-base transition-colors cursor-pointer"
      >
        {isPending ? 'Saving Settings…' : 'Save All Settings'}
      </button>
    </form>
  );
}
