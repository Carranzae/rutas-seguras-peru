"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    ArrowDownRight,
    ArrowUpRight,
    Building,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    Download,
    TrendingUp,
    Wallet
} from "lucide-react"
import { useState } from "react"

// Mock wallet data
const walletData = {
    balance: 45890.50,
    pending: 12340.00,
    totalRevenue: 158920.00,
    platformFee: 15892.00,
    netEarnings: 143028.00,
    bankAccount: "****4521 - BCP",
}

// Mock transactions
const transactions = [
    { id: "1", type: "income", description: "Machu Picchu Tour - John Smith", amount: 450, date: "2026-01-21", status: "completed" },
    { id: "2", type: "income", description: "Cusco City Tour - Group Booking", amount: 1200, date: "2026-01-20", status: "completed" },
    { id: "3", type: "withdrawal", description: "Retiro a cuenta BCP", amount: -5000, date: "2026-01-19", status: "completed" },
    { id: "4", type: "income", description: "Rainbow Mountain - Maria Garcia", amount: 85, date: "2026-01-18", status: "pending" },
    { id: "5", type: "fee", description: "Comisión plataforma (15%)", amount: -67.50, date: "2026-01-18", status: "completed" },
    { id: "6", type: "income", description: "Sacred Valley - Tour Privado", amount: 890, date: "2026-01-17", status: "completed" },
]

export default function WalletPage() {
    const [selectedPeriod, setSelectedPeriod] = useState("month")

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Billetera & Finanzas</h1>
                    <p className="text-muted-foreground">
                        Gestiona tu escrow, ingresos y retiros bancarios
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Download size={18} />
                        Exportar
                    </Button>
                    <Button className="gap-2">
                        <ArrowUpRight size={18} />
                        Solicitar Retiro
                    </Button>
                </div>
            </div>

            {/* Balance Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-primary to-orange-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Wallet className="w-8 h-8 opacity-80" />
                            <span className="text-xs bg-white/20 px-2 py-1 rounded">Disponible</span>
                        </div>
                        <p className="text-4xl font-bold">S/ {walletData.balance.toLocaleString()}</p>
                        <p className="text-sm opacity-80 mt-2">Saldo disponible para retiro</p>
                        <Button className="w-full mt-4 bg-white text-primary hover:bg-white/90">
                            Retirar fondos
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Clock className="w-8 h-8 text-amber-500" />
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">En espera</span>
                        </div>
                        <p className="text-4xl font-bold">S/ {walletData.pending.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground mt-2">Fondos en escrow (tours en progreso)</p>
                        <p className="text-xs text-amber-600 mt-4">
                            Se liberan al completar cada tour
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <TrendingUp className="w-8 h-8 text-green-500" />
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Este mes</span>
                        </div>
                        <p className="text-4xl font-bold text-green-600">+S/ {walletData.netEarnings.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground mt-2">Ganancias netas YTD</p>
                        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                            <span>Fee plataforma: S/ {walletData.platformFee.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bank Account */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-primary/10">
                                <Building className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">Cuenta bancaria vinculada</p>
                                <p className="text-sm text-muted-foreground">{walletData.bankAccount}</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm">
                            Cambiar cuenta
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <DollarSign className="w-6 h-6 mx-auto text-emerald-500 mb-2" />
                        <p className="text-2xl font-bold">S/ {walletData.totalRevenue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <ArrowDownRight className="w-6 h-6 mx-auto text-red-500 mb-2" />
                        <p className="text-2xl font-bold">15%</p>
                        <p className="text-sm text-muted-foreground">Comisión Plataforma</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <CheckCircle className="w-6 h-6 mx-auto text-green-500 mb-2" />
                        <p className="text-2xl font-bold">127</p>
                        <p className="text-sm text-muted-foreground">Pagos Recibidos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <ArrowUpRight className="w-6 h-6 mx-auto text-blue-500 mb-2" />
                        <p className="text-2xl font-bold">8</p>
                        <p className="text-sm text-muted-foreground">Retiros Este Mes</p>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Historial de Transacciones</CardTitle>
                            <CardDescription>Últimos movimientos de tu cuenta</CardDescription>
                        </div>
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="px-3 py-2 border rounded-md text-sm"
                        >
                            <option value="week">Esta semana</option>
                            <option value="month">Este mes</option>
                            <option value="quarter">Este trimestre</option>
                            <option value="year">Este año</option>
                        </select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {transactions.map((tx) => (
                            <div
                                key={tx.id}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-full ${tx.type === "income" ? "bg-green-100" :
                                            tx.type === "withdrawal" ? "bg-blue-100" :
                                                "bg-red-100"
                                        }`}>
                                        {tx.type === "income" ? (
                                            <ArrowDownRight className="w-4 h-4 text-green-600" />
                                        ) : tx.type === "withdrawal" ? (
                                            <ArrowUpRight className="w-4 h-4 text-blue-600" />
                                        ) : (
                                            <DollarSign className="w-4 h-4 text-red-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{tx.description}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar size={12} />
                                            <span>{tx.date}</span>
                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${tx.status === "completed"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-amber-100 text-amber-700"
                                                }`}>
                                                {tx.status === "completed" ? <CheckCircle size={10} /> : <Clock size={10} />}
                                                {tx.status === "completed" ? "Completado" : "Pendiente"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${tx.amount >= 0 ? "text-green-600" : "text-red-600"
                                        }`}>
                                        {tx.amount >= 0 ? "+" : ""}S/ {Math.abs(tx.amount).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button variant="outline" className="w-full mt-4">
                        Ver todas las transacciones
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
