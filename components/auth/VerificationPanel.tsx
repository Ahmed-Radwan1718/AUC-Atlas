"use client";

import {
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

type VerificationPanelProps = {
  eyebrow: string;
  title: string;
  description: string;
  label: string;
  submitLabel: string;
  submittingLabel: string;
  message: string;
  messageType?: "error" | "success" | "";
  submitting: boolean;
  onSubmit: (code: string) => Promise<void> | void;
  actions?: ReactNode;
  onEscape?: () => void;
};

export function VerificationPanel({
  eyebrow,
  title,
  description,
  label,
  submitLabel,
  submittingLabel,
  message,
  messageType = "",
  submitting,
  onSubmit,
  actions,
  onEscape,
}: VerificationPanelProps) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    const timer = window.setTimeout(() => inputsRef.current[0]?.focus(), 50);

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") onEscapeRef.current?.();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function setDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    setDigits((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });

    if (digit) inputsRef.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index]) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pastedCode = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedCode) return;

    event.preventDefault();
    const next = Array.from({ length: 6 }, (_, index) => pastedCode.charAt(index) || "");
    setDigits(next);
    inputsRef.current[Math.min(pastedCode.length, 6) - 1]?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(digits.join(""));
  }

  return (
    <div className="auth-two-factor-panel">
      <div className="auth-two-factor-card">
        <div className="auth-two-factor-header">
          <p className="auth-two-factor-eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>{label}</label>
            <div className="auth-two-factor-code-inputs" aria-label={label}>
              {digits.map((digit, index) => (
                <input
                  className="auth-two-factor-code-input"
                  key={index}
                  ref={(element) => {
                    inputsRef.current[index] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  aria-label={`Digit ${index + 1}`}
                  value={digit}
                  onChange={(event) => setDigit(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  onPaste={handlePaste}
                />
              ))}
            </div>
          </div>

          <div className="auth-two-factor-actions">
            <button className="auth-button" type="submit" disabled={submitting}>
              {submitting ? submittingLabel : submitLabel}
            </button>
            {actions}
          </div>

          <p className={`auth-message${messageType ? ` ${messageType}` : ""}`} aria-live="polite">
            {message}
          </p>
        </form>
      </div>
    </div>
  );
}
