-- LGS/YKS koçluk ve rehber öğretmen branşları
insert into public.education_areas (area_name, age_group)
values
  -- LGS koçluk (5-8. Sınıf)
  ('LGS Koçluk', '5-8. Sınıf'),
  ('LGS Deneme Koçluğu', '5-8. Sınıf'),
  ('LGS Çalışma Programı Koçluğu', '5-8. Sınıf'),
  ('LGS Motivasyon Koçluğu', '5-8. Sınıf'),
  ('LGS Soru Çözüm Stratejileri', '5-8. Sınıf'),
  ('LGS Zaman Yönetimi Koçluğu', '5-8. Sınıf'),

  -- YKS koçluk (9-12. Sınıf)
  ('YKS Koçluk', '9-12. Sınıf'),
  ('YKS Deneme Koçluğu', '9-12. Sınıf'),
  ('YKS Tercih ve Kariyer Koçluğu', '9-12. Sınıf'),
  ('YKS Çalışma Programı Koçluğu', '9-12. Sınıf'),
  ('YKS Motivasyon Koçluğu', '9-12. Sınıf'),
  ('YKS Soru Çözüm Stratejileri', '9-12. Sınıf'),
  ('YKS Alan Seçimi Koçluğu', '9-12. Sınıf'),
  ('YKS Zaman Yönetimi Koçluğu', '9-12. Sınıf'),

  -- Rehber öğretmen / PDR
  ('Rehber Öğretmen (Okul Öncesi)', 'Okul Öncesi'),
  ('Rehber Öğretmen (1-4. Sınıf)', '1-4. Sınıf'),
  ('Rehber Öğretmen (5-8. Sınıf)', '5-8. Sınıf'),
  ('Rehber Öğretmen (9-12. Sınıf)', '9-12. Sınıf'),
  ('Rehber Öğretmen: Sınav Kaygısı', '5-8. Sınıf'),
  ('Rehber Öğretmen: Meslek Seçimi', '9-12. Sınıf'),
  ('Rehber Öğretmen: Aile İletişimi', 'Veli'),
  ('Rehber Öğretmen: Dijital Denge', '5-8. Sınıf'),
  ('PDR & Psikolojik Danışmanlık', '9-12. Sınıf'),

  -- Veli + koçluk/rehber kesişimi
  ('Veli: LGS Koçluk Desteği', 'Veli'),
  ('Veli: YKS Koçluk Desteği', 'Veli'),
  ('Veli: Rehber Öğretmen İşbirliği', 'Veli')
on conflict (area_name) do nothing;
