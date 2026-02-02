"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    AlertCircle,
    Camera,
    Check,
    Clock,
    FileCheck,
    Mail,
    MoreVertical,
    Phone,
    Plus,
    Search,
    Star,
    Users,
    X,
} from "lucide-react"
import { useState } from "react"

// Mock guides data
const mockGuides = [
    {
        id: "1",
        name: "Carlos Mendoza",
        email: "carlos@email.com",
        phone: "+51 987 654 321",
        status: "verified",
        rating: 4.9,
        tours_completed: 156,
        languages: ["Español", "English", "Quechua"],
        avatar: "CM",
        documents_verified: true,
        biometric_verified: true,
    },
    {
        id: "2",
        name: "Ana Torres",
        email: "ana@email.com",
        phone: "+51 912 345 678",
        status: "pending_biometric",
        rating: 4.7,
        tours_completed: 89,
        languages: ["Español", "English"],
        avatar: "AT",
        documents_verified: true,
        biometric_verified: false,
    },
    {
        id: "3",
        name: "Luis Vargas",
        email: "luis@email.com",
        phone: "+51 945 678 901",
        status: "pending_documents",
        rating: 0,
        tours_completed: 0,
        languages: ["Español", "Português"],
        avatar: "LV",
        documents_verified: false,
        biometric_verified: false,
    },
    {
        id: "4",
        name: "María López",
        email: "maria@email.com",
        phone: "+51 976 543 210",
        status: "verified",
        rating: 4.8,
        tours_completed: 234,
        languages: ["Español", "English", "Français"],
        avatar: "ML",
        documents_verified: true,
        biometric_verified: true,
    },
]

const statusConfig = {
    verified: { label: "Verificado", color: "bg-green-100 text-green-700", icon: Check },
    pending_biometric: { label: "Pendiente Biométrico", color: "bg-amber-100 text-amber-700", icon: Camera },
    pending_documents: { label: "Pendiente Documentos", color: "bg-red-100 text-red-700", icon: FileCheck },
    rejected: { label: "Rechazado", color: "bg-red-100 text-red-700", icon: X },
}

export default function GuidesPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [filter, setFilter] = useState("all")
    const [selectedGuide, setSelectedGuide] = useState<typeof mockGuides[0] | null>(null)

    const filteredGuides = mockGuides.filter((guide) => {
        const matchesSearch = guide.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesFilter = filter === "all" || guide.status === filter
        return matchesSearch && matchesFilter
    })

    const pendingCount = mockGuides.filter(
        (g) => g.status === "pending_biometric" || g.status === "pending_documents"
    ).length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gestión de Guías</h1>
                    <p className="text-muted-foreground">
                        Directorio de guías y validación biométrica
                    </p>
                </div>
                <Button className="gap-2">
                    <Plus size={18} />
                    Agregar Guía
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{mockGuides.length}</p>
                                <p className="text-sm text-muted-foreground">Total Guías</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <Check className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {mockGuides.filter((g) => g.status === "verified").length}
                                </p>
                                <p className="text-sm text-muted-foreground">Verificados</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={pendingCount > 0 ? "border-amber-300" : ""}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                                <Clock className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{pendingCount}</p>
                                <p className="text-sm text-muted-foreground">Pendientes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-amber-400/10">
                                <Star className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">4.78</p>
                                <p className="text-sm text-muted-foreground">Rating Promedio</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Alert */}
            {pendingCount > 0 && (
                <Card className="border-amber-300 bg-amber-50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                            <div>
                                <p className="font-medium text-amber-800">
                                    {pendingCount} guías pendientes de verificación
                                </p>
                                <p className="text-sm text-amber-700">
                                    Revisa los documentos y selfies biométricas para aprobar a los nuevos guías.
                                </p>
                            </div>
                            <Button size="sm" className="ml-auto">
                                Revisar ahora
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar guías..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="all">Todos los estados</option>
                    <option value="verified">Verificados</option>
                    <option value="pending_biometric">Pendiente Biométrico</option>
                    <option value="pending_documents">Pendiente Documentos</option>
                </select>
            </div>

            {/* Guides List */}
            <div className="grid gap-4">
                {filteredGuides.map((guide) => {
                    const status = statusConfig[guide.status as keyof typeof statusConfig]
                    const StatusIcon = status.icon

                    return (
                        <Card key={guide.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                                            {guide.avatar}
                                        </div>

                                        {/* Info */}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold">{guide.name}</h3>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${status.color}`}>
                                                    <StatusIcon size={12} />
                                                    {status.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Mail size={14} />
                                                    {guide.email}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Phone size={14} />
                                                    {guide.phone}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats & Actions */}
                                    <div className="flex items-center gap-6">
                                        {guide.status === "verified" && (
                                            <>
                                                <div className="text-center">
                                                    <p className="font-bold">{guide.tours_completed}</p>
                                                    <p className="text-xs text-muted-foreground">Tours</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-bold flex items-center gap-1">
                                                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                        {guide.rating}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">Rating</p>
                                                </div>
                                            </>
                                        )}

                                        <div className="text-center">
                                            <div className="flex gap-1">
                                                {guide.languages.slice(0, 2).map((lang) => (
                                                    <span key={lang} className="px-2 py-0.5 text-xs bg-gray-100 rounded">
                                                        {lang.slice(0, 2)}
                                                    </span>
                                                ))}
                                                {guide.languages.length > 2 && (
                                                    <span className="px-2 py-0.5 text-xs bg-gray-100 rounded">
                                                        +{guide.languages.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">Idiomas</p>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex gap-2">
                                            {guide.status !== "verified" && (
                                                <>
                                                    <Button size="sm" variant="outline" className="gap-1 text-green-600 border-green-600 hover:bg-green-50">
                                                        <Check size={14} />
                                                        Aprobar
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="gap-1 text-red-600 border-red-600 hover:bg-red-50">
                                                        <X size={14} />
                                                        Rechazar
                                                    </Button>
                                                </>
                                            )}
                                            <Button size="icon" variant="ghost">
                                                <MoreVertical size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Verification badges */}
                                <div className="flex gap-2 mt-4 pt-4 border-t">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${guide.documents_verified
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-500"
                                        }`}>
                                        <FileCheck size={12} />
                                        Documentos {guide.documents_verified ? "✓" : "Pendiente"}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${guide.biometric_verified
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-500"
                                        }`}>
                                        <Camera size={12} />
                                        Biométrico {guide.biometric_verified ? "✓" : "Pendiente"}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
