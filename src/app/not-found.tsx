import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mx-auto flex size-24 items-center justify-center rounded-3xl bg-gradient-to-br from-crystal to-berry shadow-xl shadow-crystal/20">
        <svg
          aria-hidden="true"
          className="size-12 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" strokeLinecap="round" />
          <path d="M11 8v3m0 3h.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>

      <h1 className="mt-6 text-3xl font-black tracking-tight text-night">404</h1>
      <p className="mt-2 text-base font-bold text-slate-500">Bu sayfa bulunamadı.</p>
      <p className="mx-auto mt-3 max-w-64 text-sm font-semibold leading-6 text-slate-400">
        Aradığın içerik taşınmış veya silinmiş olabilir.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          className="tap-scale rounded-xl bg-crystal px-6 py-3 text-sm font-black text-white shadow-lg shadow-crystal/25 transition hover:brightness-105"
          href="/"
          id="not-found-home-link"
        >
          Ana Sayfaya Dön
        </Link>
        <Link
          className="tap-scale rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          href="/explore"
          id="not-found-explore-link"
        >
          Keşfet
        </Link>
      </div>
    </div>
  );
}
