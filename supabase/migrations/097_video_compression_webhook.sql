-- 097_video_compression_webhook.sql
-- Video yüklemeleri için Supabase Edge Function Webhook kurulumu

-- 1. Webhook trigger'ını tetikleyecek fonksiyon (HTTP isteği atar)
CREATE OR REPLACE FUNCTION public.trigger_video_compression()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_url text := 'https://[PROJECT_REF].supabase.co/functions/v1/video-compressor';
  service_role_key text := current_setting('app.settings.service_role_key', true);
  payload jsonb;
BEGIN
  -- Sadece 'social-media' bucket'ına atılan dosyaları kontrol et
  IF NEW.bucket_id = 'social-media' THEN
    -- Sadece video dosyalarını işle (mp4, webm, mov)
    IF NEW.name ILIKE '%.mp4' OR NEW.name ILIKE '%.webm' OR NEW.name ILIKE '%.mov' THEN
      
      payload := jsonb_build_object(
        'type', 'INSERT',
        'table', 'objects',
        'schema', 'storage',
        'record', row_to_json(NEW)
      );

      -- Arka planda Edge Function'ı tetikle
      PERFORM net.http_post(
        url := webhook_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        body := payload
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Storage.objects tablosuna Trigger ekleme
-- Not: Bu işlem 'net' (pg_net) eklentisinin aktif olmasını gerektirir.
-- create extension if not exists pg_net; (Genellikle Supabase'de aktiftir)

DROP TRIGGER IF EXISTS on_video_upload_trigger ON storage.objects;
CREATE TRIGGER on_video_upload_trigger
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_video_compression();
