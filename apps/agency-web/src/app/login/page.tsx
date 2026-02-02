"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/lib/store"
import { Loader2, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
    const router = useRouter()
    const { login } = useAuthStore()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            // TODO: Replace with actual API call
            // Simulated login for demo
            await new Promise((resolve) => setTimeout(resolve, 1500))

            // Mock successful login
            const mockUser = {
                id: "user-1",
                email: formData.email,
                full_name: "Admin Agencia",
                role: "agency_admin" as const,
                agency_id: "agency-1",
            }

            const mockAgency = {
                id: "agency-1",
                name: "Peru Adventure Tours",
                ruc: "20123456789",
                email: formData.email,
                phone: "+51 984 567 890",
                is_verified: true,
            }

            const mockToken = "mock-jwt-token-" + Date.now()

            // Set cookie for middleware
            document.cookie = `agency_token=${mockToken}; path=/; max-age=86400`

            // Update store
            login(mockUser, mockAgency, mockToken)

            // Redirect to dashboard
            router.push("/")
        } catch (err) {
            setError("Credenciales inválidas. Por favor intente nuevamente.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Ruta Segura</CardTitle>
                    <CardDescription>
                        Panel de Control para Agencias de Viajes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Correo Electrónico</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="admin@suagencia.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Contraseña</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Iniciando sesión...
                                </>
                            ) : (
                                "Iniciar Sesión"
                            )}
                        </Button>

                        <div className="text-center">
                            <a href="#" className="text-sm text-primary hover:underline">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>
                    </form>

                    <div className="mt-6 pt-6 border-t text-center">
                        <p className="text-sm text-muted-foreground">
                            ¿No tienes una cuenta de agencia?
                        </p>
                        <a href="/register" className="text-sm text-primary hover:underline">
                            Registra tu agencia aquí
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
