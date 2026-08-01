"use client";

import { useState, type FormEvent } from "react";
import { useLanguage } from "./language-context";
import type { Translations } from "./i18n";

type MotivoContacto = "" | "consulta" | "soporte" | "ventas" | "otro";

type FormData = {
  nombreCompleto: string;
  email: string;
  telefono: string;
  motivo: MotivoContacto;
  mensaje: string;
  aceptaTerminos: boolean;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const INITIAL_DATA: FormData = {
  nombreCompleto: "",
  email: "",
  telefono: "",
  motivo: "",
  mensaje: "",
  aceptaTerminos: false,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STEP_FIELDS: (keyof FormData)[][] = [
  ["nombreCompleto", "email", "telefono"],
  ["motivo", "mensaje"],
  ["aceptaTerminos"],
];

function validateField(field: keyof FormData, data: FormData, t: Translations): string | undefined {
  switch (field) {
    case "nombreCompleto":
      if (!data.nombreCompleto.trim()) return t.form.errors.nombreCompleto;
      break;
    case "email":
      if (!data.email.trim()) return t.form.errors.emailRequired;
      if (!EMAIL_REGEX.test(data.email.trim())) return t.form.errors.emailInvalid;
      break;
    case "motivo":
      if (!data.motivo) return t.form.errors.motivo;
      break;
    case "mensaje":
      if (!data.mensaje.trim()) return t.form.errors.mensajeRequired;
      if (data.mensaje.trim().length < 10) return t.form.errors.mensajeMin;
      break;
    case "aceptaTerminos":
      if (!data.aceptaTerminos) return t.form.errors.aceptaTerminos;
      break;
    default:
      break;
  }
  return undefined;
}

function validateStep(stepIndex: number, data: FormData, t: Translations): FormErrors {
  const errors: FormErrors = {};
  for (const field of STEP_FIELDS[stepIndex]) {
    const error = validateField(field, data, t);
    if (error) errors[field] = error;
  }
  return errors;
}

function validateAll(data: FormData, t: Translations): FormErrors {
  return STEP_FIELDS.reduce<FormErrors>(
    (acc, _fields, index) => ({ ...acc, ...validateStep(index, data, t) }),
    {}
  );
}

const inputBaseClass =
  "w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-[var(--form-text)] outline-none transition-all duration-200 placeholder:text-white/30 focus:border-[var(--form-primary)] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.25)]";

function fieldBorderClass(hasError: boolean) {
  return hasError ? "border-red-500/70" : "border-white/10";
}

function Stepper({ currentStep, stepLabels }: { currentStep: number; stepLabels: readonly string[] }) {
  return (
    <ol className="flex gap-4 overflow-x-auto pb-1 lg:w-44 lg:shrink-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0">
      {stepLabels.map((label, index) => {
        const isDone = index < currentStep;
        const isCurrent = index === currentStep;
        const isLast = index === stepLabels.length - 1;

        return (
          <li key={label} className="flex shrink-0 items-center gap-3 lg:flex-1 lg:items-stretch">
            <div className="flex flex-col items-center lg:flex-col">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors duration-300"
                style={
                  isDone
                    ? { background: "var(--form-primary)", borderColor: "var(--form-primary)", color: "#fff" }
                    : isCurrent
                      ? { borderColor: "var(--form-primary)", color: "var(--form-primary)", background: "transparent" }
                      : { borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.4)" }
                }
              >
                {isDone ? "✓" : index + 1}
              </span>
              {!isLast && (
                <span
                  className="hidden w-px flex-1 lg:block"
                  style={{
                    background: isDone ? "var(--form-primary)" : "rgba(255,255,255,0.15)",
                    minHeight: "1.5rem",
                  }}
                />
              )}
            </div>
            <span
              className={`text-xs font-medium leading-tight lg:pb-6 ${
                isCurrent ? "text-[var(--form-text)]" : isDone ? "text-white/70" : "text-white/40"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function FormularioPersonalizado() {
  const { t } = useLanguage();
  const [data, setData] = useState<FormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const MOTIVOS: { value: Exclude<MotivoContacto, "">; label: string }[] = [
    { value: "consulta", label: t.form.motivos.consulta },
    { value: "soporte", label: t.form.motivos.soporte },
    { value: "ventas", label: t.form.motivos.ventas },
    { value: "otro", label: t.form.motivos.otro },
  ];

  function updateField<K extends keyof FormData>(field: K, value: FormData[K]) {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function goNext() {
    const stepErrors = validateStep(currentStep, data, t);
    setErrors((prev) => ({ ...prev, ...stepErrors }));

    if (Object.keys(stepErrors).length > 0) return;
    setCurrentStep((step) => Math.min(step + 1, STEP_FIELDS.length - 1));
  }

  function goBack() {
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateAll(data, t);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstErrorStep = STEP_FIELDS.findIndex((fields) =>
        fields.some((field) => validationErrors[field])
      );
      if (firstErrorStep !== -1) setCurrentStep(firstErrorStep);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // TODO: cuando exista un flujo de N8N, cambiar este endpoint por el webhook correspondiente.
    console.log(data);

    try {
      const response = await fetch("/api/formulario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || t.form.errors.submitGeneric);
      }

      setIsSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t.form.errors.submitGeneric);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setData(INITIAL_DATA);
    setErrors({});
    setCurrentStep(0);
    setIsSuccess(false);
    setSubmitError(null);
  }

  if (isSuccess) {
    const firstName = data.nombreCompleto.split(" ")[0];
    return (
      <div
        className="rounded-2xl border border-white/10 p-8 text-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]"
        style={{ background: "#17171d" }}
      >
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
          style={{
            background:
              "linear-gradient(135deg, var(--form-primary), var(--form-accent))",
          }}
        >
          ✓
        </div>
        <h2 className="font-[family-name:var(--font-sora)] text-xl font-semibold">
          {firstName ? t.form.success.title(firstName) : t.form.success.titleFallback}
        </h2>
        <p className="mt-2 text-sm text-white/60">{t.form.success.message}</p>
        <button
          type="button"
          onClick={handleReset}
          className="mt-6 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/5"
        >
          {t.form.buttons.otraRespuesta}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-white/10 p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] sm:p-8"
      style={{ background: "#17171d" }}
    >
      <h2 className="font-[family-name:var(--font-sora)] text-xl font-semibold">
        {t.form.heading}
      </h2>
      <p className="mt-1 text-sm text-white/50">{t.form.subheading}</p>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:gap-8">
        <Stepper currentStep={currentStep} stepLabels={t.form.steps} />

        <div className="flex flex-1 flex-col gap-5">
          {currentStep === 0 && (
            <>
              <div>
                <label htmlFor="nombreCompleto" className="mb-1.5 block text-sm font-medium text-white/80">
                  {t.form.labels.nombreCompleto}
                </label>
                <input
                  id="nombreCompleto"
                  type="text"
                  value={data.nombreCompleto}
                  onChange={(e) => updateField("nombreCompleto", e.target.value)}
                  className={`${inputBaseClass} ${fieldBorderClass(!!errors.nombreCompleto)}`}
                  placeholder={t.form.placeholders.nombreCompleto}
                />
                {errors.nombreCompleto && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.nombreCompleto}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-white/80">
                  {t.form.labels.email}
                </label>
                <input
                  id="email"
                  type="text"
                  value={data.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className={`${inputBaseClass} ${fieldBorderClass(!!errors.email)}`}
                  placeholder={t.form.placeholders.email}
                />
                {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="telefono" className="mb-1.5 block text-sm font-medium text-white/80">
                  {t.form.labels.telefono} <span className="text-white/40">{t.form.optional}</span>
                </label>
                <input
                  id="telefono"
                  type="text"
                  value={data.telefono}
                  onChange={(e) => updateField("telefono", e.target.value)}
                  className={`${inputBaseClass} ${fieldBorderClass(false)}`}
                  placeholder={t.form.placeholders.telefono}
                />
              </div>
            </>
          )}

          {currentStep === 1 && (
            <>
              <div>
                <label htmlFor="motivo" className="mb-1.5 block text-sm font-medium text-white/80">
                  {t.form.labels.motivo}
                </label>
                <select
                  id="motivo"
                  value={data.motivo}
                  onChange={(e) => updateField("motivo", e.target.value as MotivoContacto)}
                  className={`${inputBaseClass} ${fieldBorderClass(!!errors.motivo)} appearance-none`}
                >
                  <option value="" disabled className="text-black">
                    {t.form.placeholders.motivoDefault}
                  </option>
                  {MOTIVOS.map((motivo) => (
                    <option key={motivo.value} value={motivo.value} className="text-black">
                      {motivo.label}
                    </option>
                  ))}
                </select>
                {errors.motivo && <p className="mt-1.5 text-xs text-red-400">{errors.motivo}</p>}
              </div>

              <div>
                <label htmlFor="mensaje" className="mb-1.5 block text-sm font-medium text-white/80">
                  {t.form.labels.mensaje}
                </label>
                <textarea
                  id="mensaje"
                  rows={4}
                  value={data.mensaje}
                  onChange={(e) => updateField("mensaje", e.target.value)}
                  className={`${inputBaseClass} ${fieldBorderClass(!!errors.mensaje)} resize-none`}
                  placeholder={t.form.placeholders.mensaje}
                />
                {errors.mensaje && <p className="mt-1.5 text-xs text-red-400">{errors.mensaje}</p>}
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                <p className="font-medium text-white/90">{data.nombreCompleto}</p>
                <p>{data.email}</p>
                {data.telefono && <p>{data.telefono}</p>}
                <p className="mt-2 text-white/50">
                  {MOTIVOS.find((m) => m.value === data.motivo)?.label}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{data.mensaje}</p>
              </div>

              <div>
                <label className="flex items-start gap-2.5 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={data.aceptaTerminos}
                    onChange={(e) => updateField("aceptaTerminos", e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-white/20 accent-[var(--form-primary)]"
                  />
                  <span>{t.form.terminos}</span>
                </label>
                {errors.aceptaTerminos && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.aceptaTerminos}</p>
                )}
              </div>
            </>
          )}

          {submitError && (
            <p className="text-sm text-red-400">{submitError}</p>
          )}

          <div className="mt-2 flex items-center gap-3">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="rounded-xl border border-white/15 px-5 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/5"
              >
                {t.form.buttons.atras}
              </button>
            )}

            {currentStep < STEP_FIELDS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex-1 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(90deg, var(--form-primary), var(--form-accent))",
                }}
              >
                {t.form.buttons.siguiente}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                style={{
                  background: "linear-gradient(90deg, var(--form-primary), var(--form-accent))",
                }}
              >
                {isSubmitting ? t.form.buttons.enviando : t.form.buttons.enviar}
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
