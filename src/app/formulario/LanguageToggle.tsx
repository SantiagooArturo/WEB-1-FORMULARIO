"use client";

import { useLanguage } from "./language-context";
import type { Language } from "./i18n";

const OPTIONS: { value: Language; label: string }[] = [
  { value: "es", label: "ES" },
  { value: "en", label: "EN" },
];

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className="relative flex rounded-full border border-white/15 p-0.5 text-xs font-semibold"
      role="group"
      aria-label="Idioma / Language"
    >
      {OPTIONS.map((option) => {
        const isActive = option.value === language;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setLanguage(option.value)}
            aria-pressed={isActive}
            className="relative z-10 rounded-full px-3 py-1 transition-colors duration-200"
            style={{
              color: isActive ? "#0f0f13" : "rgba(245,245,247,0.6)",
              background: isActive
                ? "linear-gradient(90deg, var(--form-primary), var(--form-accent))"
                : "transparent",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
