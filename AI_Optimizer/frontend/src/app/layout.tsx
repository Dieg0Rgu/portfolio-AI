import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Optimizer | Consola Bento Grid",
  description: "Optimizador de prompts multimodelo de alta precisión con diseño Bento Grid en verde minimalista.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-[#040c0a] text-[#e3f3ee]">
        {children}
      </body>
    </html>
  );
}
