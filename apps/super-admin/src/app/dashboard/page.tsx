'use client';

import { adminService, DashboardStats } from '@/lib/admin';
import { getAuthToken } from '@/lib/api';
import { authService } from '@/lib/auth';
import Link from 'next/link';
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
        <div className="min-h-screen bg-[#0a0f1c] flex">
            {/* Sidebar */}
            <aside className="w-64 bg-[#101622] border-r border-white/10 flex flex-col">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🛡️</span>
                        <div>
                            <h1 className="text-white font-bold">Ruta Segura</h1>
                            <p className="text-xs text-gray-400">Super Admin</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map(item => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${item.active
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <span className="text-xl">👤</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                                {user?.full_name || 'Admin'}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                                {user?.email || 'admin@rutaseguraperu.com'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                    >
                        🚪 Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {/* Header */}
                <header className="bg-[#101622] border-b border-white/10 px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Dashboard</h2>
                            <p className="text-gray-400 text-sm">Centro de control nacional</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={loadDashboardData}
                                className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                            >
                                🔄 Actualizar
                            </button>
                            <span className="text-gray-400 text-sm">
                                {new Date().toLocaleDateString('es-PE', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {statCards.map((stat, index) => (
                            <div
                                key={index}
                                className={`bg-[#1a2235] rounded-2xl p-6 border ${stat.critical && Number(stat.value) > 0
                                        ? 'border-red-500/50 animate-pulse'
                                        : 'border-white/10'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <span className="text-3xl">{stat.icon}</span>
                                    {stat.critical && Number(stat.value) > 0 && (
                                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                                            URGENTE
                                        </span>
                                    )}
                                </div>
                                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                                <p className="text-gray-400 text-sm">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-[#1a2235] rounded-2xl p-6 border border-white/10 mb-8">
                        <h3 className="text-xl font-bold text-white mb-4">⚡ Acciones Rápidas</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {quickActions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={action.action}
                                    className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    <span className="text-2xl">{action.icon}</span>
                                    <span className="text-white text-sm text-center">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* API Connection Status */}
                    <div className="bg-[#1a2235] rounded-2xl p-6 border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-4">🔌 Estado del Sistema</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <div>
                                    <p className="text-white font-medium">Backend API</p>
                                    <p className="text-green-400 text-xs">localhost:8000</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <div>
                                    <p className="text-white font-medium">PostgreSQL</p>
                                    <p className="text-green-400 text-xs">ruta_segura_peru</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <div>
                                    <p className="text-white font-medium">PostGIS</p>
                                    <p className="text-green-400 text-xs">Habilitado</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <div>
                                    <p className="text-white font-medium">Firebase</p>
                                    <p className="text-blue-400 text-xs">Configurado</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
