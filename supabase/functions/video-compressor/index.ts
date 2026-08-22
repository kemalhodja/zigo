import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

console.log("Video Compressor Webhook Service Started!");

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("Received Webhook Payload:", JSON.stringify(payload, null, 2));

    // Supabase Storage Webhook payload structure typically includes:
    // payload.record.bucket_id, payload.record.name, etc.
    const record = payload.record;
    if (!record || record.bucket_id !== 'social-media') {
      return new Response(JSON.stringify({ message: "Ignored: Not a social media object" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    const objectName = record.name; // e.g. "videos/user123/video.mp4"
    if (!objectName.toLowerCase().endsWith('.mp4') && !objectName.toLowerCase().endsWith('.webm') && !objectName.toLowerCase().endsWith('.mov')) {
      return new Response(JSON.stringify({ message: "Ignored: Not a video file" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`Processing video: ${objectName}`);

    // TODO: (CTO Endişesi) - Asıl video sıkıştırma işlemi burada yapılacak.
    // 1. Dosya Supabase Storage'dan indirilir (veya signed URL alınır).
    // 2. Cloudflare Stream, Mux veya AWS MediaConvert API'sine sıkıştırma komutu yollanır.
    // 3. Sıkıştırılan yeni dosya storage'a geri yazılır ve orijinali silinir.
    
    // Şimdilik sadece skeleton olarak simüle ediyoruz:
    const compressionResult = {
      status: "queued",
      originalFile: objectName,
      message: "Video is queued for 3rd party compression service."
    };

    return new Response(
      JSON.stringify(compressionResult),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error processing webhook:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
