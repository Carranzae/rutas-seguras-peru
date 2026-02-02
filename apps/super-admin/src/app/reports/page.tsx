'use client';

import { adminService, DashboardStats, Payment } from '@/lib/admin';
import { getAuthToken } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ReportsPage() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('month');

    useEffect(() => {
        if (!getAuthToken()) {
            router.push('/login');
            return;
        }
        loadData();
    }, [dateRange]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [statsData, paymentsData] = await Promise.all([
                adminService.getStats(),
                adminService.getPayments(),
            ]);
            setStats(statsData);
            setPayments(paymentsData);
        } catch (err) {
            console.error('Error loading reports:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
    };

    // Calculate report data
    const completedPayments = payments.filter(p => p.status === 'completed');
    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const platformFees = completedPayments.reduce((sum, p) => sum + p.platform_fee, 0);
    const agencyPayouts = completedPayments.reduce((sum, p) => sum + p.agency_amount, 0);
    const guidePayouts = completedPayments.reduce((sum, p) => sum + p.guide_amount, 0);

    const exportCSV = () => {
        const headers = ['ID', 'Monto', 'Comisión Plataforma', 'Pago Agencia', 'Pago Guía', 'Estado', 'Método', 'Fecha'];
        const rows = payments.map(p => [
            p.id,
            p.amount,
            p.platform_fee,
            p.agency_amount,
            p.guide_amount,
            p.status,
            p.payment_method,
            p.created_at,
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    return (
        <div className="min-h-screen bg-[#101622] p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">📊 Reportes</h1>
                    <p className="text-gray-400">Estadísticas y análisis del sistema</p>
                </div>
                <div className="flex gap-4">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-4 py-2 bg-[#232f48] border border-white/10 rounded-lg text-white"
                    >
                        <option value="week">Última Semana</option>
                        <option value="month">Último Mes</option>
                        <option value="quarter">Último Trimestre</option>
                        <option value="year">Último Año</option>
                    </select>
                    <button onClick={exportCSV} className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30">
                        📥 Exportar CSV
                    </button>
                    <Link href="/dashboard" className="px-4 py-2 bg-[#232f48] text-gray-300 rounded-lg hover:bg-[#2a3750]">
                        ← Dashboard
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                </div>
            ) : (
                <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 p-6 rounded-xl border border-green-500/20">
                            <p className="text-green-400 text-xs uppercase tracking-wide mb-2">Ingresos Totales</p>
                            <p className="text-3xl font-bold text-green-400">{formatCurrency(totalRevenue)}</p>
                            <p className="text-green-300/50 text-sm mt-2">{completedPayments.length} transacciones</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 p-6 rounded-xl border border-blue-500/20">
                            <p className="text-blue-400 text-xs uppercase tracking-wide mb-2">Comisión Plataforma</p>
                            <p className="text-3xl font-bold text-blue-400">{formatCurrency(platformFees)}</p>
                            <p className="text-blue-300/50 text-sm mt-2">15% del total</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 p-6 rounded-xl border border-purple-500/20">
                            <p className="text-purple-400 text-xs uppercase tracking-wide mb-2">Pagos a Agencias</p>
                            <p className="text-3xl font-bold text-purple-400">{formatCurrency(agencyPayouts)}</p>
                            <p className="text-purple-300/50 text-sm mt-2">70% del total</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 p-6 rounded-xl border border-orange-500/20">
                            <p className="text-orange-400 text-xs uppercase tracking-wide mb-2">Pagos a Guías</p>
                            <p className="text-3xl font-bold text-orange-400">{formatCurrency(guidePayouts)}</p>
                            <p className="text-orange-300/50 text-sm mt-2">15% del total</p>
                        </div>
                    </div>

                    {/* System Stats */}
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="bg-[#1a2235] rounded-xl border border-white/10 p-6">
                            <h3 className="text-xl font-bold text-white mb-4">📈 Estadísticas del Sistema</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-gray-400">Total Usuarios</span>
                                    <span className="text-white font-bold">{stats?.total_users || 0}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-gray-400">Total Agencias</span>
                                    <span className="text-white font-bold">{stats?.total_agencies || 0}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-gray-400">Total Guías</span>
                                    <span className="text-white font-bold">{stats?.total_guides || 0}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-gray-400">Total Tours</span>
                                    <span className="text-white font-bold">{stats?.total_tours || 0}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-gray-400">Tours Activos Hoy</span>
                                    <span className="text-green-400 font-bold">{stats?.active_tours_today || 0}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-gray-400">Verificaciones Pendientes</span>
                                    <span className="text-yellow-400 font-bold">{stats?.pending_verifications || 0}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#1a2235] rounded-xl border border-white/10 p-6">
                            <h3 className="text-xl font-bold text-white mb-4">🚨 Seguridad</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-gray-400">Emergencias Activas</span>
                                    <span className={`font-bold ${(stats?.active_emergencies || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                        {stats?.active_emergencies || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-gray-400">Ingresos Totales</span>
                                    <span className="text-green-400 font-bold">{formatCurrency(stats?.total_revenue || 0)}</span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h4 className="text-gray-400 text-sm mb-3">Distribución de Comisiones</h4>
                                <div className="h-4 bg-[#232f48] rounded-full overflow-hidden flex">
                                    <div className="h-full bg-blue-500" style={{ width: '15%' }}></div>
                                    <div className="h-full bg-purple-500" style={{ width: '70%' }}></div>
                                    <div className="h-full bg-orange-500" style={{ width: '15%' }}></div>
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-gray-400">
                                    <span>🔵 Plataforma 15%</span>
                                    <span>🟣 Agencias 70%</span>
                                    <span>🟠 Guías 15%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Payments */}
                    <div className="bg-[#1a2235] rounded-xl border border-white/10 p-6">
                        <h3 className="text-xl font-bold text-white mb-4">💳 Últimos Pagos</h3>
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-white/10">
                                    <th className="pb-3 text-gray-400 text-xs uppercase">ID</th>
                                    <th className="pb-3 text-gray-400 text-xs uppercase">Monto</th>
                                    <th className="pb-3 text-gray-400 text-xs uppercase">Comisión</th>
                                    <th className="pb-3 text-gray-400 text-xs uppercase">Método</th>
                                    <th className="pb-3 text-gray-400 text-xs uppercase">Estado</th>
                                    <th className="pb-3 text-gray-400 text-xs uppercase">Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.slice(0, 10).map(payment => (
                                    <tr key={payment.id} className="border-b border-white/5">
                                        <td className="py-3 font-mono text-xs text-gray-400">{payment.id.slice(0, 8)}</td>
                                        <td className="py-3 text-green-400">{formatCurrency(payment.amount)}</td>
                                        <td className="py-3 text-blue-400">{formatCurrency(payment.platform_fee)}</td>
                                        <td className="py-3 text-white">{payment.payment_method}</td>
                                        <td className="py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs ${payment.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="py-3 text-gray-400 text-sm">
                                            {new Date(payment.created_at).toLocaleDateString('es-PE')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
