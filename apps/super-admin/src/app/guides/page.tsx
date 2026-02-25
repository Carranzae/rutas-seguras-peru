'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminService, Guide } from '@/lib/admin';
import { getAuthToken } from '@/lib/api';
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

    // Ghoscloud Verification States
    const [ghoscloudData, setGhoscloudData] = useState<any>(null);
    const [verifyingBackground, setVerifyingBackground] = useState(false);
    const [docNumberOverride, setDocNumberOverride] = useState('');

    const handleGhoscloudVerification = async (dni: string) => {
        setVerifyingBackground(true);
        setGhoscloudData(null);
        try {
            const actualDni = docNumberOverride.trim() || dni;
            const result = await adminService.verifyBackground(actualDni, 'DNI');
            setGhoscloudData(result.data || result);
        } catch (err: any) {
            console.error(err);
            setGhoscloudData({ error: err.message || 'Error consultando Ghoscloud' });
        } finally {
            setVerifyingBackground(false);
        }
    };

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
        <DashboardLayout title="Gestión de Guías" subtitle="Verificación DIRCETUR y biométrica">
            <div className="flex justify-end px-8 pt-6">
                <button onClick={loadGuides} className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 font-medium">
                    🔄 Actualizar Datos
                </button>
            </div>

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
                                                <h3 className="text-xl font-bold text-white">{guide.full_name || 'Sin nombre'}</h3>
                                                <p className="text-gray-400">{guide.email || 'Sin email'}</p>
                                                <p className="text-gray-500 text-sm">{guide.phone || 'Sin teléfono'}</p>
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
                                            <p className="text-white">{Array.isArray(guide.languages) ? guide.languages.join(', ') : 'N/A'}</p>
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
                                    <h2 className="text-2xl font-bold text-white">{selectedGuide.full_name || 'Sin nombre'}</h2>
                                    <p className="text-gray-400">{selectedGuide.email || 'Sin email'}</p>
                                </div>
                            </div>
                            <button onClick={() => {
                                setSelectedGuide(null);
                                setGhoscloudData(null);
                                setDocNumberOverride('');
                            }} className="text-gray-400 hover:text-white text-2xl">&times;</button>
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
                                <p className="text-white">{selectedGuide.phone || 'No registrado'}</p>
                            </div>

                            <div>
                                <p className="text-gray-400 text-sm">Experiencia</p>
                                <p className="text-white">{selectedGuide.experience_years || 0} años</p>
                            </div>

                            {/* Ghoscloud Verification Panel */}
                            <div className="mt-6 border-t border-white/10 pt-6">
                                <h3 className="text-cyan-400 font-semibold mb-3 flex items-center gap-2">
                                    <span>🔍</span> Consulta Avanzada Ghoscloud
                                </h3>
                                <p className="text-xs text-gray-400 mb-3">
                                    Verifica antecedentes penales, judiciales y policiales oficiales desde las bases de datos del estado.
                                </p>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        placeholder={`DNI: ${selectedGuide.dircetur_id || 'Autocompletar'}`}
                                        value={docNumberOverride}
                                        onChange={(e) => setDocNumberOverride(e.target.value)}
                                        className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                                    />
                                    <button
                                        onClick={() => handleGhoscloudVerification(selectedGuide.dircetur_id || '')}
                                        disabled={verifyingBackground}
                                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {verifyingBackground ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                                Consultando...
                                            </>
                                        ) : 'Ejecutar Consulta'}
                                    </button>
                                </div>

                                {ghoscloudData && (
                                    <div className="mt-3 p-4 bg-black/40 rounded-lg border border-slate-700/50 max-h-60 overflow-auto">
                                        {ghoscloudData.error ? (
                                            <p className="text-red-400 text-sm whitespace-pre-wrap">{ghoscloudData.error}</p>
                                        ) : (
                                            <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap break-all">
                                                {JSON.stringify(ghoscloudData, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                )}
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
        </DashboardLayout>
    );
}
