import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Resultados",
  description: "Panel de respuestas del formulario de contacto",
};

export default function ResultadosLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${sora.variable} ${inter.variable} min-h-full flex-1 flex flex-col`}>
      {children}
    </div>
  );
}
