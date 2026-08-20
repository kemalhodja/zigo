import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Yardım ve SSS",
  description: "Zigo kullanımı hakkında sıkça sorulan sorular ve destek."
};

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center p-8 text-slate-900 bg-white">
      <h1 className="text-3xl font-black text-crystal mb-8">Yardım Merkezi</h1>
      <div className="max-w-2xl w-full space-y-4">
        <div className="border border-slate-200 rounded-xl p-6 bg-slate-50">
          <h2 className="text-xl font-bold mb-2">Nasıl içerik paylaşabilirim?</h2>
          <p className="text-slate-600">Öğretmen hesabıyla giriş yaptığınızda sağ üst köşedeki "+" butonunu kullanarak gönderi, hikaye veya eğitim içeriği paylaşabilirsiniz.</p>
        </div>
        <div className="border border-slate-200 rounded-xl p-6 bg-slate-50">
          <h2 className="text-xl font-bold mb-2">Hesabımı nasıl silebilirim?</h2>
          <p className="text-slate-600">Ayarlar menüsünden Hesap &gt; Hesabımı Sil adımlarını takip ederek hesabınızı ve tüm verilerinizi silebilirsiniz.</p>
        </div>
      </div>
      <Link href="/" className="mt-8 text-slate-500 hover:text-slate-900 transition-colors">
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
