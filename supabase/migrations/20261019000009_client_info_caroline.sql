-- 009: Apply Caroline Damaris Donkor client info to site_settings singleton
update site_settings
set
  site_title = 'Carolinedamaris',
  tagline = 'I give the unsaid a language of its own',
  author_name = 'Caroline Damaris Donkor',
  about_md = 'Caroline Damaris Donkor is a Ghanaian writer whose work explores identity, womanhood, grief, becoming, love, and the quiet weight of everyday life. Through her writing, she gives language to the emotions and experiences often left unspoken, inviting readers to pause, reflect, and find meaning in what is deeply felt.',
  contact_email = 'carolinedamaris22@gmail.com'
where id = 1;
