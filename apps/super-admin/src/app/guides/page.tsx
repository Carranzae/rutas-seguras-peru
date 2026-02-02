'use client';

import { adminService, Guide } from '@/lib/admin';
import { getAuthToken } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function GuidesPage() {
    const router = useRouter();
    const [guides, setGuides] = useState<Guide[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);

    // Load guides wrapped in callback
    const loadGuides = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await adminService.getGuides();
            setGuides(data);
        } catch (err: unknown) {
            console.error('Error loading guides:', err);
            const message = err instanceof Error ? err.message : 'Error al cargar guías';
            setError(message);
            setGuides([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!getAuthToken()) {
            router.push('/login');
            return;
        }
        loadGuides();
    }, [loadGuides, router]);

    // Removed redundant useEffect on filter change (client-side filtering)

    const handleVerify = async (id: string, approved: boolean) => {
        const action = approved ? 'verificar' : 'rechazar';
        if (!confirm(`¿Estás seguro que deseas ${action} este guía?`)) {
            return;
        }

        setProcessingId(id);
        try {
            await adminService.verifyGuide(id, approved, approved ? undefined : 'No cumple requisitos de verificación');
            await loadGuides();
            alert(approved ? '✅ Guía verificado exitosamente' : '❌ Guía rechazado');
        } catch (err: unknown) {
            console.error('Error verifying guide:', err);
            const message = err instanceof Error ? err.message : 'Error desconocido';
            alert(`Error al ${action} el guía: ${message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredGuides = guides.filter(g => {
        if (filter === 'all') return true;
        if (filter === 'pending') return g.verification_status.toLowerCase().includes('pending');
        if (filter === 'verified') return g.verification_status.toLowerCase() === 'verified';
        if (filter === 'rejected') return g.verification_status.toLowerCase() === 'rejected';
        return true;
    });

    const statusLabels: Record<string, { label: string; color: string }> = {
        verified: { label: 'Verificado', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
        pending_documents: { label: 'Documentos Pendientes', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
        pending_biometric: { label: 'Biometría Pendiente', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
        pending_review: { label: 'En Revisión', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
        rejected: { label: 'Rechazado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    };

    return (
        <div className="min-h-screen bg-[#0a0f1c]">
            <header className="bg-[#101622] border-b border-white/10 px-8 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-gray-400 hover:text-white">← Volver</Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white">🪪 Gestión de Guías</h1>
                            <p className="text-gray-400 text-sm">Verificación DIRCETUR y biométrica</p>
                        </div>
                    </div>
                    <button onClick={loadGuides} className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30">
                        🔄 Actualizar
                    </button>
                </div>
            </header>

            <div className="p-8">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-[#1a2235] rounded-xl p-4 border border-white/10">
                        <p className="text-3xl font-bold text-white">{guides.length}</p>
                        <p className="text-gray-400 text-sm">Total Guías</p>
                    </div>
                    <div className="bg-[#1a2235] rounded-xl p-4 border border-green-500/30">
                        <p className="text-3xl font-bold text-green-400">
                            {guides.filter(g => g.verification_status.toLowerCase() === 'verified').length}
                        </p>
                        <p className="text-gray-400 text-sm">Verificados</p>
                    </div>
                    <div className="bg-[#1a2235] rounded-xl p-4 border border-yellow-500/30">
                        <p className="text-3xl font-bold text-yellow-400">
                            {guides.filter(g => g.verification_status.toLowerCase().includes('pending')).length}
                        </p>
                        <p className="text-gray-400 text-sm">Pendientes</p>
                    </div>
                    <div className="bg-[#1a2235] rounded-xl p-4 border border-blue-500/30">
                        <p className="text-3xl font-bold text-blue-400">
                            {guides.filter(g => g.is_active).length}
                        </p>
                        <p className="text-gray-400 text-sm">Activos</p>
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
                            {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : f === 'verified' ? 'Verificados' : 'Rechazados'}
                        </button>
                    ))}
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400">
                        ⚠️ {error}
                    </div>
                )}

                {/* Guides List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400">Cargando guías...</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredGuides.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 bg-[#1a2235] rounded-2xl border border-white/10">
                                No hay guías para mostrar
                            </div>
                        ) : (
                            filteredGuides.map(guide => (
                                <div key={guide.id} className="bg-[#1a2235] rounded-2xl p-6 border border-white/10">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                <span className="text-2xl">👤</span>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">{guide.user?.full_name || 'Sin nombre'}</h3>
                                                <p className="text-gray-400">{guide.user?.email || 'Sin email'}</p>
                                                <p className="text-gray-500 text-sm">{guide.user?.phone || 'Sin teléfono'}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm border ${statusLabels[guide.verification_status.toLowerCase()]?.color || statusLabels.pending_review.color}`}>
                                            {statusLabels[guide.verification_status.toLowerCase()]?.label || guide.verification_status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
                                        <div>
                                            <p className="text-gray-400 text-sm">DIRCETUR ID</p>
                                            <p className="text-white font-mono">{guide.dircetur_id || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Idiomas</p>
                                            <p className="text-white">{Array.isArray(guide.specialty) ? guide.specialty.join(', ') : guide.specialty || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Experiencia</p>
                                            <p className="text-white">{guide.experience_years || 0} años</p>
                                        </div>
                                        <div className="flex gap-2 justify-end items-center">
                                            <button
                                                onClick={() => setSelectedGuide(guide)}
                                                className="px-4 py-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10"
                                            >
                                                👁️ Ver
                                            </button>
                                            {guide.verification_status.toLowerCase().includes('pending') && (
                                                <>
                                                    <button
                                                        onClick={() => handleVerify(guide.id, true)}
                                                        disabled={processingId === guide.id}
                                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        {processingId === guide.id ? '...' : '✅ Verificar'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleVerify(guide.id, false)}
                                                        disabled={processingId === guide.id}
                                                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 disabled:opacity-50"
                                                    >
                                                        {processingId === guide.id ? '...' : '❌'}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Guide Detail Modal */}
            {selectedGuide && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setSelectedGuide(null)}>
                    <div className="bg-[#1a2235] rounded-2xl p-8 max-w-lg w-full mx-4 border border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <span className="text-2xl">👤</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{selectedGuide.user?.full_name}</h2>
                                    <p className="text-gray-400">{selectedGuide.user?.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedGuide(null)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-gray-400 text-sm">DIRCETUR ID</p>
                                    <p className="text-white font-mono">{selectedGuide.dircetur_id || 'Pendiente'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Estado</p>
                                    <span className={`px-3 py-1 rounded-full text-sm border ${statusLabels[selectedGuide.verification_status.toLowerCase()]?.color}`}>
                                        {statusLabels[selectedGuide.verification_status.toLowerCase()]?.label}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <p className="text-gray-400 text-sm">Teléfono</p>
                                <p className="text-white">{selectedGuide.user?.phone || 'No registrado'}</p>
                            </div>

                            <div>
                                <p className="text-gray-400 text-sm">Experiencia</p>
                                <p className="text-white">{selectedGuide.experience_years || 0} años</p>
                            </div>

                            <div>
                                <p className="text-gray-400 text-sm">Estado Activo</p>
                                <p className={selectedGuide.is_active ? 'text-green-400' : 'text-red-400'}>
                                    {selectedGuide.is_active ? '✅ Activo' : '⚠️ Inactivo'}
                                </p>
                            </div>
                        </div>

                        {selectedGuide.verification_status.toLowerCase().includes('pending') && (
                            <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
                                <button
                                    onClick={() => { handleVerify(selectedGuide.id, true); setSelectedGuide(null); }}
                                    className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium"
                                >
                                    ✅ Verificar Guía
                                </button>
                                <button
                                    onClick={() => { handleVerify(selectedGuide.id, false); setSelectedGuide(null); }}
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
