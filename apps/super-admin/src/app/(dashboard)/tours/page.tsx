'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Tour {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    duration_hours: number;
    status: string;
    agency_name?: string;
    max_participants?: number;
    difficulty_level?: string;
}

export default function ToursPage() {
    const [tours, setTours] = useState<Tour[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchTours = async () => {
        try {
            const token = localStorage.getItem('superadmin_token');
            const response = await fetch('/api/v1/tours?per_page=50', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setTours(data.items || []);
            } else {
                console.error('Failed to fetch tours');
            }
        } catch (error) {
            console.error('Error fetching tours:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTours();
    }, []);

    const handleDelete = async (tourId: string) => {
        if (!confirm('¿Estás seguro de eliminar este tour?')) return;

        try {
            const token = localStorage.getItem('superadmin_token');
            const response = await fetch(`/api/v1/tours/${tourId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                toast.success('Tour eliminado');
                setTours(prev => prev.filter(t => t.id !== tourId));
            } else {
                toast.error('Error al eliminar tour');
            }
        } catch (error) {
            toast.error('Error de conexión');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            published: 'bg-green-900/50 text-green-400 border-green-500/50',
            draft: 'bg-yellow-900/50 text-yellow-400 border-yellow-500/50',
            cancelled: 'bg-red-900/50 text-red-400 border-red-500/50',
        };
        return styles[status] || 'bg-gray-900/50 text-gray-400 border-gray-500/50';
    };

    const getDifficultyEmoji = (level: string) => {
        const map: Record<string, string> = {
            easy: '🌱',
            moderate: '🏃',
            challenging: '🏔️',
            extreme: '⚡',
        };
        return map[level] || '⭐';
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Gestión de Tours</h1>
                    <p className="text-gray-400">Administra el catálogo del marketplace ({tours.length} tours)</p>
                </div>
                <Link
                    href="/tours/new"
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                >
                    <span>+</span> Nuevo Tour
                </Link>
            </div>

            {tours.length === 0 ? (
                <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
                    <div className="text-6xl mb-4">🏔️</div>
                    <h3 className="text-xl font-bold text-white mb-2">No hay tours registrados</h3>
                    <p className="text-gray-400 mb-6">Crea tu primer tour para comenzar a vender en el marketplace</p>
                    <Link
                        href="/tours/new"
                        className="inline-block bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        🚀 Crear Primer Tour
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tours.map((tour) => (
                        <div key={tour.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-cyan-500/50 transition-all group">
                            <div className="h-40 bg-slate-700 rounded-lg mb-4 relative overflow-hidden">
                                <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-mono border ${getStatusBadge(tour.status)}`}>
                                    {tour.status.toUpperCase()}
                                </div>
                                <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-lg">
                                    {getDifficultyEmoji(tour.difficulty_level || 'moderate')}
                                </div>
                                <div className="flex items-center justify-center h-full text-4xl">🏔️</div>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors truncate">
                                {tour.name}
                            </h3>
                            <p className="text-sm text-gray-400 mb-4 truncate">{tour.agency_name || 'Agencia propia'}</p>

                            <div className="flex justify-between items-center text-sm text-gray-300 mb-4">
                                <div className="flex items-center gap-1">
                                    <span>💰 {tour.currency} {tour.price}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span>⏱️ {tour.duration_hours}h</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span>👥 {tour.max_participants || 10}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => router.push(`/tours/${tour.id}/edit`)}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm transition-colors"
                                >
                                    ✏️ Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(tour.id)}
                                    className="bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-2 rounded-lg text-sm transition-colors"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

