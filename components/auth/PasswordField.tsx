"use client";

import { useState } from "react";

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  confirmLabel?: boolean;
};

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  confirmLabel = false,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-field auth-password-field">
      <label htmlFor={id}>{label}</label>

      <div className="auth-password-input-wrap">
        <input
          type={visible ? "text" : "password"}
          id={id}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />

        <button
          className={`auth-password-visibility-toggle ${
            visible ? "password-visible" : "password-hidden"
          }`}
          type="button"
          aria-label={visible ? "Hide password" : confirmLabel ? "Show confirm password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 5C6 5 2.1 9.6 1 12c1.1 2.4 5 7 11 7s9.9-4.6 11-7c-1.1-2.4-5-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-2.2a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z" />
            <path className="auth-password-eye-slash" d="M4 20L20 4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
