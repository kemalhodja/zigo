-- Genel ilgi / yaşam tarzı Match-Feed kategorileri (haber, spor, kültür vb.)
insert into public.education_areas (area_name, age_group)
values
  ('Genel Kültür', 'Genel İlgi'),
  ('Sağlık', 'Genel İlgi'),
  ('Dini Bilgiler', 'Genel İlgi'),
  ('Haber ve Gündem', 'Genel İlgi'),
  ('Spor', 'Genel İlgi'),
  ('Futbol', 'Genel İlgi'),
  ('Basketbol', 'Genel İlgi'),
  ('Voleybol', 'Genel İlgi'),
  ('Bilim ve Teknoloji', 'Genel İlgi'),
  ('Sanat ve Müzik', 'Genel İlgi'),
  ('Doğa ve Çevre', 'Genel İlgi'),
  ('Psikoloji ve İyi Yaşam', 'Genel İlgi')
on conflict (area_name) do nothing;
