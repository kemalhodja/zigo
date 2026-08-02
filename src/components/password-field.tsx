"use client";

import { useId, useState } from "react";

type PasswordFieldProps = {
  autoComplete?: string;
  className?: string;
  hideLabel: string;
  inputClassName?: string;
  label: string;
  minLength?: number;
  name?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  showLabel: string;
  value?: string;
};

export function PasswordField({
  autoComplete = "current-password",
  className,
  hideLabel,
  inputClassName = "zigo-input mt-2 w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none",
  label,
  minLength,
  name = "password",
  onChange,
  placeholder,
  required = true,
  showLabel,
  value,
}: PasswordFieldProps) {
  const inputId = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div className={className}>
      <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500" htmlFor={inputId}>
        {label}
      </label>
      <div className="relative mt-2">
        <input
          autoComplete={autoComplete}
          className={inputClassName}
          id={inputId}
          minLength={minLength}
          name={name}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          required={required}
          type={visible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          className="tap-scale absolute inset-y-0 right-0 z-10 flex w-12 items-center justify-center text-slate-500 hover:text-slate-700 focus:outline-none cursor-pointer select-none"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setVisible((current) => !current);
          }}
          onMouseDown={(e) => e.preventDefault()}
          type="button"
        >
          {visible ? (
            <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
              <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
              <line x1="2" x2="22" y1="2" y2="22" />
            </svg>
          ) : (
            <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M2 12s3-7 10-7 10 7 10 7-3-7-10-7-10 7-10 7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
