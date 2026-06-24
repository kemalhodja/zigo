-- Çalışma becerileri, bursluluk ve ek destek branşları
insert into public.education_areas (area_name, age_group)
values
  ('Bursluluk Sınavı Koçluğu', '5-8. Sınıf'),
  ('Ders Çalışma Teknikleri (Ortaokul)', '5-8. Sınıf'),
  ('Ders Çalışma Teknikleri (Lise)', '9-12. Sınıf'),
  ('Ödev Koçluğu (İlkokul)', '1-4. Sınıf'),
  ('Ödev Koçluğu (Ortaokul)', '5-8. Sınıf'),
  ('Okuma Alışkanlığı Koçluğu', '1-4. Sınıf'),
  ('Sınav Stresi Yönetimi', '5-8. Sınıf'),
  ('Sınav Stresi Yönetimi (Lise)', '9-12. Sınıf'),
  ('Erken Çocukluk Gelişimi', 'Okul Öncesi'),
  ('Özel Eğitim Desteği', '1-4. Sınıf'),
  ('Dijital Vatandaşlık', '5-8. Sınıf'),
  ('Finansal Okuryazarlık', '9-12. Sınıf'),
  ('Üniversite Hazırlık Rehberliği', '9-12. Sınıf'),
  ('Veli: Ödev Takibi Koçluğu', 'Veli'),
  ('Veli: Sınav Dönemi Desteği', 'Veli')
on conflict (area_name) do nothing;
