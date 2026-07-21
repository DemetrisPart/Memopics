import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  error?: string;
  requiredMark?: boolean;
};

export function Input({
  label,
  error,
  requiredMark = false,
  className,
  id,
  ...props
}: InputProps) {
  const inputId =
    id ??
    (typeof label === "string"
      ? label.toLowerCase().replace(/\s+/g, "-")
      : "input-field");

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="flex items-center gap-0.5 text-sm font-medium text-charcoal-800"
      >
        {label}
        {requiredMark ? (
          <span className="text-rose-500" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <input
        id={inputId}
        className={cn(
          "w-full rounded-xl border border-stone-200 bg-white px-4 py-3.5 text-base text-charcoal-900 shadow-soft placeholder:text-stone-400 transition-all focus:border-gold-600 focus:outline-none focus:ring-[3px] focus:ring-gold-100",
          error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/15",
          className,
        )}
        {...props}
      />
      {error ? <p className="text-sm text-rose-500">{error}</p> : null}
    </div>
  );
}
