"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Calendar,
    DollarSign,
    Edit,
    Eye,
    MapPin,
    MoreVertical,
    Plus,
    Search,
    Star,
    Users
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

// Mock tours data
const mockTours = [
    {
        id: "1",
        name: "Machu Picchu Sunrise Adventure",
        category: "Aventura",
        duration: "2 días",
        price: 450,
        maxParticipants: 15,
        rating: 4.9,
        bookings: 127,
        image: "🏔️",
        status: "active",
    },
    {
        id: "2",
        name: "Cusco City & Sacred Valley",
        category: "Cultural",
        duration: "1 día",
        price: 120,
        maxParticipants: 20,
        rating: 4.7,
        bookings: 89,
        image: "🏛️",
        status: "active",
    },
    {
        id: "3",
        name: "Rainbow Mountain Trek",
        category: "Trekking",
        duration: "1 día",
        price: 85,
        maxParticipants: 12,
        rating: 4.8,
        bookings: 156,
        image: "🌈",
        status: "active",
    },
    {
        id: "4",
        name: "Lake Titicaca Expedition",
        category: "Expedición",
        duration: "3 días",
        price: 380,
        maxParticipants: 10,
        rating: 4.6,
        bookings: 45,
        image: "🚣",
        status: "draft",
    },
]

export default function ToursPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [filter, setFilter] = useState("all")

    const filteredTours = mockTours.filter((tour) => {
        const matchesSearch = tour.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesFilter = filter === "all" || tour.status === filter
        return matchesSearch && matchesFilter
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gestión de Tours</h1>
                    <p className="text-muted-foreground">
                        Administra tu catálogo de tours y experiencias
                    </p>
                </div>
                <Link href="/tours/create">
                    <Button className="gap-2">
                        <Plus size={18} />
                        Nuevo Tour
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{mockTours.length}</p>
                                <p className="text-sm text-muted-foreground">Tours Totales</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <Users className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">417</p>
                                <p className="text-sm text-muted-foreground">Reservas Totales</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                                <Star className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">4.75</p>
                                <p className="text-sm text-muted-foreground">Rating Promedio</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                <DollarSign className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">S/ 124K</p>
                                <p className="text-sm text-muted-foreground">Ingresos YTD</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar tours..."
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
                    <option value="all">Todos</option>
                    <option value="active">Activos</option>
                    <option value="draft">Borradores</option>
                </select>
            </div>

            {/* Tours Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTours.map((tour) => (
                    <Card key={tour.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-5xl">
                            {tour.image}
                        </div>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${tour.status === "active"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-700"
                                        }`}>
                                        {tour.status === "active" ? "Activo" : "Borrador"}
                                    </span>
                                    <h3 className="font-semibold mt-1">{tour.name}</h3>
                                </div>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical size={16} />
                                </Button>
                            </div>

                            <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} />
                                    <span>{tour.category}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    <span>{tour.duration}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users size={14} />
                                    <span>Máx. {tour.maxParticipants} personas</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                <div>
                                    <p className="text-lg font-bold text-primary">S/ {tour.price}</p>
                                    <p className="text-xs text-muted-foreground">por persona</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                    <span className="font-medium">{tour.rating}</span>
                                    <span className="text-muted-foreground text-sm">({tour.bookings})</span>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                                <Button variant="outline" size="sm" className="flex-1 gap-1">
                                    <Eye size={14} />
                                    Ver
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1 gap-1">
                                    <Edit size={14} />
                                    Editar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
