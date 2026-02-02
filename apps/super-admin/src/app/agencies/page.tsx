'use client';

import { adminService, Agency } from '@/lib/admin';
import { getAuthToken } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function AgenciesPage() {
    const router = useRouter();
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);

    // Load Agencies wrapped in callback
    const loadAgencies = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await adminService.getAgencies();
            setAgencies(data);
        } catch (err: unknown) {
            console.error('Error loading agencies:', err);
            const message = err instanceof Error ? err.message : 'Error al cargar agencias';
            setError(message);
            setAgencies([]);
        } finally {
            setLoading(false);
        }
    }, []); // Empty deps as adminService is static/imported

    useEffect(() => {
        if (!getAuthToken()) {
            router.push('/login');
            return;
        }
        loadAgencies();
    }, [loadAgencies, router]);

    // Reload when filter changes - logic moved to render filter
    // We don't need to reload from API on filter change if we filter client side
    // If we want server side filter, we would update loadAgencies deps.
    // Given the previous code, it seemed to just re-fetch all. Let's keep it simple.

    const handleVerify = async (id: string, approved: boolean) => {
        const action = approved ? 'aprobar' : 'rechazar';
        if (!confirm(`¿Estás seguro que deseas ${action} esta agencia?`)) {
            return;
        }

        setProcessingId(id);
        try {
            await adminService.verifyAgency(id, approved, approved ? undefined : 'Documentos incompletos o no cumplen requisitos');
            await loadAgencies();
            alert(approved ? '✅ Agencia aprobada exitosamente' : '❌ Agencia rechazada');
        } catch (err: unknown) {
            console.error('Error verifying agency:', err);
            const message = err instanceof Error ? err.message : 'Error desconocido';
            alert(`Error al ${action} la agencia: ${message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredAgencies = agencies.filter(a => {
        if (filter === 'all') return true;
        return a.status.toLowerCase() === filter;
    });

    const statusColors: Record<string, string> = {
        verified: 'bg-green-500/20 text-green-400 border-green-500/30',
        pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
        suspended: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };

    return (
        <div className="min-h-screen bg-[#0a0f1c]">
            {/* Header */}
            <header className="bg-[#101622] border-b border-white/10 px-8 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-gray-400 hover:text-white">
                            ← Volver
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white">🏢 Gestión de Agencias</h1>
                            <p className="text-gray-400 text-sm">Verificar y administrar agencias de turismo</p>
                        </div>
                    </div>
                    <button
                        onClick={loadAgencies}
                        className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                    >
                        🔄 Actualizar
                    </button>
                </div>
            </header>

            <div className="p-8">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-[#1a2235] rounded-xl p-4 border border-white/10">
                        <p className="text-3xl font-bold text-white">{agencies.length}</p>
                        <p className="text-gray-400 text-sm">Total Agencias</p>
                    </div>
                    <div className="bg-[#1a2235] rounded-xl p-4 border border-green-500/30">
                        <p className="text-3xl font-bold text-green-400">
                            {agencies.filter(a => a.status.toLowerCase() === 'verified').length}
                        </p>
                        <p className="text-gray-400 text-sm">Verificadas</p>
                    </div>
                    <div className="bg-[#1a2235] rounded-xl p-4 border border-yellow-500/30">
                        <p className="text-3xl font-bold text-yellow-400">
                            {agencies.filter(a => a.status.toLowerCase() === 'pending').length}
                        </p>
                        <p className="text-gray-400 text-sm">Pendientes</p>
                    </div>
                    <div className="bg-[#1a2235] rounded-xl p-4 border border-red-500/30">
                        <p className="text-3xl font-bold text-red-400">
                            {agencies.filter(a => a.status.toLowerCase() === 'rejected').length}
                        </p>
                        <p className="text-gray-400 text-sm">Rechazadas</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6">
                    {['all', 'pending', 'verified', 'rejected'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as 'all' | 'pending' | 'verified' | 'rejected')}
                            className={`px-4 py-2 rounded-lg transition-colors ${filter === f
                                ? 'bg-blue-500 text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : f === 'verified' ? 'Verificadas' : 'Rechazadas'}
                        </button>
                    ))}
                </div>

                {/* Table */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400">Cargando agencias...</p>
                    </div>
                ) : (
                    <div className="bg-[#1a2235] rounded-2xl border border-white/10 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="text-left px-6 py-4 text-gray-400 font-medium">Agencia</th>
                                    <th className="text-left px-6 py-4 text-gray-400 font-medium">RUC</th>
                                    <th className="text-left px-6 py-4 text-gray-400 font-medium">Ubicación</th>
                                    <th className="text-left px-6 py-4 text-gray-400 font-medium">Estado</th>
                                    <th className="text-left px-6 py-4 text-gray-400 font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAgencies.map(agency => (
                                    <tr key={agency.id} className="border-t border-white/5 hover:bg-white/5">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-white font-medium">{agency.business_name}</p>
                                                <p className="text-gray-400 text-sm">{agency.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300 font-mono">{agency.ruc}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-gray-300">{agency.city}</p>
                                            <p className="text-gray-500 text-sm">{agency.region}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-sm border ${statusColors[agency.status.toLowerCase()] || statusColors.pending}`}>
                                                {agency.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {agency.status.toLowerCase() === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleVerify(agency.id, true)}
                                                            disabled={processingId === agency.id}
                                                            className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 disabled:opacity-50"
                                                        >
                                                            {processingId === agency.id ? '...' : '✅ Aprobar'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleVerify(agency.id, false)}
                                                            disabled={processingId === agency.id}
                                                            className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 disabled:opacity-50"
                                                        >
                                                            {processingId === agency.id ? '...' : '❌ Rechazar'}
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => setSelectedAgency(agency)}
                                                    className="px-3 py-1 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10"
                                                >
                                                    👁️ Ver
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredAgencies.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                                {error ? `Error: ${error}` : 'No hay agencias para mostrar'}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Agency Detail Modal */}
            {selectedAgency && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setSelectedAgency(null)}>
                    <div className="bg-[#1a2235] rounded-2xl p-8 max-w-lg w-full mx-4 border border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-2xl font-bold text-white">{selectedAgency.business_name}</h2>
                            <button onClick={() => setSelectedAgency(null)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-gray-400 text-sm">RUC</p>
                                    <p className="text-white font-mono">{selectedAgency.ruc}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Estado</p>
                                    <span className={`px-3 py-1 rounded-full text-sm border ${statusColors[selectedAgency.status.toLowerCase()]}`}>
                                        {selectedAgency.status}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <p className="text-gray-400 text-sm">Email</p>
                                <p className="text-white">{selectedAgency.email}</p>
                            </div>

                            <div>
                                <p className="text-gray-400 text-sm">Teléfono</p>
                                <p className="text-white">{selectedAgency.phone || 'No registrado'}</p>
                            </div>

                            <div>
                                <p className="text-gray-400 text-sm">Ubicación</p>
                                <p className="text-white">{selectedAgency.city}, {selectedAgency.region}</p>
                            </div>

                            <div>
                                <p className="text-gray-400 text-sm">Fecha de Registro</p>
                                <p className="text-white">{new Date(selectedAgency.created_at).toLocaleDateString('es-PE')}</p>
                            </div>
                        </div>

                        {selectedAgency.status.toLowerCase() === 'pending' && (
                            <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
                                <button
                                    onClick={() => { handleVerify(selectedAgency.id, true); setSelectedAgency(null); }}
                                    className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium"
                                >
                                    ✅ Aprobar Agencia
                                </button>
                                <button
                                    onClick={() => { handleVerify(selectedAgency.id, false); setSelectedAgency(null); }}
                                    className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-medium"
                                >
                                    ❌ Rechazar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
