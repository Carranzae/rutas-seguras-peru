'use client';

import { getAuthToken } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SystemConfig {
    emergency_escalation_minutes: number;
    emergency_sms_enabled: boolean;
    emergency_call_enabled: boolean;
    rate_limit_per_minute: number;
    login_rate_limit_per_minute: number;
    ai_analysis_enabled: boolean;
}

export default function SettingsPage() {
    const router = useRouter();
    const [config, setConfig] = useState<SystemConfig>({
        emergency_escalation_minutes: 5,
        emergency_sms_enabled: true,
        emergency_call_enabled: true,
        rate_limit_per_minute: 60,
        login_rate_limit_per_minute: 5,
        ai_analysis_enabled: true,
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!getAuthToken()) {
            router.push('/login');
            return;
        }
    }, []);

    const handleSave = () => {
        setSaving(true);
        // Simulate save
        setTimeout(() => {
            setSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[#101622] p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">⚙️ Configuración</h1>
                    <p className="text-gray-400">Ajustes del sistema</p>
                </div>
                <Link href="/dashboard" className="px-4 py-2 bg-[#232f48] text-gray-300 rounded-lg hover:bg-[#2a3750]">
                    ← Dashboard
                </Link>
            </div>

            {/* Success message */}
            {saved && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6 text-green-400">
                    ✅ Configuración guardada correctamente
                </div>
            )}

            <div className="grid grid-cols-2 gap-6">
                {/* Emergency Settings */}
                <div className="bg-[#1a2235] rounded-xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">🆘 Emergencias</h3>

                    <div className="space-y-6">
                        <div>
                            <label className="text-gray-400 text-sm block mb-2">
                                Tiempo de escalamiento (minutos)
                            </label>
                            <input
                                type="number"
                                value={config.emergency_escalation_minutes}
                                onChange={(e) => setConfig({ ...config, emergency_escalation_minutes: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 bg-[#232f48] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#1152d4]"
                            />
                            <p className="text-gray-500 text-xs mt-1">Tiempo antes de escalar una emergencia no atendida</p>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white">SMS de Emergencia</p>
                                <p className="text-gray-500 text-xs">Enviar SMS a contactos de emergencia</p>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, emergency_sms_enabled: !config.emergency_sms_enabled })}
                                className={`w-12 h-6 rounded-full transition ${config.emergency_sms_enabled ? 'bg-green-500' : 'bg-gray-600'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full transition transform ${config.emergency_sms_enabled ? 'translate-x-6' : 'translate-x-1'}`}></div>
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white">Llamadas de Emergencia</p>
                                <p className="text-gray-500 text-xs">Llamar automáticamente a contactos</p>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, emergency_call_enabled: !config.emergency_call_enabled })}
                                className={`w-12 h-6 rounded-full transition ${config.emergency_call_enabled ? 'bg-green-500' : 'bg-gray-600'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full transition transform ${config.emergency_call_enabled ? 'translate-x-6' : 'translate-x-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="bg-[#1a2235] rounded-xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">🔒 Seguridad</h3>

                    <div className="space-y-6">
                        <div>
                            <label className="text-gray-400 text-sm block mb-2">
                                Rate Limit General (req/min)
                            </label>
                            <input
                                type="number"
                                value={config.rate_limit_per_minute}
                                onChange={(e) => setConfig({ ...config, rate_limit_per_minute: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 bg-[#232f48] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#1152d4]"
                            />
                        </div>

                        <div>
                            <label className="text-gray-400 text-sm block mb-2">
                                Rate Limit Login (intentos/min)
                            </label>
                            <input
                                type="number"
                                value={config.login_rate_limit_per_minute}
                                onChange={(e) => setConfig({ ...config, login_rate_limit_per_minute: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 bg-[#232f48] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#1152d4]"
                            />
                        </div>
                    </div>
                </div>

                {/* AI Settings */}
                <div className="bg-[#1a2235] rounded-xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">🤖 Inteligencia Artificial</h3>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white">Análisis de Seguridad IA</p>
                                <p className="text-gray-500 text-xs">Usar Claude AI para analizar ubicaciones</p>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, ai_analysis_enabled: !config.ai_analysis_enabled })}
                                className={`w-12 h-6 rounded-full transition ${config.ai_analysis_enabled ? 'bg-green-500' : 'bg-gray-600'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full transition transform ${config.ai_analysis_enabled ? 'translate-x-6' : 'translate-x-1'}`}></div>
                            </button>
                        </div>

                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                            <p className="text-purple-400 text-sm font-bold mb-2">Claude claude-sonnet-4-20250514</p>
                            <p className="text-gray-400 text-sm">Análisis cada 2 minutos o inmediato si detecta anomalía.</p>
                        </div>
                    </div>
                </div>

                {/* API Info */}
                <div className="bg-[#1a2235] rounded-xl border border-white/10 p-6">
                    <h3 className="text-xl font-bold text-white mb-6">🔑 API Keys</h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-white/5">
                            <span className="text-gray-400">Anthropic (Claude)</span>
                            <span className="text-green-400 text-sm">✅ Configurada</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-white/5">
                            <span className="text-gray-400">Vonage (SMS/Llamadas)</span>
                            <span className="text-yellow-400 text-sm">⚠️ Pendiente</span>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <span className="text-gray-400">IziPay (Pagos)</span>
                            <span className="text-yellow-400 text-sm">⚠️ Pendiente</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-[#1152d4] text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
                >
                    {saving ? '💾 Guardando...' : '💾 Guardar Cambios'}
                </button>
            </div>
        </div>
    );
}
