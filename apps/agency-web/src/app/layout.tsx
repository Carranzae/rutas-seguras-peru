import { Sidebar, Topbar } from "@/components/layout/sidebar"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
    title: "Ruta Segura - Panel de Agencia",
    description: "Centro de control para agencias de viajes - Ruta Segura Perú",
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="es">
            <body>
                <div className="min-h-screen bg-background">
                    {/* Sidebar */}
                    <Sidebar />

                    {/* Main content area */}
                    <div className="ml-64 transition-all duration-300">
                        {/* Topbar */}
                        <Topbar />

                        {/* Page content */}
                        <main className="pt-16 min-h-screen">
                            <div className="p-6">
                                {children}
                            </div>
                        </main>
                    </div>
                </div>
            </body>
        </html>
    )
}
