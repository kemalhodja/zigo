"use client";

import {
  REGISTRATION_REQUIRED_SIGNUP_OPTIONS,
  type RequiredSignupOptionId
} from "@/lib/domain/registration-account";

type RegistrationAccountPickerProps = {
  value: RequiredSignupOptionId | null;
  onChange: (kind: RequiredSignupOptionId) => void;
};

export function RegistrationAccountPicker({
  value,
  onChange,
}: RegistrationAccountPickerProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
          Hesap türü
        </p>
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-wide text-red-600">
          Zorunlu
        </span>
      </div>

      {/* 6 options — flat 2-column grid */}
      <div className="grid grid-cols-2 gap-2">
        {REGISTRATION_REQUIRED_SIGNUP_OPTIONS.map((option) => {
          const isActive = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              data-testid={`registration-signup-${option.id}`}
              onClick={() => onChange(option.id)}
              aria-pressed={isActive}
              className={`tap-scale relative rounded-xl px-3 py-3.5 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-crystal focus:ring-offset-2 ${
                isActive
                  ? `bg-gradient-to-br ${option.accent} text-white shadow-md ring-2 ring-white`
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {/* Selection tick */}
              {isActive && (
                <span className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-white/30">
                  <svg
                    aria-hidden="true"
                    className="size-2.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
              <span className="mb-1 block text-lg leading-none">{option.emoji}</span>
              <span className="block text-sm font-black leading-tight">{option.label}</span>
              <span
                className={`mt-1 block text-[0.68rem] font-semibold leading-4 ${
                  isActive ? "text-white/80" : "text-slate-400"
                }`}
              >
                {option.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* No selection hint */}
      {!value && (
        <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          Devam etmek için yukarıdan bir hesap türü seçin.
        </p>
      )}
    </div>
  );
}

// Legacy export kept for profile-edit usage (includeInstitution variant)
export { RegistrationAccountPicker as RegistrationAccountPickerLegacy };
