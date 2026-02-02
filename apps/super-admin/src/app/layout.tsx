import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Ruta Segura Perú - Centro de Comando Nacional",
  description: "Sistema de Seguridad Turística Nacional - Super Administrador",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.variable} antialiased bg-[#101622] text-white min-h-screen`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
