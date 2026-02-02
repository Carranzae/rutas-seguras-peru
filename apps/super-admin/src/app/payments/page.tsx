'use client';

import { adminService, Payment } from '@/lib/admin';
import { getAuthToken } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    refunded: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const methodIcons: Record<string, string> = {
    card: '💳',
    yape: '📱',
    plin: '📱',
    cash: '💵',
    bank_transfer: '🏦',
    izipay: '💳',
};

export default function PaymentsPage() {
    const router = useRouter();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [izipayStatus, setIzipayStatus] = useState<{ configured: boolean; mock_mode: boolean; platform_fee_percent: number } | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [stats, setStats] = useState({
        totalPayments: 0,
        completedPayments: 0,
        totalRevenue: 0,
        platformEarnings: 0,
        agencyPayouts: 0,
        guidePayouts: 0,
    });

    useEffect(() => {
        if (!getAuthToken()) {
            router.push('/login');
            return;
        }
        loadPayments();
        loadIzipayStatus();
    }, []);

    const loadIzipayStatus = async () => {
        const status = await adminService.getIzipayStatus();
        setIzipayStatus(status);
    };

    const loadPayments = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await adminService.getPayments();
            setPayments(data);

            // Also load stats
            const statsData = await adminService.getPaymentStats();
            // Calculate stats from payments
            const completed = data.filter(p => p.status === 'completed');
            setStats({
                totalPayments: data.length,
                completedPayments: completed.length,
                totalRevenue: completed.reduce((sum, p) => sum + p.amount, 0),
                platformEarnings: completed.reduce((sum, p) => sum + (p.platform_fee || 0), 0),
                agencyPayouts: completed.reduce((sum, p) => sum + (p.agency_amount || 0), 0),
                guidePayouts: completed.reduce((sum, p) => sum + (p.guide_amount || 0), 0),
            });
        } catch (err: any) {
            console.error('Error loading payments:', err);
            setError(err.message || 'Error al cargar pagos');
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        const headers = ['ID', 'Monto', 'Comisión Plataforma', 'Pago Agencia', 'Pago Guía', 'Estado', 'Método', 'Fecha'];
        const rows = filteredPayments.map(p => [
            p.id,
            p.amount.toFixed(2),
            (p.platform_fee || 0).toFixed(2),
            (p.agency_amount || 0).toFixed(2),
            (p.guide_amount || 0).toFixed(2),
            p.status,
            p.payment_method,
            new Date(p.created_at).toLocaleDateString('es-PE'),
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `pagos_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        alert('✅ Reporte exportado exitosamente');
    };

    const filteredPayments = payments.filter(p => {
        const matchesFilter = filter === 'all' || p.status === filter;
        const matchesSearch =
            p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.booking_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.payment_method?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    // Payment action handlers
    const handleConfirmPayment = async (paymentId: string) => {
        if (!confirm('¿Confirmar este pago? Se liberarán los fondos a la agencia y guía.')) return;
        setActionLoading(paymentId);
        try {
            const result = await adminService.confirmPayment(paymentId);
            if (result.success) {
                alert('✅ Pago confirmado exitosamente');
                loadPayments();
            } else {
                alert('❌ Error: ' + result.message);
            }
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectPayment = async (paymentId: string) => {
        const reason = prompt('Razón del rechazo:');
        if (!reason) return;
        setActionLoading(paymentId);
        try {
            const result = await adminService.rejectPayment(paymentId, reason);
            if (result.success) {
                alert('✅ Pago rechazado');
                loadPayments();
            } else {
                alert('❌ Error: ' + result.message);
            }
        } finally {
            setActionLoading(null);
        }
    };

    const handleRefund = async (paymentId: string) => {
        const reason = prompt('Razón del reembolso:');
        if (!reason) return;
        setActionLoading(paymentId);
        try {
            const result = await adminService.processRefund(paymentId, undefined, reason);
            if (result.success) {
                alert('✅ Reembolso procesado: ' + result.refund_id);
                loadPayments();
            } else {
                alert('❌ Error: ' + result.error);
            }
        } finally {
            setActionLoading(null);
        }
    };

    const handleVerifyPayment = async (paymentId: string) => {
        setActionLoading(paymentId);
        try {
            const result = await adminService.verifyPayment(paymentId);
            if (result.success) {
                alert(`✅ Estado verificado: ${result.status}\nMonto: S/.${result.amount}`);
            } else {
                alert('❌ Error: ' + result.error);
            }
        } finally {
            setActionLoading(null);
        }
    };


    return (
        <div className="min-h-screen bg-[#101622] p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">💰 Pagos y Transacciones</h1>
                    <p className="text-gray-400">Control de pagos completados y distribución de comisiones</p>
                </div>
                <div className="flex gap-4 items-center">
                    {/* Izipay Status Badge */}
                    {izipayStatus && (
                        <div className={`px-3 py-2 rounded-lg flex items-center gap-2 ${izipayStatus.mock_mode
                            ? 'bg-yellow-500/20 border border-yellow-500/30'
                            : 'bg-green-500/20 border border-green-500/30'
                            }`}>
                            <span className="text-lg">💳</span>
                            <div>
                                <p className={`text-xs font-medium ${izipayStatus.mock_mode ? 'text-yellow-400' : 'text-green-400'}`}>
                                    Izipay {izipayStatus.mock_mode ? 'MODO PRUEBA' : 'ACTIVO'}
                                </p>
                                <p className="text-[10px] text-gray-400">Fee: {izipayStatus.platform_fee_percent}%</p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={exportToCSV}
                        className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 flex items-center gap-2"
                    >
                        📥 Exportar Excel
                    </button>
                    <button
                        onClick={loadPayments}
                        className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                    >
                        🔄 Actualizar
                    </button>
                    <Link href="/dashboard" className="px-4 py-2 bg-[#232f48] text-gray-300 rounded-lg hover:bg-[#2a3750] transition">
                        ← Volver al Dashboard
                    </Link>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400">
                    ⚠️ {error}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <div className="bg-[#1a2235] p-4 rounded-xl border border-white/10">
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Total Pagos</p>
                    <p className="text-2xl font-bold text-white">{stats.totalPayments}</p>
                </div>
                <div className="bg-[#1a2235] p-4 rounded-xl border border-green-500/20">
                    <p className="text-green-400 text-xs uppercase tracking-wide">Completados</p>
                    <p className="text-2xl font-bold text-green-400">{stats.completedPayments}</p>
                </div>
                <div className="bg-[#1a2235] p-4 rounded-xl border border-blue-500/20">
                    <p className="text-blue-400 text-xs uppercase tracking-wide">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-blue-400">S/.{stats.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-[#1a2235] p-4 rounded-xl border border-purple-500/20">
                    <p className="text-purple-400 text-xs uppercase tracking-wide">Comisión Plataforma (15%)</p>
                    <p className="text-2xl font-bold text-purple-400">S/.{stats.platformEarnings.toFixed(2)}</p>
                </div>
                <div className="bg-[#1a2235] p-4 rounded-xl border border-cyan-500/20">
                    <p className="text-cyan-400 text-xs uppercase tracking-wide">Pago Agencias (70%)</p>
                    <p className="text-2xl font-bold text-cyan-400">S/.{stats.agencyPayouts.toFixed(2)}</p>
                </div>
                <div className="bg-[#1a2235] p-4 rounded-xl border border-orange-500/20">
                    <p className="text-orange-400 text-xs uppercase tracking-wide">Pago Guías (15%)</p>
                    <p className="text-2xl font-bold text-orange-400">S/.{stats.guidePayouts.toFixed(2)}</p>
                </div>
            </div>

            {/* Commission Distribution Chart */}
            <div className="bg-[#1a2235] p-6 rounded-xl border border-white/10 mb-8">
                <h3 className="text-white font-semibold mb-4">📊 Distribución de Comisiones</h3>
                <div className="flex items-center gap-4">
                    <div className="flex-1 h-8 bg-[#232f48] rounded-full overflow-hidden flex">
                        <div className="h-full bg-purple-500 transition-all" style={{ width: '15%' }} title="Plataforma 15%"></div>
                        <div className="h-full bg-cyan-500 transition-all" style={{ width: '70%' }} title="Agencia 70%"></div>
                        <div className="h-full bg-orange-500 transition-all" style={{ width: '15%' }} title="Guía 15%"></div>
                    </div>
                    <div className="flex gap-4 text-sm">
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                            <span className="text-gray-400">Plataforma 15%</span>
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-cyan-500 rounded-full"></span>
                            <span className="text-gray-400">Agencia 70%</span>
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                            <span className="text-gray-400">Guía 15%</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="Buscar por ID o método de pago..."
                        className="w-full px-4 py-3 bg-[#1a2235] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#1152d4]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'pending', 'completed', 'failed'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg border transition ${filter === status
                                ? 'bg-[#1152d4] border-[#1152d4] text-white'
                                : 'bg-[#1a2235] border-white/10 text-gray-400 hover:border-[#1152d4]/50'
                                }`}
                        >
                            {status === 'all' ? 'Todos' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Cargando pagos...</p>
                </div>
            ) : (
                /* Payments Table */
                <div className="bg-[#1a2235] rounded-xl border border-white/10 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">ID</th>
                                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wide">Método</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Monto Total</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Plataforma</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Agencia</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Guía</th>
                                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wide">Estado</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Fecha</th>
                                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wide">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredPayments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-white/5 transition">
                                        <td className="px-6 py-4">
                                            <p className="text-white font-mono text-sm">{payment.id.slice(0, 12)}...</p>
                                            <p className="text-gray-500 text-xs">Reserva: {payment.booking_id?.slice(0, 8) || 'N/A'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-2xl" title={payment.payment_method}>
                                                {methodIcons[payment.payment_method] || '💳'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-white font-semibold">S/.{payment.amount.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-purple-400">S/.{(payment.platform_fee || 0).toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-cyan-400">S/.{(payment.agency_amount || 0).toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-orange-400">S/.{(payment.guide_amount || 0).toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[payment.status] || statusColors.pending}`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-gray-300">{new Date(payment.created_at).toLocaleDateString('es-PE')}</p>
                                            <p className="text-gray-500 text-xs">{new Date(payment.created_at).toLocaleTimeString('es-PE')}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1 justify-center">
                                                {payment.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleConfirmPayment(payment.id)}
                                                            disabled={actionLoading === payment.id}
                                                            className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 disabled:opacity-50"
                                                            title="Confirmar pago"
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectPayment(payment.id)}
                                                            disabled={actionLoading === payment.id}
                                                            className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 disabled:opacity-50"
                                                            title="Rechazar pago"
                                                        >
                                                            ✗
                                                        </button>
                                                    </>
                                                )}
                                                {payment.status === 'completed' && (
                                                    <button
                                                        onClick={() => handleRefund(payment.id)}
                                                        disabled={actionLoading === payment.id}
                                                        className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs hover:bg-purple-500/30 disabled:opacity-50"
                                                        title="Reembolsar"
                                                    >
                                                        ↺
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleVerifyPayment(payment.id)}
                                                    disabled={actionLoading === payment.id}
                                                    className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 disabled:opacity-50"
                                                    title="Verificar con Izipay"
                                                >
                                                    🔍
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredPayments.length === 0 && (
                        <div className="p-12 text-center">
                            <p className="text-gray-400 text-lg">No se encontraron pagos</p>
                            <p className="text-gray-500 text-sm mt-2">Los pagos aparecerán cuando se procesen reservas</p>
                        </div>
                    )}
                </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
                <p className="text-gray-400 text-sm">
                    Mostrando {filteredPayments.length} de {payments.length} pagos
                </p>
            </div>
        </div>
    );
}
