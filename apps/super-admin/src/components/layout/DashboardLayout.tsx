'use client';

import { getAuthToken } from '@/lib/api';
import { authService } from '@/lib/auth';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
    children,
    title = 'Centro de Control',
    subtitle = 'Super Administrador'
}: {
    children: React.ReactNode,
    title?: string,
    subtitle?: string
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            router.push('/login');
            return;
        }
        authService.getMe().then(setUser).catch(() => null);
    }, [router]);

    const handleLogout = () => {
        authService.logout();
        router.push('/login');
    };

    const navItems = [
        { id: 'dashboard', icon: '📊', label: 'Dashboard', href: '/dashboard' },
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

    return (
        <div className="min-h-screen bg-[#0a0f1c] flex text-white font-sans">
            <aside className="w-64 bg-[#101622]/95 backdrop-blur-md border-r border-white/10 flex flex-col fixed h-full z-50">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="text-xl">🛡️</span>
                        </div>
                        <div>
                            <h1 className="text-white font-bold tracking-tight">Ruta Segura</h1>
                            <p className="text-xs text-blue-400 font-medium">Super Admin</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {navItems.map(item => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <span className={`text-xl transition-transform duration-200 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`}>{item.icon}</span>
                                <span className="font-medium text-sm">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-white/10 bg-[#101622]">
                    <div className="flex items-center gap-3 mb-4 p-2 rounded-xl bg-white/5 border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                            <span className="text-sm">👤</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                                {user?.full_name || 'Admin Central'}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                                {user?.email || 'admin@rutasegura.pe'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all border border-transparent hover:border-red-500/30 text-sm font-medium"
                    >
                        <span>🚪</span> Cerrar Sesión
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col ml-64 min-h-screen bg-gradient-to-br from-[#0a0f1c] to-[#111827]">
                <header className="sticky top-0 z-40 bg-[#101622]/80 backdrop-blur-xl border-b border-white/10 px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
                            <p className="text-blue-400 text-sm font-medium">{subtitle}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                API Online
                            </div>
                            <span className="text-gray-400 text-sm font-medium">
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

                <div className="flex-1 relative flex flex-col">
                    {children}
                </div>
            </main>
        </div>
    );
}
