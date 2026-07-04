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
          className="tap-scale absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500"
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? (
            <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9.3 3.1 11 7.5a11.2 11.2 0 0 1-2.1 3.4" />
              <path d="M6.2 6.2A11.2 11.2 0 0 0 3 12.5C4.7 16.9 9 20 14 20a9.8 9.8 0 0 0 2.1-.2" />
            </svg>
          ) : (
            <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
