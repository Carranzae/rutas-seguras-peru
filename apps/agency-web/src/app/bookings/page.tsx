"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Booking, Guide } from "@/lib/services"
import {
    Calendar,
    Check,
    Clock,
    DollarSign,
    Search,
    Users,
    X
} from "lucide-react"
import { useState } from "react"

// Mock data for initial render
const mockBookings: Booking[] = [
    {
        id: "1",
        tour_id: "t1",
        tour_title: "Machu Picchu Sunrise Adventure",
        user_id: "u1",
        user_name: "John Smith",
        user_email: "john@example.com",
        guide_id: undefined,
        guide_name: undefined,
        scheduled_date: "2026-02-05T06:00:00Z",
        num_participants: 4,
        total_amount: 1800,
        status: "pending",
        payment_status: "completed",
        special_requests: "Vegetarian meals please",
        created_at: "2026-02-01T10:00:00Z"
    },
    {
        id: "2",
        tour_id: "t2",
        tour_title: "Cusco City Tour",
        user_id: "u2",
        user_name: "María García",
        user_email: "maria@example.com",
        guide_id: "g1",
        guide_name: "Carlos Mendoza",
        scheduled_date: "2026-02-03T09:00:00Z",
        num_participants: 2,
        total_amount: 240,
        status: "confirmed",
        payment_status: "completed",
        created_at: "2026-01-30T14:00:00Z"
    },
    {
        id: "3",
        tour_id: "t3",
        tour_title: "Rainbow Mountain Trek",
        user_id: "u3",
        user_name: "Peter Johnson",
        user_email: "peter@example.com",
        guide_id: "g2",
        guide_name: "Ana Torres",
        scheduled_date: "2026-02-02T05:00:00Z",
        num_participants: 1,
        total_amount: 85,
        status: "completed",
        payment_status: "completed",
        created_at: "2026-01-28T08:00:00Z"
    },
]

const mockGuides: Guide[] = [
    { id: "g1", user_id: "u1", name: "Carlos Mendoza", email: "carlos@example.com", languages: ["es", "en"], specialties: ["hiking"], rating: 4.9, total_tours: 150, status: "active", is_dircetur_verified: true, is_biometric_verified: true },
    { id: "g2", user_id: "u2", name: "Ana Torres", email: "ana@example.com", languages: ["es", "en", "pt"], specialties: ["historical"], rating: 4.8, total_tours: 120, status: "active", is_dircetur_verified: true, is_biometric_verified: true },
    { id: "g3", user_id: "u3", name: "Luis Paredes", email: "luis@example.com", languages: ["es", "en"], specialties: ["adventure"], rating: 4.7, total_tours: 85, status: "active", is_dircetur_verified: true, is_biometric_verified: true },
]

const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-blue-100 text-blue-700",
}

