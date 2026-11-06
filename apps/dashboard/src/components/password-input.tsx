"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { AUTH_INPUT_CLASS } from "@/components/auth-frame";
import { cn } from "@/lib/utils";

/** A password field with a show/hide toggle, for the login and reset-password forms. */
export function PasswordInput({
  name,
  autoComplete,
  required,
  minLength,
  className,
}: {
  name: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative mt-1.5">
      <input
        name={name}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className={cn(AUTH_INPUT_CLASS, "mt-0 pr-11", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-700 hover:text-ink-950"
      >
        {visible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
      </button>
    </div>
  );
}
