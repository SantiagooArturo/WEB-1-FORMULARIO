import PanelResultados from "./PanelResultados";

export default function ResultadosPage() {
  return (
    <main
      className="flex flex-1 flex-col font-[family-name:var(--font-inter)]"
      style={{ background: "var(--form-bg)", color: "var(--form-text)" }}
    >
      <PanelResultados />
    </main>
  );
}
