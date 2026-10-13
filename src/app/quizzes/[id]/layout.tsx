import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: quiz } = await supabase
      .from("user_quizzes")
      .select("title, description")
      .eq("id", id)
      .maybeSingle();

    const title = quiz?.title || "Zigo MEB Quiz Arenası";
    const desc = quiz?.description || "Zigo ile MEB kazanım odaklı soruları çöz, lig sıralamasında yüksel!";
    const ogUrl = `/api/og/quiz?title=${encodeURIComponent(title)}&count=5+Soru`;

    return {
      title: `${title} | Zigo`,
      description: desc,
      openGraph: {
        title,
        description: desc,
        images: [
          {
            url: ogUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: desc,
        images: [ogUrl],
      },
    };
  } catch {
    return {
      title: "Zigo Quiz Arena",
      description: "MEB kazanım odaklı quiz arenası",
    };
  }
}

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
