"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type MotivoContacto = "consulta" | "soporte" | "ventas" | "otro";

type RespuestaFormulario = {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono?: string;
  empresa?: string;
  motivo: MotivoContacto;
  mensaje: string;
  fechaEnvio: string;
};

const MOTIVO_META: Record<
  MotivoContacto,
  { label: string; text: string; bg: string; border: string }
> = {
  consulta: {
    label: "Consulta general",
    text: "#A5B4FC",
    bg: "rgba(99, 102, 241, 0.15)",
    border: "rgba(99, 102, 241, 0.4)",
  },
  soporte: {
    label: "Soporte",
    text: "#FCD34D",
    bg: "rgba(245, 158, 11, 0.15)",
    border: "rgba(245, 158, 11, 0.4)",
  },
  ventas: {
    label: "Ventas",
    text: "#67E8F9",
    bg: "rgba(34, 211, 238, 0.15)",
    border: "rgba(34, 211, 238, 0.4)",
  },
  otro: {
    label: "Otro",
    text: "#F0ABFC",
    bg: "rgba(217, 70, 239, 0.15)",
    border: "rgba(217, 70, 239, 0.4)",
  },
};

const MOTIVO_FILTROS: { value: "todos" | MotivoContacto; label: string }[] = [
  { value: "todos", label: "Todos los motivos" },
  { value: "consulta", label: "Consulta general" },
  { value: "soporte", label: "Soporte" },
  { value: "ventas", label: "Ventas" },
  { value: "otro", label: "Otro" },
];

function formatRelativeTime(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");
  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, "day");
}

