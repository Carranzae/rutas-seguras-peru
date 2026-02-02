'use client';

import { authService } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError('Ingresa email y contraseña');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await authService.login({ email, password });

            // Check if user is super admin (backend returns 'super_admin')
            if (response.user.role.toLowerCase() !== 'super_admin') {
                setError('Acceso denegado. Solo super administradores.');
                authService.logout();
                return;
            }

            // Redirect to dashboard
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    const fillTestCredentials = () => {
        setEmail('admin@rutaseguraperu.com');
        setPassword('Admin123!');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0f1c] via-[#101622] to-[#0d1525]">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#1152d4]/20 mb-4">
                        <span className="text-4xl">🛡️</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">Ruta Segura Perú</h1>
                    <p className="text-gray-400 mt-2">Panel de Super Administrador</p>
                </div>

                {/* Login Form */}
                <div className="bg-[#1a2235] rounded-2xl p-8 border border-white/10 shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm text-center">
                                ⚠️ {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Correo Electrónico
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-[#232f48] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1152d4] focus:border-transparent"
                                placeholder="admin@rutaseguraperu.com"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-[#232f48] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1152d4] focus:border-transparent"
                                placeholder="••••••••"
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-[#1152d4] hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Iniciando sesión...
                                </span>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </button>
                    </form>

                    {/* Test Credentials Button */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <button
                            onClick={fillTestCredentials}
                            className="w-full py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl text-sm transition-colors"
                        >
                            🧪 Llenar credenciales de prueba
                        </button>
                        <p className="text-gray-500 text-xs text-center mt-3">
                            admin@rutaseguraperu.com / Admin123!
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-8">
                    © 2026 Ruta Segura Perú - Panel de Control
                </p>
            </div>
        </div>
    );
}
