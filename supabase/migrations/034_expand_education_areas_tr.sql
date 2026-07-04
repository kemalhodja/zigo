-- Genişletilmiş Türkçe sınıf kategorileri ve branş alanları (Match-Feed)
insert into public.education_areas (area_name, age_group)
values
  -- Okul öncesi
  ('Okuma-Yazma Hazırlığı', 'Okul Öncesi'),
  ('Okul Öncesi Matematik', 'Okul Öncesi'),
  ('Okul Öncesi Fen ve Doğa', 'Okul Öncesi'),
  ('Okul Öncesi Sanat ve Müzik', 'Okul Öncesi'),

  -- 1-4. Sınıf (İlkokul)
  ('1. Sınıf Matematik', '1-4. Sınıf'),
  ('2. Sınıf Matematik', '1-4. Sınıf'),
  ('3. Sınıf Matematik', '1-4. Sınıf'),
  ('4. Sınıf Matematik', '1-4. Sınıf'),
  ('1-4. Sınıf Türkçe', '1-4. Sınıf'),
  ('1-4. Sınıf Hayat Bilgisi', '1-4. Sınıf'),
  ('1-4. Sınıf İngilizce', '1-4. Sınıf'),
  ('1-4. Sınıf Fen Bilimleri', '1-4. Sınıf'),
  ('1-4. Sınıf Görsel Sanatlar', '1-4. Sınıf'),
  ('1-4. Sınıf Müzik', '1-4. Sınıf'),
  ('1-4. Sınıf Beden Eğitimi', '1-4. Sınıf'),

  -- 5-8. Sınıf (Ortaokul / LGS)
  ('5. Sınıf Matematik', '5-8. Sınıf'),
  ('6. Sınıf Matematik', '5-8. Sınıf'),
  ('7. Sınıf Matematik', '5-8. Sınıf'),
  ('LGS Türkçe', '5-8. Sınıf'),
  ('LGS İnkılap Tarihi', '5-8. Sınıf'),
  ('5-8. Sınıf Sosyal Bilgiler', '5-8. Sınıf'),
  ('5-8. Sınıf İngilizce', '5-8. Sınıf'),
  ('5-8. Sınıf Almanca', '5-8. Sınıf'),
  ('5-8. Sınıf Din Kültürü', '5-8. Sınıf'),
  ('5-8. Sınıf Teknoloji Tasarım', '5-8. Sınıf'),
  ('5-8. Sınıf Görsel Sanatlar', '5-8. Sınıf'),
  ('5-8. Sınıf Müzik', '5-8. Sınıf'),
  ('5-8. Sınıf Beden Eğitimi', '5-8. Sınıf'),
  ('Ortaokul Kodlama', '5-8. Sınıf'),
  ('Ortaokul Robotik', '5-8. Sınıf'),

  -- 9-12. Sınıf (Lise / YKS)
  ('9. Sınıf Matematik', '9-12. Sınıf'),
  ('10. Sınıf Matematik', '9-12. Sınıf'),
  ('11. Sınıf Matematik', '9-12. Sınıf'),
  ('YKS Kimya', '9-12. Sınıf'),
  ('YKS Biyoloji', '9-12. Sınıf'),
  ('YKS Edebiyat', '9-12. Sınıf'),
  ('YKS Tarih', '9-12. Sınıf'),
  ('YKS Coğrafya', '9-12. Sınıf'),
  ('YKS Felsefe', '9-12. Sınıf'),
  ('YKS Din Kültürü', '9-12. Sınıf'),
  ('9-12. Sınıf İngilizce', '9-12. Sınıf'),
  ('9-12. Sınıf Almanca', '9-12. Sınıf'),
  ('9-12. Sınıf Fransızca', '9-12. Sınıf'),
  ('Lise Kodlama', '9-12. Sınıf'),
  ('Lise Görsel Sanatlar', '9-12. Sınıf'),
  ('Lise Müzik', '9-12. Sınıf'),
  ('Lise Beden Eğitimi', '9-12. Sınıf'),

  -- Veli
  ('Veli: LGS Hazırlık Rehberi', 'Veli'),
  ('Veli: YKS Hazırlık Rehberi', 'Veli'),
  ('Veli: Dijital Güvenlik', 'Veli'),
  ('Veli: Öğrenme Rutini', 'Veli'),
  ('Veli: Motivasyon ve Ödül', 'Veli')
on conflict (area_name) do nothing;

-- Eski kayıtlardaki age_group etiketlerini Türkçe sınıf kategorilerine hizala
update public.education_areas set age_group = '1-4. Sınıf' where area_name = 'İlkokul Okuma-Yazma';
update public.education_areas set age_group = '5-8. Sınıf' where area_name = 'İngilizce Temel Seviye';
update public.education_areas set age_group = '5-8. Sınıf' where area_name = 'Kodlama ve Algoritma';
update public.education_areas set age_group = 'Veli' where area_name = 'Ebeveyn Rehberliği';
update public.education_areas set age_group = '5-8. Sınıf' where area_name = 'LGS Matematik';
update public.education_areas set age_group = '5-8. Sınıf' where area_name = 'LGS Fen Bilimleri';
update public.education_areas set age_group = '9-12. Sınıf' where area_name in ('YKS Fizik', 'YKS Matematik');
