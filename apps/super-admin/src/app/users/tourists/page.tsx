'use client';

import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface User {
    id: string;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
    is_active: boolean;
}

export default function TouristsPage() {
    const [tourists, setTourists] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');

    const fetchTourists = async () => {
        setLoading(true);
        try {
            const data = await api.getUsers('tourist', page, search);
            setTourists(data.items);
            setTotalPages(Math.ceil(data.total / data.per_page));
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar turistas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTourists();
    }, [page, search]);

    return (
        <div className="min-h-screen bg-[#101622] text-white p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#00f2ff] font-telemetry">GESTIÓN DE TURISTAS</h1>
                        <p className="text-gray-400 text-sm">Base de datos nacional de visitantes</p>
                    </div>
                    <Link href="/dashboard">
                        <Button variant="outline" className="border-[#00f2ff] text-[#00f2ff] hover:bg-[#00f2ff]/10">
                            VOLVER AL CENTRO DE MANDO
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="glass-panel p-4 flex gap-4">
                    <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        className="bg-[#0f172a] border border-gray-700 rounded px-4 py-2 w-full max-w-md focus:outline-none focus:border-[#00f2ff] text-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Table */}
                <div className="glass-panel overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-[#0f172a] text-[#00f2ff] font-telemetry text-xs uppercase">
                            <tr>
                                <th className="p-4">Usuario</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4">Registro</th>
                                <th className="p-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400 animate-pulse">
                                        Cargando datos del servidor...
                                    </td>
                                </tr>
                            ) : tourists.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400">
                                        No se encontraron turistas registrados.
                                    </td>
                                </tr>
                            ) : (
                                tourists.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#00f2ff]/20 flex items-center justify-center text-[#00f2ff]">
                                                    👤
                                                </div>
                                                {user.full_name || 'Sin nombre'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-300">{user.email}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-mono border ${user.is_active
                                                    ? 'bg-green-500/10 text-green-400 border-green-500/30'
                                                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                                                }`}>
                                                {user.is_active ? 'ACTIVO' : 'INACTIVO'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-400 text-sm">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <Button size="sm" variant="ghost" className="text-[#00f2ff] hover:text-white hover:bg-[#00f2ff]/20">
                                                DETALLES
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>Página {page} de {totalPages}</span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
