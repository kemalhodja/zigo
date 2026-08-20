"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, UsersIcon, MedalIcon, BookmarkIcon } from "lucide-react";

const navItems = [
  { name: "Anasayfa", href: "/", icon: HomeIcon },
  { name: "Sınıflarım", href: "/classes", icon: UsersIcon },
  { name: "Rozetlerim", href: "/badges", icon: MedalIcon },
  { name: "Kayıtlı", href: "/saved", icon: BookmarkIcon },
];

export function LeftNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Ana Gezinme" className="flex h-full w-full flex-col justify-between">
      {/* Desktop/Tablet View */}
      <ul className="hidden md:flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.name} className="relative">
              {isActive && (
                <div className="absolute left-0 top-1/2 -mt-3 h-6 w-1 rounded-r-full bg-amber-500" aria-hidden="true" />
              )}
              <Link
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-all duration-300 ease-out active:scale-95 ${
                  isActive
                    ? "bg-amber-50 text-amber-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon 
                  className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? "text-amber-500" : "text-slate-400 group-hover:text-slate-600"
                  }`} 
                  aria-hidden="true" 
                />
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Mobile Bottom Bar View with Glassmorphism */}
      <div className="flex md:hidden items-center justify-around border-t border-slate-200/50 bg-white/80 backdrop-blur-xl px-2 py-2 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex flex-col items-center gap-1 rounded-xl p-2 text-[10px] font-bold transition-all duration-300 active:scale-90 ${
                isActive ? "text-amber-600" : "text-slate-500 hover:text-slate-900"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <div className={`relative flex items-center justify-center rounded-full p-1.5 transition-colors duration-300 ${isActive ? 'bg-amber-100' : 'bg-transparent group-hover:bg-slate-100'}`}>
                <Icon className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-amber-600" : "text-slate-400"}`} aria-hidden="true" />
              </div>
              <span className={isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100"}>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
