-- 008: Seed site_settings singleton row

insert into site_settings (
  id,
  site_title,
  tagline,
  author_name,
  about_md,
  contact_email,
  social_links
) values (
  1,
  'Carolinedamaris',
  'I give the unsaid a language of its own',
  'Caroline Damaris Donkor',
  'Caroline Damaris Donkor is a Ghanaian writer whose work explores identity, womanhood, grief, becoming, love, and the quiet weight of everyday life. Through her writing, she gives language to the emotions and experiences often left unspoken, inviting readers to pause, reflect, and find meaning in what is deeply felt.',
  'carolinedamaris22@gmail.com',
  '[]'::jsonb
) on conflict (id) do update set
  site_title = excluded.site_title,
  tagline = excluded.tagline,
  author_name = excluded.author_name,
  about_md = excluded.about_md,
  contact_email = excluded.contact_email;

