'use client';

import { getAuthToken } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Types
interface RealtimeMetrics {
    timestamp: string;
    today: {
        bookings: number;
        revenue: number;
        new_users: number;
    };
    live: {
        active_tours: number;
        active_emergencies: number;
        websocket_connections: number;
    };
}

interface RevenueData {
    period: string;
    totals: {
        revenue: number;
        platform_fees: number;
        agency_payouts: number;
        guide_payouts: number;
        transaction_count: number;
    };
    daily_breakdown: { date: string; revenue: number; transactions: number }[];
}

interface HealthStatus {
    status: string;
    timestamp: string;
    check_duration_ms: number;
    components: Record<string, { status: string; latency_ms?: number; message: string }>;
}

interface PerformanceMetrics {
    cache: {
        hits: number;
        misses: number;
        hit_rate: string;
        size: number;
    };
    circuit_breakers: Record<string, { state: string; failures: number }>;
}

const statusColors: Record<string, string> = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    unhealthy: 'bg-red-500',
    unknown: 'bg-gray-500',
    closed: 'bg-green-500',
    open: 'bg-red-500',
    half_open: 'bg-yellow-500',
};

export default function AnalyticsPage() {
    const router = useRouter();
    const [realtime, setRealtime] = useState<RealtimeMetrics | null>(null);
    const [revenue, setRevenue] = useState<RevenueData | null>(null);
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [revenuePeriod, setRevenuePeriod] = useState('week');

    useEffect(() => {
        if (!getAuthToken()) {
            router.push('/login');
            return;
        }
        loadAllData();

        // Auto refresh every 10 seconds
        const interval = setInterval(loadAllData, 10000);
        return () => clearInterval(interval);
    }, [revenuePeriod]);

    const loadAllData = async () => {
        try {
            const token = getAuthToken();
            const headers = { Authorization: `Bearer ${token}` };
            const base = 'http://localhost:8000/api/v1/analytics';

            const [realtimeRes, revenueRes, healthRes, perfRes] = await Promise.all([
                fetch(`${base}/realtime`, { headers }),
                fetch(`${base}/revenue?period=${revenuePeriod}`, { headers }),
                fetch(`${base}/health`, { headers }),
                fetch(`${base}/performance`, { headers }),
            ]);

            if (realtimeRes.ok) setRealtime(await realtimeRes.json());
            if (revenueRes.ok) setRevenue(await revenueRes.json());
            if (healthRes.ok) setHealth(await healthRes.json());
            if (perfRes.ok) setPerformance(await perfRes.json());

            setError(null);
        } catch (err: any) {
            console.error('Error loading analytics:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
    };

    return (
        <div className="min-h-screen bg-[#101622] p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">📊 Analytics Centro de Comando</h1>
                    <p className="text-gray-400">Métricas en tiempo real • Arquitectura Enterprise</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={loadAllData} className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30">
                        🔄 Actualizar
                    </button>
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

            {/* System Health Banner */}
            {health && (
                <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between ${health.status === 'healthy' ? 'bg-green-500/10 border-green-500/30' :
                        health.status === 'degraded' ? 'bg-yellow-500/10 border-yellow-500/30' :
                            'bg-red-500/10 border-red-500/30'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${statusColors[health.status]} animate-pulse`}></div>
                        <span className={`font-bold ${health.status === 'healthy' ? 'text-green-400' :
                                health.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                            Sistema {health.status.toUpperCase()}
                        </span>
                    </div>
                    <span className="text-gray-400 text-sm">
                        Última verificación: {new Date(health.timestamp).toLocaleTimeString('es-PE')}
                        ({health.check_duration_ms.toFixed(0)}ms)
                    </span>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12">
                    <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                </div>
            ) : (
                <>
                    {/* Real-time Metrics */}
                    <div className="grid grid-cols-5 gap-4 mb-8">
                        <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 p-5 rounded-xl border border-green-500/20">
                            <p className="text-green-400 text-xs uppercase tracking-wide mb-1">Ingresos Hoy</p>
                            <p className="text-2xl font-bold text-green-400">
                                {formatCurrency(realtime?.today.revenue || 0)}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 p-5 rounded-xl border border-blue-500/20">
                            <p className="text-blue-400 text-xs uppercase tracking-wide mb-1">Reservas Hoy</p>
                            <p className="text-2xl font-bold text-blue-400">{realtime?.today.bookings || 0}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 p-5 rounded-xl border border-purple-500/20">
                            <p className="text-purple-400 text-xs uppercase tracking-wide mb-1">Tours Activos</p>
                            <p className="text-2xl font-bold text-purple-400">{realtime?.live.active_tours || 0}</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 p-5 rounded-xl border border-orange-500/20">
                            <p className="text-orange-400 text-xs uppercase tracking-wide mb-1">Emergencias</p>
                            <p className="text-2xl font-bold text-orange-400">{realtime?.live.active_emergencies || 0}</p>
                        </div>
                        <div className="bg-gradient-to-br from-cyan-900/50 to-cyan-800/30 p-5 rounded-xl border border-cyan-500/20">
                            <p className="text-cyan-400 text-xs uppercase tracking-wide mb-1">Conexiones WS</p>
                            <p className="text-2xl font-bold text-cyan-400">{realtime?.live.websocket_connections || 0}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                        {/* Revenue Analytics */}
                        <div className="bg-[#1a2235] rounded-xl border border-white/10 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">💰 Ingresos</h3>
                                <select
                                    value={revenuePeriod}
                                    onChange={(e) => setRevenuePeriod(e.target.value)}
                                    className="px-3 py-1 bg-[#232f48] border border-white/10 rounded text-white text-sm"
                                >
                                    <option value="week">Semana</option>
                                    <option value="month">Mes</option>
                                    <option value="quarter">Trimestre</option>
                                    <option value="year">Año</option>
                                </select>
                            </div>

                            {revenue && (
                                <>
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-green-500/10 rounded-lg p-3">
                                            <p className="text-green-400 text-xs">Total Ingresos</p>
                                            <p className="text-xl font-bold text-green-400">{formatCurrency(revenue.totals.revenue)}</p>
                                        </div>
                                        <div className="bg-blue-500/10 rounded-lg p-3">
                                            <p className="text-blue-400 text-xs">Comisión Plataforma</p>
                                            <p className="text-xl font-bold text-blue-400">{formatCurrency(revenue.totals.platform_fees)}</p>
                                        </div>
                                    </div>

                                    {/* Mini Chart */}
                                    <div className="h-24 flex items-end gap-1">
                                        {revenue.daily_breakdown.map((day, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                                                style={{
                                                    height: `${Math.max(10, (day.revenue / Math.max(...revenue.daily_breakdown.map(d => d.revenue))) * 100)}%`,
                                                }}
                                                title={`${day.date}: ${formatCurrency(day.revenue)}`}
                                            ></div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                                        {revenue.daily_breakdown.slice(0, 7).map((day, i) => (
                                            <span key={i}>{new Date(day.date).toLocaleDateString('es-PE', { weekday: 'short' })}</span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Component Health */}
                        <div className="bg-[#1a2235] rounded-xl border border-white/10 p-6">
                            <h3 className="text-xl font-bold text-white mb-4">💓 Health Componentes</h3>

                            {health && (
                                <div className="space-y-3">
                                    {Object.entries(health.components).map(([name, comp]) => (
                                        <div key={name} className="flex items-center justify-between py-2 border-b border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${statusColors[comp.status]}`}></div>
                                                <span className="text-white capitalize">{name}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {comp.latency_ms && (
                                                    <span className={`text-xs ${comp.latency_ms < 100 ? 'text-green-400' : comp.latency_ms < 500 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                        {comp.latency_ms.toFixed(0)}ms
                                                    </span>
                                                )}
                                                <span className={`text-xs ${statusColors[comp.status].replace('bg-', 'text-')}`}>
                                                    {comp.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-3 gap-6">
                        {/* Cache Stats */}
                        <div className="bg-[#1a2235] rounded-xl border border-white/10 p-6">
                            <h3 className="text-lg font-bold text-white mb-4">⚡ Cache Performance</h3>
                            {performance && (
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Hit Rate</span>
                                        <span className="text-green-400 font-bold">{performance.cache.hit_rate}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Hits</span>
                                        <span className="text-white">{performance.cache.hits}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Misses</span>
                                        <span className="text-white">{performance.cache.misses}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Size</span>
                                        <span className="text-white">{performance.cache.size} entries</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Circuit Breakers */}
                        <div className="bg-[#1a2235] rounded-xl border border-white/10 p-6">
                            <h3 className="text-lg font-bold text-white mb-4">🔄 Circuit Breakers</h3>
                            {performance && (
                                <div className="space-y-3">
                                    {Object.entries(performance.circuit_breakers).map(([name, cb]) => (
                                        <div key={name} className="flex items-center justify-between">
                                            <span className="text-gray-400 capitalize">{name}</span>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${statusColors[cb.state]}`}></div>
                                                <span className={`text-sm ${statusColors[cb.state].replace('bg-', 'text-')}`}>
                                                    {cb.state}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick Links */}
                        <div className="bg-[#1a2235] rounded-xl border border-white/10 p-6">
                            <h3 className="text-lg font-bold text-white mb-4">🔗 Enterprise Tools</h3>
                            <div className="space-y-2">
                                <Link href="/safety" className="block px-4 py-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20">
                                    🤖 AI Safety Dashboard
                                </Link>
                                <Link href="/tracking" className="block px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20">
                                    📍 Live Tracking
                                </Link>
                                <Link href="/crisis" className="block px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20">
                                    🆘 Crisis Center
                                </Link>
                                <Link href="/reports" className="block px-4 py-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20">
                                    📊 Reports
                                </Link>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
