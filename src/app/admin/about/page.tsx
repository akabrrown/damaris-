import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SettingsEditor } from '@/components/settings-editor';
import { SiteSettings } from '@/lib/types';

export default async function AdminAboutSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) redirect('/admin/login');

  const { data: settings } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .single();

  const defaultSettings: SiteSettings = settings || {
    id: 1,
    site_title: 'Carolinedamaris',
    tagline: 'I give the unsaid a language of its own',
    author_name: 'Caroline Damaris Donkor',
    about_md: 'Caroline Damaris Donkor is a Ghanaian writer whose work explores identity, womanhood, grief, becoming, love, and the quiet weight of everyday life. Through her writing, she gives language to the emotions and experiences often left unspoken, inviting readers to pause, reflect, and find meaning in what is deeply felt.',
    about_photo_path: null,
    about_photo_alt: null,
    contact_email: 'carolinedamaris22@gmail.com',
    social_links: [],
    updated_at: new Date().toISOString(),
  };

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink font-normal tracking-tight mb-6">
        About &amp; Site Settings
      </h1>
      <SettingsEditor initialSettings={defaultSettings} />
    </div>
  );
}
