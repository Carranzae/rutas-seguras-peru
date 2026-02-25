'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminService, DashboardStats } from '@/lib/admin';
import { getAuthToken } from '@/lib/api';
import { authService } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Check auth
        const token = getAuthToken();
        if (!token) {
            router.push('/login');
            return;
        }

        // Load data
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [statsData, userData] = await Promise.all([
                adminService.getStats(),
                authService.getMe().catch(() => null),
            ]);
            setStats(statsData);
            setUser(userData);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
    };

    const navItems = [
        { id: 'dashboard', icon: '📊', label: 'Dashboard', href: '/dashboard', active: true },
        { id: 'tracking', icon: '📍', label: 'Tracking', href: '/tracking' },
        { id: 'agencies', icon: '🏢', label: 'Agencias', href: '/agencies' },
        { id: 'guides', icon: '🪪', label: 'Guías', href: '/guides' },
        { id: 'reservations', icon: '🎫', label: 'Reservas', href: '/reservations' },
        { id: 'payments', icon: '💳', label: 'Pagos', href: '/payments' },
        { id: 'emergencies', icon: '🆘', label: 'SOS', href: '/crisis' },
        { id: 'notifications', icon: '🔔', label: 'Notificaciones', href: '/notifications' },
        { id: 'reports', icon: '📈', label: 'Reportes', href: '/reports' },
        { id: 'settings', icon: '⚙️', label: 'Configuración', href: '/settings' },
    ];

    const statCards = [
        { icon: '👥', value: stats?.total_users || 0, label: 'Usuarios Totales', color: 'blue' },
        { icon: '🏢', value: stats?.total_agencies || 0, label: 'Agencias', color: 'green' },
        { icon: '🪪', value: stats?.total_guides || 0, label: 'Guías', color: 'purple' },
        { icon: '🌍', value: stats?.total_tours || 0, label: 'Tours', color: 'yellow' },
        { icon: '🆘', value: stats?.active_emergencies || 0, label: 'Emergencias', color: 'red', critical: true },
        { icon: '⏳', value: stats?.pending_verifications || 0, label: 'Pendientes', color: 'orange' },
        { icon: '💰', value: `S/.${(stats?.total_revenue || 0).toLocaleString()}`, label: 'Ingresos', color: 'emerald' },
        { icon: '🎯', value: stats?.active_tours_today || 0, label: 'Tours Hoy', color: 'cyan' },
    ];

    const quickActions = [
        { icon: '✅', label: 'Verificar Agencia', action: () => router.push('/agencies'), color: 'green' },
        { icon: '🪪', label: 'Verificar Guía', action: () => router.push('/guides'), color: 'blue' },
        { icon: '🔔', label: 'Enviar Notificación', action: () => router.push('/notifications'), color: 'purple' },
        { icon: '📊', label: 'Ver Reportes', action: () => router.push('/reports'), color: 'yellow' },
        { icon: '📍', label: 'Ver Tracking', action: () => router.push('/tracking'), color: 'red' },
        { icon: '💳', label: 'Ver Pagos', action: () => router.push('/payments'), color: 'emerald' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout title="Dashboard" subtitle="Centro de control nacional">
            <div className="p-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statCards.map((stat, index) => (
                        <div
                            key={index}
                            className={`bg-[#1a2235]/60 backdrop-blur-sm rounded-2xl p-6 border shadow-lg ${stat.critical && Number(stat.value) > 0
                                ? 'border-red-500/50 shadow-red-500/10'
                                : 'border-white/5'
                                } hover:border-blue-500/30 transition-all duration-300`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <span className={`text-4xl drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]`}>{stat.icon}</span>
                                {stat.critical && Number(stat.value) > 0 && (
                                    <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/50 text-xs font-bold rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                                        URGENTE
                                    </span>
                                )}
                            </div>
                            <p className="text-4xl font-black text-white mb-2 tracking-tight">{stat.value}</p>
                            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="bg-[#1a2235]/40 backdrop-blur-md rounded-3xl p-8 border border-white/5 mb-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="text-blue-400">⚡</span> Acciones Rápidas
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {quickActions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={action.action}
                                    className="flex flex-col items-center gap-3 p-5 bg-[#101622]/50 hover:bg-gradient-to-br hover:from-blue-600/20 hover:to-purple-600/20 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-blue-500/20 group"
                                >
                                    <span className="text-3xl group-hover:scale-110 transition-transform duration-300 drop-shadow-md">{action.icon}</span>
                                    <span className="text-gray-300 group-hover:text-white text-sm font-semibold text-center">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* API Connection Status */}
                <div className="bg-[#1a2235]/40 backdrop-blur-md rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="text-green-400">🔌</span> Estado del Sistema
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="flex items-center gap-4 p-5 bg-[#101622]/80 rounded-2xl border border-green-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                                </div>
                                <div>
                                    <p className="text-white font-bold">Backend API</p>
                                    <p className="text-green-400 text-xs font-mono mt-1">Conectado</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-5 bg-[#101622]/80 rounded-2xl border border-green-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                                </div>
                                <div>
                                    <p className="text-white font-bold">PostgreSQL</p>
                                    <p className="text-green-400 text-xs font-mono mt-1">ruta_segura_peru</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-5 bg-[#101622]/80 rounded-2xl border border-green-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                                </div>
                                <div>
                                    <p className="text-white font-bold">PostGIS</p>
                                    <p className="text-green-400 text-xs font-mono mt-1">Habilitado</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-5 bg-[#101622]/80 rounded-2xl border border-blue-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                                </div>
                                <div>
                                    <p className="text-white font-bold">Firebase</p>
                                    <p className="text-blue-400 text-xs font-mono mt-1">Configurado</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
