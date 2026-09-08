"use client";

import {
  BookmarkIcon,
  CompassIcon,
  FilmIcon,
  HomeIcon,
  MedalIcon,
  PlusIcon,
  SparklesIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Anasayfa", href: "/", icon: HomeIcon },
  { name: "Keşfet", href: "/explore", icon: CompassIcon },
  { name: "Reels", href: "/micro", icon: FilmIcon },
  { name: "Sınıflarım", href: "/classes", icon: UsersIcon },
  { name: "Rozetlerim", href: "/badges", icon: MedalIcon },
  { name: "Kaydedilenler", href: "/saved", icon: BookmarkIcon },
  { name: "Profilim", href: "/profile", icon: UserIcon },
];

export function LeftNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Ana Gezinme" className="flex flex-col gap-4">
      {/* Navigation Card */}
      <div className="rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.name} className="relative">
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -mt-3 h-6 w-1 rounded-r-full bg-violet-600"
                    aria-hidden="true"
                  />
                )}
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-bold transition-all duration-200 ease-out active:scale-95 ${
                    isActive
                      ? "bg-violet-50 text-violet-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive
                        ? "text-violet-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                    aria-hidden="true"
                  />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Create Post Action Button */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <Link
            href="/create"
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95"
          >
            <PlusIcon className="h-4 w-4 transition-transform group-hover:rotate-90" />
            <span>Yeni Paylaşım</span>
          </Link>
        </div>
      </div>

      {/* Zigo Plus Promo Mini Card */}
      <div className="overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-4 shadow-sm">
        <div className="flex items-center gap-2 text-violet-700">
          <SparklesIcon className="h-4 w-4" />
          <span className="text-xs font-black uppercase tracking-wider">Zigo Plus</span>
        </div>
        <p className="mt-1 text-xs font-bold text-slate-800">
          7 Gün Ücretsiz Deneyin!
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          İlk 7 gün içinde %50 indirim avantajı.
        </p>
        <Link
          href="/subscription"
          className="mt-3 block text-center rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-violet-700"
        >
          İncele
        </Link>
      </div>
    </nav>
  );
}