const statusLabels = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    cancelled: "Cancelado",
    completed: "Completado",
}

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>(mockBookings)
    const [guides, setGuides] = useState<Guide[]>(mockGuides)
    const [loading, setLoading] = useState(false)
    const [filter, setFilter] = useState<string>("all")
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
    const [showAssignModal, setShowAssignModal] = useState(false)

    // In production, fetch from API
    // useEffect(() => { 
    //     bookingsService.list().then(res => setBookings(res.items))
    //     guidesService.list().then(res => setGuides(res.items))
    // }, [])

    const filteredBookings = bookings.filter(b => {
        const matchesFilter = filter === "all" || b.status === filter
        const matchesSearch = b.tour_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.user_name.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesFilter && matchesSearch
    })

    const pendingCount = bookings.filter(b => b.status === "pending").length
    const confirmedCount = bookings.filter(b => b.status === "confirmed").length
    const completedCount = bookings.filter(b => b.status === "completed").length

    const handleConfirm = async (bookingId: string, guideId: string) => {
        try {
            // await bookingsService.confirm(bookingId, guideId)
            setBookings(prev => prev.map(b =>
                b.id === bookingId
                    ? { ...b, status: "confirmed" as const, guide_id: guideId, guide_name: guides.find(g => g.id === guideId)?.name }
                    : b
            ))
            setShowAssignModal(false)
            setSelectedBooking(null)
        } catch (err) {
            console.error(err)
        }
    }

    const handleCancel = async (bookingId: string) => {
        if (!confirm("¿Estás seguro de cancelar esta reserva?")) return
        try {
            // await bookingsService.cancel(bookingId, "Cancelled by agency")
            setBookings(prev => prev.map(b =>
                b.id === bookingId ? { ...b, status: "cancelled" as const } : b
            ))
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Reservas</h1>
                    <p className="text-muted-foreground">Gestiona las reservas de tus tours</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-yellow-500/10">
                                <Clock className="w-5 h-5 text-yellow-500" />
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
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <Check className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{confirmedCount}</p>
                                <p className="text-sm text-muted-foreground">Confirmadas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Calendar className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{completedCount}</p>
                                <p className="text-sm text-muted-foreground">Completadas</p>
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
                                <p className="text-2xl font-bold">S/ {bookings.reduce((sum, b) => sum + b.total_amount, 0).toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">Total Reservas</p>
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
                        placeholder="Buscar por tour o cliente..."
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
                    <option value="pending">Pendientes</option>
                    <option value="confirmed">Confirmadas</option>
                    <option value="completed">Completadas</option>
                    <option value="cancelled">Canceladas</option>
                </select>
            </div>

            {/* Bookings List */}
            <Card>
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left p-4 font-medium">Tour</th>
                                <th className="text-left p-4 font-medium">Cliente</th>
                                <th className="text-left p-4 font-medium">Fecha</th>
                                <th className="text-left p-4 font-medium">Personas</th>
                                <th className="text-left p-4 font-medium">Total</th>
                                <th className="text-left p-4 font-medium">Guía</th>
                                <th className="text-left p-4 font-medium">Estado</th>
                                <th className="text-left p-4 font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.map((booking) => (
                                <tr key={booking.id} className="border-t hover:bg-muted/30">
                                    <td className="p-4">
                                        <p className="font-medium">{booking.tour_title}</p>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-medium">{booking.user_name}</p>
                                        <p className="text-sm text-muted-foreground">{booking.user_email}</p>
                                    </td>
                                    <td className="p-4">
                                        {new Date(booking.scheduled_date).toLocaleDateString("es-PE", {
                                            weekday: "short",
                                            day: "numeric",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        })}
                                    </td>
                                    <td className="p-4">
                                        <span className="flex items-center gap-1">
                                            <Users size={14} /> {booking.num_participants}
                                        </span>
                                    </td>
                                    <td className="p-4 font-medium">
                                        S/ {booking.total_amount.toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        {booking.guide_name || (
                                            <span className="text-muted-foreground italic">Sin asignar</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                                            {statusLabels[booking.status]}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {booking.status === "pending" && (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => { setSelectedBooking(booking); setShowAssignModal(true) }}
                                                >
                                                    Asignar Guía
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleCancel(booking.id)}
                                                >
                                                    <X size={16} />
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Assign Guide Modal */}
            {showAssignModal && selectedBooking && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Asignar Guía</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Selecciona un guía para: <strong>{selectedBooking.tour_title}</strong>
                            </p>
                            <p className="text-sm">
                                Fecha: {new Date(selectedBooking.scheduled_date).toLocaleDateString("es-PE")}
                            </p>

                            <div className="space-y-2">
                                {guides.filter(g => g.status === "active").map(guide => (
                                    <button
                                        key={guide.id}
                                        onClick={() => handleConfirm(selectedBooking.id, guide.id)}
                                        className="w-full p-3 border rounded-lg hover:bg-muted/50 text-left flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="font-medium">{guide.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {guide.languages.join(", ")} • ★ {guide.rating}
                                            </p>
                                        </div>
                                        <Check className="w-5 h-5 text-green-500 opacity-0 group-focus:opacity-100" />
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => { setShowAssignModal(false); setSelectedBooking(null) }}>
                                    Cancelar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
