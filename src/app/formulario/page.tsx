"use client";

import Image from "next/image";
import FormularioPersonalizado from "./FormularioPersonalizado";
import LanguageToggle from "./LanguageToggle";
import { useLanguage } from "./language-context";

export default function FormularioPage() {
  const { t } = useLanguage();

  return (
    <main
      className="flex flex-1 flex-col lg:flex-row font-[family-name:var(--font-inter)]"
      style={{ background: "var(--form-bg)", color: "var(--form-text)" }}
    >
      {/* Bloque decorativo */}
      <section className="relative flex flex-col justify-between overflow-hidden px-8 py-10 lg:w-1/2 lg:px-16 lg:py-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.35), transparent 55%), radial-gradient(circle at 80% 70%, rgba(34,211,238,0.25), transparent 50%), linear-gradient(135deg, #14141b 0%, #0f0f13 60%)",
          }}
        />

        <div className="relative flex items-center justify-between">
          <Image
            src="/myworkin-logo.webp"
            alt="MyWorkIn"
            width={384}
            height={84}
            className="h-9 w-auto brightness-0 invert"
            priority
          />
          <LanguageToggle />
        </div>

        <div className="relative mt-16 max-w-md lg:mt-0">
          <h1 className="font-[family-name:var(--font-sora)] text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {t.hero.titleStart}{" "}
            <span
              style={{
                backgroundImage:
                  "linear-gradient(90deg, var(--form-primary), var(--form-accent))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {t.hero.titleHighlight}
            </span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/70 lg:text-lg">
            {t.hero.subtitle}
          </p>
        </div>

        <p className="relative hidden text-sm text-white/40 lg:block">
          © {new Date().getFullYear()} MyWorkIn. {t.hero.copyright}
        </p>
      </section>

      {/* Formulario */}
      <section className="flex flex-1 items-center justify-center px-6 py-10 lg:w-1/2 lg:px-16 lg:py-16">
        <div className="w-full max-w-2xl">
          <FormularioPersonalizado />
        </div>
      </section>
    </main>
  );
}
