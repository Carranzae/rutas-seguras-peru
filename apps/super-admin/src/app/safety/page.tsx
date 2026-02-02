'use client';

import { getAuthToken } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Types
interface TrackedUser {
    user_id: string;
    user_name: string;
    user_type: 'guide' | 'tourist';
    location: { latitude: number; longitude: number } | null;
    battery: number | null;
    risk_score: number | null;
    status: string;
    alert_count: number;
}

interface SafetyAlert {
    id: string;
    user_id: string;
    user_name: string;
    alert_type: string;
    severity: string;
    risk_score: number;
    message: string;
    timestamp: string;
    acknowledged: boolean;
}

// Risk level colors
const riskColors: Record<string, { bg: string; text: string; border: string }> = {
    low: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    high: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
    critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
};

const getRiskLevel = (score: number | null): string => {
    if (score === null) return 'low';
    if (score < 30) return 'low';
    if (score < 60) return 'medium';
    if (score < 80) return 'high';
    return 'critical';
};

export default function SafetyPage() {
    const router = useRouter();
    const [users, setUsers] = useState<TrackedUser[]>([]);
    const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<TrackedUser | null>(null);

    useEffect(() => {
        if (!getAuthToken()) {
            router.push('/login');
            return;
        }
        loadData();

        // Refresh every 10 seconds
        const interval = setInterval(loadData, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const token = getAuthToken();
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch tracked users
            const usersRes = await fetch('http://localhost:8000/api/v1/ws/safety/users', { headers });
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setUsers(usersData);
            }

            // Fetch alerts
            const alertsRes = await fetch('http://localhost:8000/api/v1/ws/safety/alerts', { headers });
            if (alertsRes.ok) {
                const alertsData = await alertsRes.json();
                setAlerts(alertsData);
            }

            setError(null);
        } catch (err: any) {
            console.error('Error loading safety data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const quickDangerCheck = async (lat: number, lng: number) => {
        try {
            const token = getAuthToken();
            const res = await fetch(
                `http://localhost:8000/api/v1/ws/safety/check?latitude=${lat}&longitude=${lng}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                const data = await res.json();
                alert(`Resultado del análisis:\n\nPuntuación: ${data.risk_score}/100\nTerreno: ${data.terrain}\nSeguro: ${data.safe ? 'SÍ' : 'NO'}\n\nAlertas: ${data.alerts.join(', ') || 'Ninguna'}`);
            }
        } catch (err) {
            console.error('Error en quick check:', err);
        }
    };

    // Stats
    const totalUsers = users.length;
    const highRiskUsers = users.filter(u => (u.risk_score || 0) >= 60).length;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
    const avgRisk = users.length > 0
        ? Math.round(users.reduce((sum, u) => sum + (u.risk_score || 0), 0) / users.length)
        : 0;

    return (
        <div className="min-h-screen bg-[#101622] p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">🤖 IA Safety Dashboard</h1>
                    <p className="text-gray-400">Monitoreo de seguridad con Inteligencia Artificial Claude</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={loadData}
                        className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                    >
                        🔄 Actualizar
                    </button>
                    <Link href="/tracking" className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30">
                        📍 Ver Mapa
                    </Link>
                    <Link href="/dashboard" className="px-4 py-2 bg-[#232f48] text-gray-300 rounded-lg hover:bg-[#2a3750]">
                        ← Dashboard
                    </Link>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400">
                    ⚠️ {error}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-[#1a2235] p-4 rounded-xl border border-blue-500/20">
                    <p className="text-blue-400 text-xs uppercase tracking-wide">Usuarios Rastreados</p>
                    <p className="text-3xl font-bold text-blue-400">{totalUsers}</p>
                </div>
                <div className="bg-[#1a2235] p-4 rounded-xl border border-orange-500/20">
                    <p className="text-orange-400 text-xs uppercase tracking-wide">Alto Riesgo</p>
                    <p className="text-3xl font-bold text-orange-400">{highRiskUsers}</p>
                </div>
                <div className="bg-[#1a2235] p-4 rounded-xl border border-red-500/20">
                    <p className="text-red-400 text-xs uppercase tracking-wide">Alertas Críticas</p>
                    <p className="text-3xl font-bold text-red-400">{criticalAlerts}</p>
                </div>
                <div className="bg-[#1a2235] p-4 rounded-xl border border-green-500/20">
                    <p className="text-green-400 text-xs uppercase tracking-wide">Riesgo Promedio</p>
                    <p className="text-3xl font-bold text-green-400">{avgRisk}/100</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Tracked Users */}
                <div className="bg-[#1a2235] rounded-xl border border-white/10 p-6">
                    <h2 className="text-xl font-bold text-white mb-4">👥 Usuarios Rastreados</h2>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p className="text-2xl mb-2">📍</p>
                            <p>Sin usuarios rastreados actualmente</p>
                            <p className="text-xs mt-2">Los usuarios aparecerán cuando inicien el tracking desde la app móvil</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {users.map(user => {
                                const riskLevel = getRiskLevel(user.risk_score);
                                return (
                                    <div
                                        key={user.user_id}
                                        onClick={() => setSelectedUser(user)}
                                        className={`p-4 rounded-xl border cursor-pointer transition ${selectedUser?.user_id === user.user_id
                                                ? 'bg-[#1152d4]/20 border-[#1152d4]'
                                                : `${riskColors[riskLevel].bg} ${riskColors[riskLevel].border} hover:border-white/30`
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-white font-medium">
                                                {user.user_type === 'guide' ? '🧭' : '🧳'} {user.user_name}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${riskColors[riskLevel].text}`}>
                                                {user.risk_score !== null ? `${user.risk_score}/100` : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            {user.battery !== null && (
                                                <span className={user.battery < 20 ? 'text-red-400' : ''}>
                                                    🔋 {user.battery}%
                                                </span>
                                            )}
                                            <span className={`px-2 py-0.5 rounded-full ${riskColors[riskLevel].bg} ${riskColors[riskLevel].text}`}>
                                                {user.status}
                                            </span>
                                            {user.alert_count > 0 && (
                                                <span className="text-red-400">⚠️ {user.alert_count} alertas</span>
                                            )}
                                        </div>
                                        {user.location && (
                                            <div className="mt-2 flex gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        quickDangerCheck(user.location!.latitude, user.location!.longitude);
                                                    }}
                                                    className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs hover:bg-purple-500/30"
                                                >
                                                    🔍 Analizar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Alerts */}
                <div className="bg-[#1a2235] rounded-xl border border-white/10 p-6">
                    <h2 className="text-xl font-bold text-white mb-4">🚨 Alertas IA</h2>

                    {alerts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p className="text-2xl mb-2">✅</p>
                            <p>Sin alertas recientes</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {alerts.map(alert => (
                                <div
                                    key={alert.id}
                                    className={`p-4 rounded-xl border ${alert.severity === 'critical'
                                            ? 'bg-red-500/10 border-red-500/30'
                                            : alert.severity === 'warning'
                                                ? 'bg-yellow-500/10 border-yellow-500/30'
                                                : 'bg-blue-500/10 border-blue-500/30'
                                        } ${alert.acknowledged ? 'opacity-50' : ''}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-white">
                                            {alert.alert_type === 'ai_analysis' && '🤖'}
                                            {alert.alert_type === 'low_battery' && '🔋'}
                                            {alert.alert_type === 'sos' && '🆘'}
                                            {' '}{alert.user_name}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                                alert.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {alert.severity.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 text-sm mb-2">{alert.message}</p>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>Riesgo: {alert.risk_score}/100</span>
                                        <span>{new Date(alert.timestamp).toLocaleString('es-PE')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* AI Info */}
            <div className="mt-8 bg-[#1a2235] rounded-xl border border-purple-500/20 p-6">
                <h3 className="text-xl font-bold text-purple-400 mb-4">🧠 Claude AI Analysis</h3>
                <div className="grid grid-cols-3 gap-6">
                    <div>
                        <p className="text-gray-400 text-sm mb-2">Modelo</p>
                        <p className="text-white font-mono">claude-sonnet-4-20250514</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm mb-2">Análisis Cada</p>
                        <p className="text-white">2 minutos (si hay anomalía: inmediato)</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm mb-2">Factores Evaluados</p>
                        <p className="text-white">Ubicación, Velocidad, Altitud, Batería, Hora, Zonas de Peligro</p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-4 gap-4">
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 text-center">
                        <p className="text-green-400 text-xs">0-30</p>
                        <p className="text-green-400 font-bold">BAJO</p>
                    </div>
                    <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20 text-center">
                        <p className="text-yellow-400 text-xs">31-60</p>
                        <p className="text-yellow-400 font-bold">MEDIO</p>
                    </div>
                    <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20 text-center">
                        <p className="text-orange-400 text-xs">61-80</p>
                        <p className="text-orange-400 font-bold">ALTO</p>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 text-center">
                        <p className="text-red-400 text-xs">81-100</p>
                        <p className="text-red-400 font-bold">CRÍTICO</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
