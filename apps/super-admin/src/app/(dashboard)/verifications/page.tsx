'use client';

import { useCallback, useEffect, useState } from 'react';

interface PendingVerification {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    user_avatar?: string;
    verification_type: string;
    status: string;
    selfie_url?: string;
    document_url?: string;
    license_number?: string;
    liveness_score?: number;
    document_score?: number;
    submitted_at: string;
    submission_device?: string;
}

interface ApiResponse {
    items: PendingVerification[];
    total: number;
    page: number;
    per_page: number;
}

export default function VerificationsPage() {
    const [verifications, setVerifications] = useState<PendingVerification[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVerification, setSelectedVerification] = useState<PendingVerification | null>(null);
    const [processing, setProcessing] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);
    const [analyzingAI, setAnalyzingAI] = useState(false);

    // Fetch pending verifications
    const fetchVerifications = useCallback(async () => {
        try {
            const token = localStorage.getItem('superadmin_token');
            const response = await fetch('/api/v1/verifications/pending', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data: ApiResponse = await response.json();
                setVerifications(data.items);
            }
        } catch (error) {
            console.error('Error fetching verifications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVerifications();
        // Poll every 10 seconds for new verifications
        const interval = setInterval(fetchVerifications, 10000);
        return () => clearInterval(interval);
    }, [fetchVerifications]);

    const [scanning, setScanning] = useState(false);
    const [deepScanResult, setDeepScanResult] = useState<any>(null);
    const [scanInput, setScanInput] = useState('');
    const [scanMode, setScanMode] = useState<'dni-phys' | 'dni-virt' | 'name' | 'phone' | 'background'>('dni-phys');

    // Ghoscloud Deep Scan
    const performDeepScan = async () => {
        if (!scanInput) {
            alert("Por favor ingrese un valor de búsqueda");
            return;
        }
        setScanning(true);
        setDeepScanResult(null);
        try {
            const token = localStorage.getItem('superadmin_token');
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            let endpoint = '';
            switch (scanMode) {
                case 'dni-phys': endpoint = '/api/v1/verifications/check-dni-physical'; break;
                case 'dni-virt': endpoint = '/api/v1/verifications/check-dni-virtual'; break;
                case 'name': endpoint = '/api/v1/verifications/check-name'; break;
                case 'phone': endpoint = '/api/v1/verifications/check-phone'; break;
                case 'background': endpoint = '/api/v1/verifications/check-background'; break;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({ query: scanInput })
            });

            if (response.ok) {
                const data = await response.json();
                setDeepScanResult({
                    mode: scanMode,
                    data: data
                });
            } else {
                const err = await response.json();
                alert(`Error: ${err.detail || 'Fallo en la consulta'}`);
            }
        } catch (error) {
            console.error("Deep scan failed", error);
            alert("Error ejecutando escaneo profundo");
        } finally {
            setScanning(false);
        }
    };

    // AI Analysis simulation (in production, call actual AI service)
    const runAIAnalysis = async (verification: PendingVerification) => {
        setAnalyzingAI(true);

        // Simulate AI processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock AI results
        const analysis = {
            face_match: Math.random() * 30 + 70, // 70-100%
            document_authenticity: Math.random() * 20 + 80, // 80-100%
            liveness_detected: true,
            text_extraction: {
                dni_number: verification.license_number || '12345678',
                names: verification.user_name,
                issue_date: '2020-01-15',
                expiry_date: '2030-01-15',
            },
            flags: [] as string[],
            recommendation: 'approve' as 'approve' | 'review' | 'reject',
        };

        // Add flags based on scores
        if (analysis.face_match < 80) {
            analysis.flags.push('Coincidencia facial baja');
            analysis.recommendation = 'review';
        }
        if (analysis.document_authenticity < 85) {
            analysis.flags.push('Verificar autenticidad del documento');
            analysis.recommendation = 'review';
        }
        if (verification.liveness_score && verification.liveness_score < 80) {
            analysis.flags.push('Score de liveness bajo');
            analysis.recommendation = 'reject';
        }

        setAiAnalysis(analysis);
        setAnalyzingAI(false);
    };

    // Approve verification
    const handleApprove = async () => {
        if (!selectedVerification) return;

        setProcessing(true);
        try {
            const token = localStorage.getItem('superadmin_token');
            const response = await fetch(`/api/v1/verifications/${selectedVerification.id}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                // Remove from list
                setVerifications(prev => prev.filter(v => v.id !== selectedVerification.id));
                setSelectedVerification(null);
                setAiAnalysis(null);
                alert('✅ Verificación aprobada. El guía ha sido notificado.');
            } else {
                const error = await response.json();
                alert(`Error: ${error.detail}`);
            }
        } catch (error) {
            console.error('Error approving:', error);
            alert('Error al aprobar la verificación');
        } finally {
            setProcessing(false);
        }
    };

    // Reject verification
    const handleReject = async () => {
        if (!selectedVerification || !rejectReason.trim()) return;

        setProcessing(true);
        try {
            const token = localStorage.getItem('superadmin_token');
            const response = await fetch(`/api/v1/verifications/${selectedVerification.id}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason: rejectReason }),
            });

            if (response.ok) {
                setVerifications(prev => prev.filter(v => v.id !== selectedVerification.id));
                setSelectedVerification(null);
                setShowRejectModal(false);
                setRejectReason('');
                setAiAnalysis(null);
                alert('❌ Verificación rechazada. El guía ha sido notificado del motivo.');
            } else {
                const error = await response.json();
                alert(`Error: ${error.detail}`);
            }
        } catch (error) {
            console.error('Error rejecting:', error);
            alert('Error al rechazar la verificación');
        } finally {
            setProcessing(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-400';
        if (score >= 75) return 'text-yellow-400';
        return 'text-red-400';
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
                        🔐 VERIFICACIONES PENDIENTES
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Revisa y aprueba solicitudes de guías independientes
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-cyan-900/30 px-4 py-2 rounded-lg border border-cyan-500/30">
                        <span className="text-cyan-400 font-mono">{verifications.length}</span>
                        <span className="text-gray-400 ml-2">pendientes</span>
                    </div>
                    <button
                        onClick={fetchVerifications}
                        className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
                    >
                        🔄
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* List Panel */}
                <div className="col-span-4 space-y-4">
                    <h2 className="font-mono text-sm text-gray-400 uppercase tracking-wide">
                        Cola de Solicitudes
                    </h2>

                    {verifications.length === 0 ? (
                        <div className="bg-gray-900/50 rounded-lg p-8 text-center border border-gray-800">
                            <p className="text-gray-500">No hay verificaciones pendientes</p>
                        </div>
                    ) : (
                        verifications.map((v) => (
                            <div
                                key={v.id}
                                onClick={() => {
                                    setSelectedVerification(v);
                                    setAiAnalysis(null);
                                    setDeepScanResult(null);
                                    setScanInput(v.license_number || '');
                                }}
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedVerification?.id === v.id
                                    ? 'bg-cyan-900/30 border-cyan-500'
                                    : 'bg-gray-900/50 border-gray-800 hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl">
                                        🎒
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{v.user_name}</p>
                                        <p className="text-sm text-gray-400">{v.user_email}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded">
                                            {v.verification_type.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                                    <span>Enviado: {new Date(v.submitted_at).toLocaleString()}</span>
                                    {v.license_number && (
                                        <span className="text-cyan-400">DIRCETUR: {v.license_number}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Detail Panel */}
                <div className="col-span-8">
                    {selectedVerification ? (
                        <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold">{selectedVerification.user_name}</h2>
                                    <p className="text-gray-400">{selectedVerification.user_email}</p>
                                    {selectedVerification.license_number && (
                                        <p className="text-cyan-400 font-mono mt-1">
                                            DIRCETUR: {selectedVerification.license_number}
                                        </p>
                                    )}
                                </div>
                                <span className="px-3 py-1 bg-yellow-900/30 text-yellow-400 rounded-full text-sm">
                                    ⏳ Pendiente
                                </span>
                            </div>

                            {/* Documents Grid */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                {/* Selfie */}
                                <div className="bg-gray-800 rounded-lg p-4">
                                    <p className="text-xs text-gray-400 mb-2">SELFIE</p>
                                    {selectedVerification.selfie_url ? (
                                        <div className="aspect-square bg-gray-700 rounded-lg overflow-hidden relative">
                                            <div className="absolute inset-0 flex items-center justify-center text-4xl">
                                                📷
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center">
                                            <span className="text-gray-500">Sin imagen</span>
                                        </div>
                                    )}
                                    {selectedVerification.liveness_score && (
                                        <p className={`text-center mt-2 font-mono ${getScoreColor(selectedVerification.liveness_score)}`}>
                                            Liveness: {selectedVerification.liveness_score}%
                                        </p>
                                    )}
                                </div>

                                {/* DNI */}
                                <div className="bg-gray-800 rounded-lg p-4">
                                    <p className="text-xs text-gray-400 mb-2">DOCUMENTO DNI</p>
                                    {selectedVerification.document_url ? (
                                        <div className="aspect-[16/10] bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center text-4xl">
                                            🪪
                                        </div>
                                    ) : (
                                        <div className="aspect-[16/10] bg-gray-700 rounded-lg flex items-center justify-center">
                                            <span className="text-gray-500">Sin imagen</span>
                                        </div>
                                    )}
                                    {selectedVerification.document_score && (
                                        <p className={`text-center mt-2 font-mono ${getScoreColor(selectedVerification.document_score)}`}>
                                            Score: {selectedVerification.document_score}%
                                        </p>
                                    )}
                                </div>

                                {/* Certificate */}
                                <div className="bg-gray-800 rounded-lg p-4">
                                    <p className="text-xs text-gray-400 mb-2">CERTIFICADO DIRCETUR</p>
                                    <div className="aspect-[16/10] bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center text-4xl">
                                        📜
                                    </div>
                                    <p className="text-center mt-2 font-mono text-cyan-400">
                                        {selectedVerification.license_number || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* AI Analysis Button */}
                            <div className="mb-6">
                                <button
                                    onClick={() => runAIAnalysis(selectedVerification)}
                                    disabled={analyzingAI}
                                    className="w-full py-3 bg-purple-900/30 border border-purple-500/50 rounded-lg text-purple-400 hover:bg-purple-900/50 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {analyzingAI ? (
                                        <>
                                            <div className="animate-spin w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full" />
                                            Analizando con IA...
                                        </>
                                    ) : (
                                        <>
                                            🤖 Escanear con IA
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* AI Results */}
                            {aiAnalysis && (
                                <div className="bg-gray-800 rounded-lg p-4 mb-6">
                                    <h3 className="text-sm text-gray-400 mb-4 flex items-center gap-2">
                                        🤖 ANÁLISIS DE INTELIGENCIA ARTIFICIAL
                                    </h3>

                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div className="text-center">
                                            <p className="text-gray-500 text-xs">Coincidencia Facial</p>
                                            <p className={`text-2xl font-bold ${getScoreColor(aiAnalysis.face_match)}`}>
                                                {aiAnalysis.face_match.toFixed(1)}%
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-gray-500 text-xs">Autenticidad Doc.</p>
                                            <p className={`text-2xl font-bold ${getScoreColor(aiAnalysis.document_authenticity)}`}>
                                                {aiAnalysis.document_authenticity.toFixed(1)}%
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-gray-500 text-xs">Liveness</p>
                                            <p className="text-2xl font-bold text-green-400">
                                                {aiAnalysis.liveness_detected ? '✓' : '✗'}
                                            </p>
                                        </div>
                                    </div>

                                    {aiAnalysis.flags.length > 0 && (
                                        <div className="bg-yellow-900/20 rounded p-3 mb-4">
                                            <p className="text-yellow-400 text-sm font-medium mb-2">⚠️ Alertas:</p>
                                            <ul className="text-yellow-300 text-sm">
                                                {aiAnalysis.flags.map((flag: string, i: number) => (
                                                    <li key={i}>• {flag}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className={`p-3 rounded flex items-center gap-2 ${aiAnalysis.recommendation === 'approve'
                                        ? 'bg-green-900/20 text-green-400'
                                        : aiAnalysis.recommendation === 'review'
                                            ? 'bg-yellow-900/20 text-yellow-400'
                                            : 'bg-red-900/20 text-red-400'
                                        }`}>
                                        <span className="text-lg">
                                            {aiAnalysis.recommendation === 'approve' ? '✅' : aiAnalysis.recommendation === 'review' ? '🔍' : '❌'}
                                        </span>
                                        <span className="font-medium">
                                            Recomendación IA: {
                                                aiAnalysis.recommendation === 'approve' ? 'Aprobar' :
                                                    aiAnalysis.recommendation === 'review' ? 'Revisar manualmente' : 'Rechazar'
                                            }
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Deep Scan Section */}
                            <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-cyan-900/50">
                                <h3 className="text-sm text-cyan-400 mb-4 flex items-center gap-2 font-mono">
                                    🔍 DEEP SCAN // GHOSCLOUD PROTOCOL
                                </h3>

                                {/* Mode Selector */}
                                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                    {[
                                        { id: 'dni-phys', label: 'DNI FISICO', icon: '🪪' },
                                        { id: 'dni-virt', label: 'DNI VIRTUAL', icon: '📱' },
                                        { id: 'name', label: 'NOMBRE', icon: '👤' },
                                        { id: 'phone', label: 'TEL/DNI', icon: '📞' },
                                        { id: 'background', label: 'ANTECEDENTES', icon: '🚨' },
                                    ].map(mode => (
                                        <button
                                            key={mode.id}
                                            onClick={() => setScanMode(mode.id as any)}
                                            className={`px-3 py-1 rounded text-xs font-mono whitespace-nowrap transition ${scanMode === mode.id
                                                ? 'bg-cyan-900 text-cyan-400 border border-cyan-500'
                                                : 'bg-gray-900 text-gray-500 hover:bg-gray-800'
                                                }`}
                                        >
                                            {mode.icon} {mode.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-4 mb-4">
                                    <input
                                        type="text"
                                        placeholder={scanMode === 'name' ? "Ingrese Apellidos y Nombres" : "Ingrese DNI o Teléfono"}
                                        value={scanInput}
                                        onChange={(e) => setScanInput(e.target.value)}
                                        className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white flex-1 font-mono"
                                        onKeyDown={(e) => e.key === 'Enter' && performDeepScan()}
                                    />
                                    <button
                                        onClick={performDeepScan}
                                        disabled={scanning || !scanInput}
                                        className="px-4 py-2 bg-cyan-900/50 border border-cyan-500/50 text-cyan-400 rounded hover:bg-cyan-900/80 transition disabled:opacity-50 font-mono text-sm whitespace-nowrap"
                                    >
                                        {scanning ? 'ESCANENDO...' : 'EJECUTAR SCAN'}
                                    </button>
                                </div>

                                {deepScanResult && (
                                    <div className="space-y-4 text-xs font-mono bg-black/20 p-4 rounded border border-gray-800 max-h-[400px] overflow-y-auto">
                                        <div className="flex justify-between text-gray-400 border-b border-gray-700 pb-2 mb-2">
                                            <span>RESULTADO: {deepScanResult.mode.toUpperCase().replace('-', ' ')}</span>
                                            <span>{new Date().toLocaleTimeString()}</span>
                                        </div>

                                        {/* Background Check Visualization */}
                                        {deepScanResult.mode === 'background' ? (
                                            <div className="space-y-4">
                                                {/* Risk Level */}
                                                <div className="flex items-center justify-between p-3 bg-gray-900 rounded border border-gray-700">
                                                    <span className="text-gray-400">NIVEL DE RIESGO</span>
                                                    <span className={`font-bold px-2 py-1 rounded ${deepScanResult.data.summary.risk_level === 'HIGH' ? 'bg-red-900 text-red-100' :
                                                            deepScanResult.data.summary.risk_level === 'MEDIUM' ? 'bg-yellow-900 text-yellow-100' :
                                                                'bg-green-900 text-green-100'
                                                        }`}>
                                                        {deepScanResult.data.summary.risk_level}
                                                    </span>
                                                </div>

                                                {/* Status Grid */}
                                                <div className="grid grid-cols-3 gap-2">
                                                    {['police', 'penal', 'judicial'].map(type => {
                                                        const record = deepScanResult.data.details[type];
                                                        const label = type === 'police' ? 'POLICIAL' : type === 'penal' ? 'PENAL' : 'JUDICIAL';
                                                        return (
                                                            <div key={type} className={`p-3 rounded border flex flex-col items-center justify-center text-center ${record.status === 'ALERT' ? 'bg-red-950/30 border-red-500/50' : 'bg-green-950/30 border-green-500/50'
                                                                }`}>
                                                                <p className="text-[10px] text-gray-500 font-bold mb-1">{label}</p>
                                                                <p className={`text-lg font-bold ${record.status === 'ALERT' ? 'text-red-400' : 'text-green-400'}`}>
                                                                    {record.status === 'ALERT' ? '⚠️ REGISTROS' : '✓ LIMPIO'}
                                                                </p>
                                                            </div>
                                                        )
                                                    })}
                                                </div>

                                                {/* Detailed Records List */}
                                                <div className="space-y-2">
                                                    <p className="text-cyan-400 text-xs font-bold border-b border-gray-800 pb-1">DETALLES ENCONTRADOS</p>
                                                    {['police', 'penal', 'judicial'].map(type => {
                                                        const record = deepScanResult.data.details[type];
                                                        if (record.status !== 'ALERT') return null;
                                                        return (
                                                            <div key={type} className="p-2 bg-red-900/10 border border-red-900/30 rounded">
                                                                <p className="text-red-400 font-bold mb-1 underline capitalize">{type} Records:</p>
                                                                <div className="text-gray-300 whitespace-pre-wrap pl-2 border-l-2 border-red-500/30">
                                                                    {record.raw_summary}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {deepScanResult.data.summary.risk_level === 'LOW' && (
                                                        <p className="text-gray-500 italic text-center py-2">No se encontraron antecedentes en ninguna base de datos.</p>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            /* General Results (DNI, Phone, Name) */
                                            <div className="grid grid-cols-1 gap-2">
                                                {Object.entries(deepScanResult.data).map(([key, value]) => {
                                                    if (key === 'raw') return null; // Skip raw data
                                                    // Helper to format values
                                                    const formatValue = (v: any) => {
                                                        if (Array.isArray(v)) return v.join(', ');
                                                        if (typeof v === 'object' && v !== null) return Object.values(v).join(' ');
                                                        return String(v);
                                                    };

                                                    return (
                                                        <div key={key} className="flex flex-col border-b border-gray-800 pb-2 last:border-0 hover:bg-white/5 p-2 rounded transition">
                                                            <span className="text-cyan-600 uppercase text-[10px] font-bold tracking-wider mb-1">
                                                                {key.replace(/_/g, ' ')}
                                                            </span>
                                                            <span className="text-gray-200 text-sm break-all font-sans">
                                                                {formatValue(value) || <span className="text-gray-600 italic">--</span>}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <button
                                    onClick={handleApprove}
                                    disabled={processing}
                                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {processing ? (
                                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                                    ) : (
                                        <>
                                            ✓ Aprobar Guía
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    disabled={processing}
                                    className="flex-1 py-3 bg-red-600/20 border border-red-500 text-red-400 hover:bg-red-600/30 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    ✗ Rechazar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-12 text-center">
                            <div className="text-6xl mb-4">👈</div>
                            <p className="text-gray-400">Selecciona una verificación para revisar</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold text-red-400 mb-4">
                            ❌ Rechazar Verificación
                        </h3>
                        <p className="text-gray-400 mb-4">
                            El guía recibirá este mensaje y podrá corregir su solicitud.
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Explica el motivo del rechazo (ej: Documento ilegible, foto borrosa, licencia vencida...)"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white resize-none h-32 focus:border-red-500 focus:outline-none"
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                }}
                                className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectReason.trim() || processing}
                                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                            >
                                {processing ? 'Enviando...' : 'Confirmar Rechazo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
