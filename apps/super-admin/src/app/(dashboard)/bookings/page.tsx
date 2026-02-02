'use client';

import { useCallback, useEffect, useState } from 'react';

interface Booking {
    id: string;
    tour_id: string;
    tour_name: string;
    date: string;
    time: string;
    guests_count: number;
    total_amount: number;
    service_fee: number;
    status: 'pending' | 'confirmed' | 'assigned' | 'completed' | 'cancelled';
    payment_status: 'pending' | 'paid' | 'refunded';
    tourist: {
        id: string;
        name: string;
        email: string;
        phone: string;
    };
    agency?: {
        id: string;
        name: string;
    };
    guide?: {
        id: string;
        name: string;
        phone: string;
    };
    created_at: string;
}

interface Guide {
    id: string;
    name: string;
    phone: string;
    is_available: boolean;
    rating: number;
    agency_id?: string;
}

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [guides, setGuides] = useState<Guide[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'assigned'>('pending');

    // Load bookings
    const loadBookings = useCallback(async () => {
        try {
            const token = localStorage.getItem('superadmin_token');
            const response = await fetch(`/api/v1/bookings?status=${filter}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setBookings(data.items || data);
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
            // Mock data for demo
            setBookings([
                {
                    id: 'BK001',
                    tour_id: 'T1',
                    tour_name: 'Machu Picchu Sunrise',
                    date: '2026-01-25',
                    time: '05:30',
                    guests_count: 4,
                    total_amount: 528,
                    service_fee: 48,
                    status: 'pending',
                    payment_status: 'paid',
                    tourist: { id: 'U1', name: 'John Smith', email: 'john@email.com', phone: '+1 555 1234' },
                    agency: { id: 'A1', name: 'Cusco Adventures' },
                    created_at: new Date().toISOString(),
                },
                {
                    id: 'BK002',
                    tour_id: 'T2',
                    tour_name: 'Valle Sagrado Full Day',
                    date: '2026-01-26',
                    time: '08:00',
                    guests_count: 2,
                    total_amount: 264,
                    service_fee: 24,
                    status: 'pending',
                    payment_status: 'paid',
                    tourist: { id: 'U2', name: 'Maria García', email: 'maria@email.com', phone: '+51 999 8765' },
                    created_at: new Date().toISOString(),
                },
            ]);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    // Load available guides
    const loadGuides = async (agencyId?: string) => {
        try {
            const token = localStorage.getItem('superadmin_token');
            const url = agencyId
                ? `/api/v1/guides/available?agency_id=${agencyId}`
                : '/api/v1/guides/available';

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setGuides(data.items || data);
            }
        } catch (error) {
            // Mock guides
            setGuides([
                { id: 'G1', name: 'Carlos Quispe', phone: '+51 987 654 321', is_available: true, rating: 4.9 },
                { id: 'G2', name: 'Ana López', phone: '+51 912 345 678', is_available: true, rating: 4.8 },
                { id: 'G3', name: 'Pedro Huamán', phone: '+51 956 789 012', is_available: false, rating: 4.7 },
            ]);
        }
    };

    useEffect(() => {
        loadBookings();
        // Poll every 30 seconds
        const interval = setInterval(loadBookings, 30000);
        return () => clearInterval(interval);
    }, [loadBookings]);

    // Assign guide to booking
    const handleAssignGuide = async (guideId: string) => {
        if (!selectedBooking) return;

        try {
            const token = localStorage.getItem('superadmin_token');
            const response = await fetch(`/api/v1/bookings/${selectedBooking.id}/assign`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ guide_id: guideId }),
            });

            if (response.ok) {
                // Update local state
                setBookings(prev => prev.map(b =>
                    b.id === selectedBooking.id
                        ? { ...b, status: 'assigned', guide: guides.find(g => g.id === guideId) }
                        : b
                ));
                setShowAssignModal(false);
                setSelectedBooking(null);
                alert('✅ Guía asignado exitosamente. Se notificó al turista y al guía.');
            }
        } catch (error) {
            console.error('Error assigning guide:', error);
            alert('Error al asignar guía');
        }
    };

    const getStatusColor = (status: Booking['status']) => {
        switch (status) {
            case 'pending': return 'bg-yellow-900/30 text-yellow-400';
            case 'confirmed': return 'bg-blue-900/30 text-blue-400';
            case 'assigned': return 'bg-green-900/30 text-green-400';
            case 'completed': return 'bg-gray-700 text-gray-300';
            case 'cancelled': return 'bg-red-900/30 text-red-400';
            default: return 'bg-gray-700 text-gray-400';
        }
    };

    const getPaymentColor = (status: Booking['payment_status']) => {
        switch (status) {
            case 'paid': return 'text-green-400';
            case 'pending': return 'text-yellow-400';
            case 'refunded': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#020617]">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-white p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-cyan-400 font-mono">
                        📋 GESTIÓN DE RESERVAS
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Reservas de turistas - Pagos a Super Admin
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-800 rounded-lg p-1">
                        {['all', 'pending', 'assigned'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-4 py-2 rounded text-sm font-medium transition ${filter === f ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : 'Asignadas'}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={loadBookings}
                        className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
                    >
                        🔄
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                    <p className="text-gray-400 text-xs uppercase">Total Reservas</p>
                    <p className="text-2xl font-bold text-white">{bookings.length}</p>
                </div>
                <div className="bg-gray-900/50 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-gray-400 text-xs uppercase">Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-400">
                        {bookings.filter(b => b.status === 'pending').length}
                    </p>
                </div>
                <div className="bg-gray-900/50 border border-green-500/30 rounded-lg p-4">
                    <p className="text-gray-400 text-xs uppercase">Ingresos Hoy</p>
                    <p className="text-2xl font-bold text-green-400">
                        S/{bookings.reduce((sum, b) => sum + b.service_fee, 0)}
                    </p>
                </div>
                <div className="bg-gray-900/50 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-gray-400 text-xs uppercase">Total Procesado</p>
                    <p className="text-2xl font-bold text-blue-400">
                        S/{bookings.reduce((sum, b) => sum + b.total_amount, 0)}
                    </p>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-800/50">
                        <tr>
                            <th className="text-left p-4 text-xs text-gray-400 uppercase font-mono">Reserva</th>
                            <th className="text-left p-4 text-xs text-gray-400 uppercase font-mono">Tour</th>
                            <th className="text-left p-4 text-xs text-gray-400 uppercase font-mono">Turista</th>
                            <th className="text-left p-4 text-xs text-gray-400 uppercase font-mono">Fecha</th>
                            <th className="text-left p-4 text-xs text-gray-400 uppercase font-mono">Monto</th>
                            <th className="text-left p-4 text-xs text-gray-400 uppercase font-mono">Estado</th>
                            <th className="text-left p-4 text-xs text-gray-400 uppercase font-mono">Guía</th>
                            <th className="text-left p-4 text-xs text-gray-400 uppercase font-mono">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {bookings.map((booking) => (
                            <tr key={booking.id} className="hover:bg-gray-800/30 transition">
                                <td className="p-4">
                                    <p className="font-mono text-cyan-400">{booking.id}</p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(booking.created_at).toLocaleString()}
                                    </p>
                                </td>
                                <td className="p-4">
                                    <p className="font-medium">{booking.tour_name}</p>
                                    <p className="text-xs text-gray-400">👥 {booking.guests_count} personas</p>
                                    {booking.agency && (
                                        <p className="text-xs text-blue-400">🏢 {booking.agency.name}</p>
                                    )}
                                </td>
                                <td className="p-4">
                                    <p className="font-medium">{booking.tourist.name}</p>
                                    <p className="text-xs text-gray-400">{booking.tourist.email}</p>
                                    <p className="text-xs text-gray-400">{booking.tourist.phone}</p>
                                </td>
                                <td className="p-4">
                                    <p className="font-medium">{booking.date}</p>
                                    <p className="text-xs text-gray-400">{booking.time}</p>
                                </td>
                                <td className="p-4">
                                    <p className="font-bold text-lg">S/{booking.total_amount}</p>
                                    <p className="text-xs text-green-400">
                                        Comisión: S/{booking.service_fee}
                                    </p>
                                    <p className={`text-xs ${getPaymentColor(booking.payment_status)}`}>
                                        {booking.payment_status === 'paid' ? '✓ Pagado' : '⏳ Pendiente'}
                                    </p>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(booking.status)}`}>
                                        {booking.status === 'pending' ? '⏳ Pendiente' :
                                            booking.status === 'assigned' ? '✓ Asignado' :
                                                booking.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {booking.guide ? (
                                        <div>
                                            <p className="font-medium text-green-400">{booking.guide.name}</p>
                                            <p className="text-xs text-gray-400">{booking.guide.phone}</p>
                                        </div>
                                    ) : (
                                        <span className="text-gray-500 italic">Sin asignar</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    {!booking.guide && booking.payment_status === 'paid' && (
                                        <button
                                            onClick={() => {
                                                setSelectedBooking(booking);
                                                loadGuides(booking.agency?.id);
                                                setShowAssignModal(true);
                                            }}
                                            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg transition"
                                        >
                                            Asignar Guía
                                        </button>
                                    )}
                                    {booking.guide && (
                                        <button
                                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition"
                                        >
                                            Ver Detalles
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Assign Guide Modal */}
            {showAssignModal && selectedBooking && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-lg w-full">
                        <h3 className="text-lg font-bold text-cyan-400 mb-4">
                            🎯 Asignar Guía
                        </h3>
                        <div className="bg-gray-800 rounded-lg p-4 mb-4">
                            <p className="font-medium">{selectedBooking.tour_name}</p>
                            <p className="text-sm text-gray-400">
                                {selectedBooking.date} • {selectedBooking.time} • {selectedBooking.guests_count} personas
                            </p>
                            <p className="text-sm text-gray-400 mt-2">
                                Turista: {selectedBooking.tourist.name}
                            </p>
                        </div>

                        <p className="text-sm text-gray-400 mb-3">Guías Disponibles:</p>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {guides.filter(g => g.is_available).map((guide) => (
                                <button
                                    key={guide.id}
                                    onClick={() => handleAssignGuide(guide.id)}
                                    className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition flex items-center justify-between"
                                >
                                    <div>
                                        <p className="font-medium">{guide.name}</p>
                                        <p className="text-xs text-gray-400">{guide.phone}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-yellow-400">⭐ {guide.rating}</p>
                                        <span className="text-xs text-green-400">Disponible</span>
                                    </div>
                                </button>
                            ))}
                            {guides.filter(g => g.is_available).length === 0 && (
                                <p className="text-gray-500 text-center py-4">
                                    No hay guías disponibles
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setSelectedBooking(null);
                                }}
                                className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