function formatFullDate(iso: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

function escapeCsvValue(value: string): string {
  const needsQuotes = /[",\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function exportToExcel(respuestas: RespuestaFormulario[]) {
  const headers = ["Nombre completo", "Email", "Teléfono", "Empresa", "Motivo", "Mensaje", "Fecha de envío"];
  const rows = respuestas.map((respuesta) => [
    respuesta.nombreCompleto,
    respuesta.email,
    respuesta.telefono || "",
    respuesta.empresa || "",
    MOTIVO_META[respuesta.motivo].label,
    respuesta.mensaje,
    formatFullDate(respuesta.fechaEnvio),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\r\n");

  // El BOM asegura que Excel reconozca acentos y ñ correctamente al abrir el CSV.
  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `resultados-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function MotivoBadge({ motivo }: { motivo: MotivoContacto }) {
  const meta = MOTIVO_META[motivo];
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap"
      style={{ color: meta.text, background: meta.bg, borderColor: meta.border }}
    >
      {meta.label}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-white/10 px-6 py-20 text-center">
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: "rgba(99, 102, 241, 0.12)" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--form-primary)"
          strokeWidth="1.5"
          className="h-8 w-8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="font-[family-name:var(--font-sora)] text-lg font-semibold">
        Todavía no hay respuestas
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-white/50">
        Cuando alguien complete el formulario de contacto, sus respuestas aparecerán aquí.
      </p>
    </div>
  );
}

export default function PanelResultados() {
  const [query, setQuery] = useState("");
  const [motivoFiltro, setMotivoFiltro] = useState<"todos" | MotivoContacto>("todos");
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");
  const [seleccionada, setSeleccionada] = useState<RespuestaFormulario | null>(null);
  const [respuestas, setRespuestas] = useState<RespuestaFormulario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRespuestas() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch("/api/formulario");
        const body = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(body?.error || "No se pudieron cargar los registros.");
        }

        if (!cancelled) setRespuestas(body.respuestas || []);
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "No se pudieron cargar los registros."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadRespuestas();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtradas = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const resultado = respuestas.filter((respuesta) => {
      const matchesQuery =
        !normalizedQuery ||
        respuesta.nombreCompleto.toLowerCase().includes(normalizedQuery) ||
        respuesta.email.toLowerCase().includes(normalizedQuery);
      const matchesMotivo = motivoFiltro === "todos" || respuesta.motivo === motivoFiltro;
      return matchesQuery && matchesMotivo;
    });

    return resultado.sort((a, b) => {
      if (sortBy === "name") return a.nombreCompleto.localeCompare(b.nombreCompleto);
      return new Date(b.fechaEnvio).getTime() - new Date(a.fechaEnvio).getTime();
    });
  }, [respuestas, query, motivoFiltro, sortBy]);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 lg:px-10 lg:py-14">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/myworkin-logo.webp"
            alt="MyWorkIn"
            width={384}
            height={84}
            className="h-8 w-auto brightness-0 invert"
            priority
          />
        </div>
      </div>

      <div className="mt-8">
        <h1 className="font-[family-name:var(--font-sora)] text-3xl font-bold tracking-tight sm:text-4xl">
          Resultados
        </h1>
        <p className="mt-2 text-sm text-white/50">
          {isLoading
            ? "Cargando respuestas..."
            : `${respuestas.length} ${respuestas.length === 1 ? "respuesta total" : "respuestas totales"}`}
        </p>
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-[var(--form-text)] outline-none transition-all duration-200 placeholder:text-white/30 focus:border-[var(--form-primary)] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.25)]"
          />
        </div>

        <select
          value={motivoFiltro}
          onChange={(e) => setMotivoFiltro(e.target.value as "todos" | MotivoContacto)}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[var(--form-text)] outline-none transition-all duration-200 focus:border-[var(--form-primary)] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.25)]"
        >
          {MOTIVO_FILTROS.map((opcion) => (
            <option key={opcion.value} value={opcion.value} className="text-black">
              {opcion.label}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "recent" | "name")}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[var(--form-text)] outline-none transition-all duration-200 focus:border-[var(--form-primary)] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.25)]"
        >
          <option value="recent" className="text-black">
            Más reciente
          </option>
          <option value="name" className="text-black">
            Nombre A-Z
          </option>
        </select>

        <button
          type="button"
          onClick={() => exportToExcel(filtradas)}
          disabled={filtradas.length === 0}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          style={{
            background: "linear-gradient(90deg, var(--form-primary), var(--form-accent))",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
            />
          </svg>
          Exportar a Excel
        </button>
      </div>

      {/* Data view */}
      <div className="mt-6">
        {loadError ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-20 text-center">
            <h3 className="font-[family-name:var(--font-sora)] text-lg font-semibold">
              No se pudieron cargar los resultados
            </h3>
            <p className="mt-1.5 max-w-sm text-sm text-white/50">{loadError}</p>
          </div>
        ) : isLoading ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-white/10 px-6 py-20 text-center text-sm text-white/50">
            Cargando respuestas...
          </div>
        ) : filtradas.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Desktop table */}
            <div
              className="hidden overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] lg:block"
              style={{ background: "#17171d" }}
            >
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                    <th className="px-5 py-3 font-medium">Nombre</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Motivo</th>
                    <th className="px-5 py-3 font-medium">Fecha</th>
                    <th className="px-5 py-3 font-medium text-right">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((respuesta) => (
                    <tr
                      key={respuesta.id}
                      onClick={() => setSeleccionada(respuesta)}
                      className="cursor-pointer border-b border-white/5 transition-colors duration-150 last:border-0 hover:bg-white/5"
                    >
                      <td className="px-5 py-4 font-medium text-white/90">
                        {respuesta.nombreCompleto}
                      </td>
                      <td className="px-5 py-4 text-white/60">{respuesta.email}</td>
                      <td className="px-5 py-4">
                        <MotivoBadge motivo={respuesta.motivo} />
                      </td>
                      <td className="px-5 py-4 text-white/50">
                        {formatRelativeTime(respuesta.fechaEnvio)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSeleccionada(respuesta);
                          }}
                          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10"
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="flex flex-col gap-3 lg:hidden">
              {filtradas.map((respuesta) => (
                <button
                  key={respuesta.id}
                  type="button"
                  onClick={() => setSeleccionada(respuesta)}
                  className="rounded-2xl border border-white/10 p-4 text-left shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] transition-colors hover:bg-white/5"
                  style={{ background: "#17171d" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white/90">{respuesta.nombreCompleto}</p>
                      <p className="mt-0.5 text-xs text-white/50">{respuesta.email}</p>
                    </div>
                    <MotivoBadge motivo={respuesta.motivo} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-white/40">{formatRelativeTime(respuesta.fechaEnvio)}</span>
                    <span className="font-medium" style={{ color: "var(--form-accent)" }}>
                      Ver detalle →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Drawer de detalle */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          seleccionada ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/60"
          onClick={() => setSeleccionada(null)}
        />
        <div
          className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-white/10 p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] transition-transform duration-300 ease-out sm:p-8 ${
            seleccionada ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ background: "#17171d", color: "var(--form-text)" }}
        >
          {seleccionada && (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-[family-name:var(--font-sora)] text-xl font-semibold">
                    {seleccionada.nombreCompleto}
                  </h2>
                  <p className="mt-1 text-sm text-white/50">{formatFullDate(seleccionada.fechaEnvio)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSeleccionada(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/60 transition-colors hover:bg-white/10"
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              <div className="mt-6">
                <MotivoBadge motivo={seleccionada.motivo} />
              </div>

              <dl className="mt-6 flex flex-col gap-4 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-white/40">Email</dt>
                  <dd className="mt-1 text-white/80">{seleccionada.email}</dd>
                </div>
                {seleccionada.telefono && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-white/40">Teléfono</dt>
                    <dd className="mt-1 text-white/80">{seleccionada.telefono}</dd>
                  </div>
                )}
                {seleccionada.empresa && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-white/40">Empresa</dt>
                    <dd className="mt-1 text-white/80">{seleccionada.empresa}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs uppercase tracking-wide text-white/40">Mensaje</dt>
                  <dd className="mt-1.5 whitespace-pre-wrap rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">
                    {seleccionada.mensaje}
                  </dd>
                </div>
              </dl>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
