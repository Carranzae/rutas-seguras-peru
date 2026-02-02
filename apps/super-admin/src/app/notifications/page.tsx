'use client';

import { getAuthToken } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Notification {
    id: string;
    type: 'emergency' | 'booking' | 'payment' | 'verification' | 'system';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
}

const typeIcons: Record<string, string> = {
    emergency: '🆘',
    booking: '📋',
    payment: '💳',
    verification: '✅',
    system: '⚙️',
};

const typeColors: Record<string, { bg: string; text: string }> = {
    emergency: { bg: 'bg-red-500/20', text: 'text-red-400' },
    booking: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    payment: { bg: 'bg-green-500/20', text: 'text-green-400' },
    verification: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
    system: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
};

// Mock notifications - in real app would come from backend
const mockNotifications: Notification[] = [
    { id: '1', type: 'emergency', title: 'SOS Activado', message: 'Turista activó SOS en Machu Picchu', timestamp: new Date().toISOString(), read: false },
    { id: '2', type: 'booking', title: 'Nueva Reserva', message: '3 personas reservaron Valle Sagrado Express', timestamp: new Date(Date.now() - 3600000).toISOString(), read: false },
    { id: '3', type: 'verification', title: 'Guía Pendiente', message: 'Juan Carlos Quispe espera verificación DIRCETUR', timestamp: new Date(Date.now() - 7200000).toISOString(), read: false },
    { id: '4', type: 'payment', title: 'Pago Completado', message: 'S/ 450.00 recibido por Machu Picchu Full Day', timestamp: new Date(Date.now() - 14400000).toISOString(), read: true },
    { id: '5', type: 'system', title: 'Actualización del Sistema', message: 'Nueva versión del análisis de IA disponible', timestamp: new Date(Date.now() - 86400000).toISOString(), read: true },
];

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        if (!getAuthToken()) {
            router.push('/login');
            return;
        }
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const filteredNotifications = notifications.filter(n =>
        filter === 'all' || n.type === filter || (filter === 'unread' && !n.read)
    );

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} horas`;
        return date.toLocaleDateString('es-PE');
    };

    return (
        <div className="min-h-screen bg-[#101622] p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">🔔 Notificaciones</h1>
                    <p className="text-gray-400">{unreadCount} sin leer</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={markAllAsRead}
                        className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                    >
                        ✓ Marcar todo como leído
                    </button>
                    <Link href="/dashboard" className="px-4 py-2 bg-[#232f48] text-gray-300 rounded-lg hover:bg-[#2a3750]">
                        ← Dashboard
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {['all', 'unread', 'emergency', 'booking', 'payment', 'verification', 'system'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition ${filter === type
                                ? 'bg-[#1152d4] text-white'
                                : 'bg-[#232f48] text-gray-400 hover:text-white'
                            }`}
                    >
                        {type === 'all' ? 'Todas' :
                            type === 'unread' ? 'Sin leer' :
                                typeIcons[type]} {type !== 'all' && type !== 'unread' ? type.charAt(0).toUpperCase() + type.slice(1) : ''}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                    <div className="bg-[#1a2235] rounded-xl p-8 text-center text-gray-500">
                        <p className="text-3xl mb-2">🔔</p>
                        <p>No hay notificaciones</p>
                    </div>
                ) : (
                    filteredNotifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`bg-[#1a2235] rounded-xl border ${notification.read ? 'border-white/5' : 'border-[#1152d4]/30'} p-4 flex items-start gap-4`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${typeColors[notification.type].bg}`}>
                                {typeIcons[notification.type]}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className={`font-medium ${notification.read ? 'text-gray-400' : 'text-white'}`}>
                                            {notification.title}
                                        </h4>
                                        <p className="text-gray-500 text-sm">{notification.message}</p>
                                    </div>
                                    <span className="text-gray-500 text-xs">{formatTime(notification.timestamp)}</span>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    {!notification.read && (
                                        <button
                                            onClick={() => markAsRead(notification.id)}
                                            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30"
                                        >
                                            Marcar como leída
                                        </button>
                                    )}
                                    {notification.type === 'emergency' && (
                                        <Link href="/crisis" className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30">
                                            Ver emergencia
                                        </Link>
                                    )}
                                    {notification.type === 'verification' && (
                                        <Link href="/guides" className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs hover:bg-yellow-500/30">
                                            Ver pendientes
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => deleteNotification(notification.id)}
                                        className="px-3 py-1 bg-white/5 text-gray-400 rounded text-xs hover:bg-white/10"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                            {!notification.read && (
                                <div className="w-2 h-2 bg-[#1152d4] rounded-full mt-2"></div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
