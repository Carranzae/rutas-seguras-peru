"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Activity,
    AlertTriangle,
    Clock,
    DollarSign,
    MapPin,
    Star,
    TrendingUp,
    Users,
} from "lucide-react"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

// Dynamic import for Leaflet (SSR disabled)
const LiveMap = dynamic(() => import("@/components/dashboard/live-map"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[400px] bg-muted animate-pulse rounded-lg flex items-center justify-center">
            <MapPin className="w-8 h-8 text-muted-foreground animate-bounce" />
        </div>
    ),
})

// KPI Data
const kpis = [
    {
        title: "Turistas Protegidos Hoy",
        value: "47",
        change: "+12%",
        icon: Users,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
    },
    {
        title: "Tours Activos",
        value: "8",
        change: "En progreso",
        icon: Activity,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
    },
    {
        title: "Ingresos del Mes",
        value: "S/ 45,890",
        change: "+23% vs mes anterior",
        icon: DollarSign,
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
    },
    {
        title: "Calificación Promedio",
        value: "4.8",
        change: "★ Excelente",
        icon: Star,
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
    },
]

// Mock SOS Alerts
const sosAlerts = [
    {
        id: "1",
        tourist: "María García",
        guide: "Carlos Mendoza",
        tour: "Machu Picchu Adventure",
        time: "Hace 5 min",
        location: { lat: -13.1631, lng: -72.5450 },
        severity: "high",
    },
]

export default function DashboardPage() {
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard de Operaciones</h1>
                    <p className="text-muted-foreground">
                        Centro de mando - {currentTime.toLocaleDateString("es-PE")} {currentTime.toLocaleTimeString("es-PE")}
                    </p>
                </div>
                <Button variant="outline" className="gap-2">
                    <Clock size={16} />
                    Vista en tiempo real
                </Button>
            </div>

            {/* SOS Alert Banner */}
            {sosAlerts.length > 0 && (
                <Card className="border-destructive bg-destructive/5 sos-pulse">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-destructive/20">
                                    <AlertTriangle className="w-6 h-6 text-destructive" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-destructive">🚨 ALERTA SOS ACTIVA</h3>
                                    <p className="text-sm">
                                        {sosAlerts[0].tourist} en {sosAlerts[0].tour} - Guía: {sosAlerts[0].guide}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">Ver ubicación</Button>
                                <Button variant="destructive" size="sm">Responder</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {kpis.map((kpi) => (
                    <Card key={kpi.title}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{kpi.title}</p>
                                    <p className="text-3xl font-bold mt-1">{kpi.value}</p>
                                    <p className={`text-xs mt-1 ${kpi.color}`}>{kpi.change}</p>
                                </div>
                                <div className={`p-3 rounded-full ${kpi.bgColor}`}>
                                    <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Live Map - Takes 2 columns */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            Mapa en Vivo - Guías Activos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <LiveMap />
                    </CardContent>
                </Card>

                {/* Activity Feed */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Actividad Reciente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { action: "Tour iniciado", detail: "Machu Picchu Express", time: "10:30 AM", type: "start" },
                                { action: "Check-in realizado", detail: "Cusco City Tour", time: "9:45 AM", type: "checkin" },
                                { action: "Turista registrado", detail: "John Smith - USA", time: "9:30 AM", type: "register" },
                                { action: "Tour completado", detail: "Valle Sagrado", time: "8:00 AM", type: "complete" },
                                { action: "Pago recibido", detail: "S/ 1,250.00", time: "7:45 AM", type: "payment" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0">
                                    <div className={`w-2 h-2 rounded-full mt-2 ${item.type === "start" ? "bg-blue-500" :
                                            item.type === "complete" ? "bg-green-500" :
                                                item.type === "payment" ? "bg-emerald-500" :
                                                    "bg-gray-400"
                                        }`} />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{item.action}</p>
                                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{item.time}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Stats Row */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Tours Esta Semana
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold">24</span>
                            <span className="text-sm text-green-500 flex items-center">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                +8%
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">vs semana anterior</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Guías Activos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold">12</span>
                            <span className="text-sm text-muted-foreground">/ 15 total</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">80% operando</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Tiempo Respuesta SOS
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold">2.3</span>
                            <span className="text-sm text-muted-foreground">min promedio</span>
                        </div>
                        <p className="text-xs text-green-500 mt-1">✓ Dentro del objetivo (&lt;5 min)</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
