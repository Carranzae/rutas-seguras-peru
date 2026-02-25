'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState } from 'react';

interface Booking {
    id: string;
    tour_name: string;
    tourist_name: string;
    date: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    guide_name?: string;
    guide_id?: string;
    amount: number;
}

interface Guide {
    id: string;
    name: string;
    rating: number;
    status: 'available' | 'busy';
}

export default function ReservationsPage() {
    const [bookings, setBookings] = useState<Booking[]>([
        {
            id: 'BK-7829',
            tour_name: 'Machu Picchu Sunrise',
            tourist_name: 'Juan Pérez',
            date: '2026-01-25',
            status: 'confirmed',
            amount: 120,
            guide_name: undefined
        },
        {
            id: 'BK-7830',
            tour_name: 'Sacred Valley Express',
            tourist_name: 'Maria Garcia',
            date: '2026-01-26',
            status: 'pending',
            amount: 85,
            guide_name: 'Carlos Quispe'
        }
    ]);

    const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
    const [guides] = useState<Guide[]>([
        { id: 'g1', name: 'Carlos Quispe', rating: 4.9, status: 'available' },
        { id: 'g2', name: 'Ana Mendoza', rating: 4.8, status: 'available' },
        { id: 'g3', name: 'Luis Torres', rating: 4.7, status: 'busy' }
    ]);

    const handleAssignGuide = (bookingId: string, guideId: string) => {
        const guide = guides.find(g => g.id === guideId);
        setBookings(bookings.map(b =>
            b.id === bookingId ? { ...b, guide_id: guideId, guide_name: guide?.name } : b
        ));
        setSelectedBooking(null);
        // Here we would call the API to update assignment and notify tourist
        alert(`Guía ${guide?.name} asignado a reserva ${bookingId}. Notificando turista...`);
    };

    return (
        <DashboardLayout title="Reservas y Asignaciones" subtitle="Gestiona las reservas y designa guías turísticos">
            <div className="p-8">
                <div className="bg-[#1a2235] rounded-xl border border-white/10 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-[#101622] text-gray-400 text-sm border-b border-white/10">
                            <tr>
                                <th className="p-4 font-medium uppercase tracking-wider text-xs">ID Reserva</th>
                                <th className="p-4 font-medium uppercase tracking-wider text-xs">Tour</th>
                                <th className="p-4 font-medium uppercase tracking-wider text-xs">Turista</th>
                                <th className="p-4 font-medium uppercase tracking-wider text-xs">Fecha</th>
                                <th className="p-4 font-medium uppercase tracking-wider text-xs">Estado</th>
                                <th className="p-4 font-medium uppercase tracking-wider text-xs">Guía Asignado</th>
                                <th className="p-4 font-medium uppercase tracking-wider text-xs">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white">
                            {bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-mono text-cyan-400">{booking.id}</td>
                                    <td className="p-4">{booking.tour_name}</td>
                                    <td className="p-4">{booking.tourist_name}</td>
                                    <td className="p-4">{booking.date}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${booking.status === 'confirmed' ? 'bg-green-900 text-green-400 border border-green-800' :
                                            booking.status === 'pending' ? 'bg-yellow-900 text-yellow-400 border border-yellow-800' :
                                                'bg-gray-800 text-gray-400'
                                            }`}>
                                            {booking.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {selectedBooking === booking.id ? (
                                            <select
                                                className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-cyan-500"
                                                onChange={(e) => handleAssignGuide(booking.id, e.target.value)}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Seleccionar...</option>
                                                {guides.map(g => (
                                                    <option key={g.id} value={g.id} disabled={g.status === 'busy'}>
                                                        {g.name} ({g.status === 'busy' ? 'Ocupado' : 'Disp.'})
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            booking.guide_name ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">🎒 {booking.guide_name}</span>
                                                    <button onClick={() => setSelectedBooking(booking.id)} className="text-xs text-cyan-400 hover:underline">Cambiar</button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setSelectedBooking(booking.id)}
                                                    className="text-sm text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                                                >
                                                    ⚠️ Sin asignar
                                                </button>
                                            )
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <button className="text-gray-400 hover:text-white px-2">Ver</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
