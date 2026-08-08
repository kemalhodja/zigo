"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { getSchoolsForCityDistrict } from "@/lib/domain/turkey-locations";

type SearchableSchoolSelectProps = {
  city: string;
  district: string;
  value: string;
  onChange: (schoolName: string) => void;
  disabled?: boolean;
};

export function SearchableSchoolSelect({
  city,
  district,
  value,
  onChange,
  disabled = false,
}: SearchableSchoolSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const schoolSuggestions = useMemo(() => {
    return getSchoolsForCityDistrict(city, district);
  }, [city, district]);

  const filteredSchools = useMemo(() => {
    if (!search.trim()) return schoolSuggestions;
    const query = search.trim().toLocaleLowerCase("tr-TR");
    return schoolSuggestions.filter((school) =>
      school.toLocaleLowerCase("tr-TR").includes(query),
    );
  }, [schoolSuggestions, search]);

  function handleSelect(schoolName: string) {
    setSearch(schoolName);
    onChange(schoolName);
    setIsOpen(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearch(val);
    onChange(val);
    setIsOpen(true);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          id="school-search-input"
          type="text"
          disabled={disabled}
          value={search}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={city ? "Okul adı ara veya yazın (Örn: Özel Doğa Koleji...)" : "Önce il ve ilçe seçin..."}
          className="w-full rounded-xl bg-slate-50 px-3.5 py-2.5 pl-9 text-sm font-bold text-night border border-slate-200 outline-none transition focus:border-crystal focus:bg-white focus:ring-2 focus:ring-crystal/20 disabled:opacity-60"
        />
        <svg
          aria-hidden="true"
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </svg>
      </div>

      {/* Dropdown overlay */}
      {isOpen && !disabled ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl backdrop-blur-md">
          {filteredSchools.length > 0 ? (
            <ul className="space-y-0.5">
              {filteredSchools.map((school) => {
                const isPrivate = school.toLocaleLowerCase("tr-TR").includes("özel") || school.toLocaleLowerCase("tr-TR").includes("kolej");
                return (
                  <li key={school}>
                    <button
                      type="button"
                      onClick={() => handleSelect(school)}
                      className="tap-scale flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-800 hover:bg-violet-50 hover:text-crystal transition"
                    >
                      <span className="truncate">{school}</span>
                      <span
                        className={`ml-2 shrink-0 rounded-md px-1.5 py-0.5 text-[0.62rem] font-black uppercase ${
                          isPrivate ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {isPrivate ? "Özel Okul" : "Devlet Okulu"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-3 text-center text-xs font-semibold text-slate-500">
              <p>Özel aramanızla eşleşen liste okulu bulunamadı.</p>
              <p className="mt-1 font-bold text-crystal">Girdiğiniz &quot;{search}&quot; okul ismi olarak kaydedilecek.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
