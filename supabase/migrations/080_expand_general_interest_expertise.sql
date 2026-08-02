-- Expand teacher niche / Genel İlgi expertise matrix suggestions.
insert into public.education_areas (area_name, age_group)
values
  -- Learning & exams
  ('Eğitim ve Pedagoji', 'Genel İlgi'),
  ('Çalışma Teknikleri', 'Genel İlgi'),
  ('Sınav Motivasyonu', 'Genel İlgi'),
  ('Üniversite ve Tercih', 'Genel İlgi'),
  ('Kariyer ve Meslek', 'Genel İlgi'),
  ('Burs ve Yurt Dışı Eğitim', 'Genel İlgi'),

  -- STEM & tech
  ('Yapay Zeka', 'Genel İlgi'),
  ('Kodlama ve Yazılım', 'Genel İlgi'),
  ('Robotik ve STEM', 'Genel İlgi'),
  ('Astronomi', 'Genel İlgi'),
  ('Popüler Matematik', 'Genel İlgi'),
  ('Popüler Bilim', 'Genel İlgi'),

  -- Culture & media
  ('Tarih ve Medeniyet', 'Genel İlgi'),
  ('Coğrafya ve Seyahat', 'Genel İlgi'),
  ('Dil Öğrenme', 'Genel İlgi'),
  ('İngilizce', 'Genel İlgi'),
  ('Kitap ve Okuma', 'Genel İlgi'),
  ('Yaratıcı Yazarlık', 'Genel İlgi'),
  ('Sinema ve Medya', 'Genel İlgi'),
  ('Fotoğrafçılık', 'Genel İlgi'),
  ('Podcast ve İçerik Üretimi', 'Genel İlgi'),
  ('Felsefe ve Mantık', 'Genel İlgi'),

  -- Life skills
  ('Finansal Okuryazarlık', 'Genel İlgi'),
  ('Girişimcilik', 'Genel İlgi'),
  ('Beslenme ve Diyet', 'Genel İlgi'),
  ('Ebeveynlik', 'Genel İlgi'),
  ('Çocuk Gelişimi', 'Genel İlgi'),
  ('Özel Eğitim', 'Genel İlgi'),
  ('İklim ve Sürdürülebilirlik', 'Genel İlgi'),
  ('Gönüllülük ve Sosyal Sorumluluk', 'Genel İlgi'),
  ('Hukuk Okuryazarlığı', 'Genel İlgi'),
  ('İnovasyon ve Tasarım', 'Genel İlgi'),

  -- Sports & games
  ('Tenis', 'Genel İlgi'),
  ('Yüzme', 'Genel İlgi'),
  ('Satranç', 'Genel İlgi'),
  ('E-Spor', 'Genel İlgi')
on conflict (area_name) do nothing;
