'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function TranslationConfig() {
    const [languages, setLanguages] = useState([
        { code: 'es', name: 'Spanish', enabled: true, primary: true },
        { code: 'en', name: 'English', enabled: true, primary: false },
        { code: 'pt', name: 'Portuguese', enabled: true, primary: false },
        { code: 'fr', name: 'French', enabled: true, primary: false },
        { code: 'de', name: 'German', enabled: true, primary: false },
        { code: 'zh', name: 'Chinese', enabled: false, primary: false },
        { code: 'ja', name: 'Japanese', enabled: false, primary: false },
        { code: 'ko', name: 'Korean', enabled: false, primary: false },
    ]);

    const translationStats = {
        totalTranslations: 12450,
        avgResponseTime: '0.8s',
        accuracy: '98.5%',
        activeUsers: 328,
    };

    return (
        <div className="min-h-screen bg-[#101622]">
            <header className="border-b border-[#324467] px-6 py-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10">←</Link>
                    <div>
                        <h1 className="text-white font-bold text-xl">Translation Config</h1>
                        <p className="text-[#92a4c9] text-sm">AI Voice Translator settings</p>
                    </div>
                </div>
            </header>

            <div className="p-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-[#192233] rounded-xl border border-[#324467] p-5">
                        <p className="text-[#92a4c9] text-xs uppercase">Total Translations</p>
                        <p className="text-white text-3xl font-bold mt-2">{translationStats.totalTranslations.toLocaleString()}</p>
                        <p className="text-[#92a4c9] text-sm mt-1">This month</p>
                    </div>
                    <div className="bg-[#192233] rounded-xl border border-[#324467] p-5">
                        <p className="text-[#92a4c9] text-xs uppercase">Response Time</p>
                        <p className="text-white text-3xl font-bold mt-2">{translationStats.avgResponseTime}</p>
                        <p className="text-[#10b981] text-sm mt-1">↓ 0.2s vs avg</p>
                    </div>
                    <div className="bg-[#192233] rounded-xl border border-[#324467] p-5">
                        <p className="text-[#92a4c9] text-xs uppercase">Accuracy</p>
                        <p className="text-white text-3xl font-bold mt-2">{translationStats.accuracy}</p>
                        <p className="text-[#10b981] text-sm mt-1">Excellent</p>
                    </div>
                    <div className="bg-[#192233] rounded-xl border border-[#324467] p-5">
                        <p className="text-[#92a4c9] text-xs uppercase">Active Users</p>
                        <p className="text-white text-3xl font-bold mt-2">{translationStats.activeUsers}</p>
                        <p className="text-[#92a4c9] text-sm mt-1">Using now</p>
                    </div>
                </div>

                {/* Languages */}
                <div className="bg-[#192233] rounded-xl border border-[#324467] p-6 mb-6">
                    <h2 className="text-white font-bold text-lg mb-4">🌐 Supported Languages</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {languages.map((lang) => (
                            <div key={lang.code} className={`p-4 rounded-xl border transition-all ${lang.enabled ? 'bg-[#1152d4]/10 border-[#1152d4]/30' : 'bg-[#101622] border-[#324467]'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-2xl">{lang.code === 'es' ? '🇪🇸' : lang.code === 'en' ? '🇺🇸' : lang.code === 'pt' ? '🇧🇷' : lang.code === 'fr' ? '🇫🇷' : lang.code === 'de' ? '🇩🇪' : lang.code === 'zh' ? '🇨🇳' : lang.code === 'ja' ? '🇯🇵' : '🇰🇷'}</span>
                                    <button onClick={() => setLanguages(languages.map(l => l.code === lang.code ? { ...l, enabled: !l.enabled } : l))} className={`w-10 h-6 rounded-full transition-all ${lang.enabled ? 'bg-[#10b981]' : 'bg-[#324467]'} relative`}>
                                        <span className={`absolute w-4 h-4 rounded-full bg-white top-1 transition-all ${lang.enabled ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>
                                <p className="text-white font-medium">{lang.name}</p>
                                <p className="text-[#92a4c9] text-xs">{lang.code.toUpperCase()}</p>
                                {lang.primary && <span className="inline-block mt-2 px-2 py-1 bg-[#1152d4]/20 text-[#1152d4] text-xs rounded">Primary</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Settings */}
                <div className="bg-[#192233] rounded-xl border border-[#324467] p-6">
                    <h2 className="text-white font-bold text-lg mb-4">🤖 AI Model Settings</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-[#101622] rounded-lg">
                            <div>
                                <p className="text-white font-medium">Real-time Voice Recognition</p>
                                <p className="text-[#92a4c9] text-xs">Process voice input in real-time</p>
                            </div>
                            <div className="w-10 h-6 rounded-full bg-[#10b981] relative"><span className="absolute w-4 h-4 rounded-full bg-white top-1 right-1" /></div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-[#101622] rounded-lg">
                            <div>
                                <p className="text-white font-medium">Context-aware Translation</p>
                                <p className="text-[#92a4c9] text-xs">Include tourism-specific vocabulary</p>
                            </div>
                            <div className="w-10 h-6 rounded-full bg-[#10b981] relative"><span className="absolute w-4 h-4 rounded-full bg-white top-1 right-1" /></div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-[#101622] rounded-lg">
                            <div>
                                <p className="text-white font-medium">Offline Mode</p>
                                <p className="text-[#92a4c9] text-xs">Download language packs for offline use</p>
                            </div>
                            <div className="w-10 h-6 rounded-full bg-[#324467] relative"><span className="absolute w-4 h-4 rounded-full bg-white top-1 left-1" /></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
