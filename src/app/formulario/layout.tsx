import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import { LanguageProvider } from "./language-context";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Contáctanos",
  description: "Formulario de contacto y registro",
};

export default function FormularioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${sora.variable} ${inter.variable} min-h-full flex-1 flex flex-col`}>
      <LanguageProvider>{children}</LanguageProvider>
    </div>
  );
}
