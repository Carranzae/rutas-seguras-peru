'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function NationalCommandCenter() {
    const [activeIncident, setActiveIncident] = useState<string | null>(null);

    const stats = {
        activeAlerts: 3,
        activeGuides: 847,
        ongoingTours: 124,
        tourists: 2156,
    };

    const incidents = [
        { id: '1', type: 'sos', title: 'SOS Alert - Machu Picchu', time: '2 min ago', guide: 'Carlos Mendez', tourists: 12, status: 'active', severity: 'critical' },
        { id: '2', type: 'weather', title: 'Weather Warning - Cusco Region', time: '15 min ago', guide: 'System', tourists: 450, status: 'monitoring', severity: 'warning' },
        { id: '3', type: 'medical', title: 'Medical Assistance Request', time: '28 min ago', guide: 'Ana Torres', tourists: 8, status: 'responding', severity: 'high' },
    ];

    return (
        <div className="min-h-screen bg-[#101622]">
            {/* Header */}
            <header className="border-b border-[#324467] px-6 py-4 bg-[#101622] sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10">←</Link>
                    <div className="flex-1">
                        <h1 className="text-white font-bold text-xl flex items-center gap-2">
                            🛡️ National Command Center
                            <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-500 text-xs font-bold rounded uppercase">Live</span>
                        </h1>
                        <p className="text-[#92a4c9] text-sm">Real-time monitoring of all tourism operations</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-red-600">
                            🚨 {stats.activeAlerts} Active Alerts
                        </button>
                    </div>
                </div>
            </header>

            <div className="p-6 flex gap-6">
                {/* Main Content */}
                <div className="flex-1">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-[#192233] rounded-xl p-4 border border-[#324467]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-xl">🚨</div>
                                <div>
                                    <p className="text-red-500 text-2xl font-bold">{stats.activeAlerts}</p>
                                    <p className="text-[#92a4c9] text-xs">Active Alerts</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#192233] rounded-xl p-4 border border-[#324467]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[#10b981]/20 flex items-center justify-center text-xl">👤</div>
                                <div>
                                    <p className="text-white text-2xl font-bold">{stats.activeGuides}</p>
                                    <p className="text-[#92a4c9] text-xs">Active Guides</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#192233] rounded-xl p-4 border border-[#324467]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[#1152d4]/20 flex items-center justify-center text-xl">🗺️</div>
                                <div>
                                    <p className="text-white text-2xl font-bold">{stats.ongoingTours}</p>
                                    <p className="text-[#92a4c9] text-xs">Ongoing Tours</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#192233] rounded-xl p-4 border border-[#324467]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[#6366f1]/20 flex items-center justify-center text-xl">🌎</div>
                                <div>
                                    <p className="text-white text-2xl font-bold">{stats.tourists.toLocaleString()}</p>
                                    <p className="text-[#92a4c9] text-xs">Tourists Today</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map Placeholder */}
                    <div className="bg-[#192233] rounded-xl border border-[#324467] h-[400px] mb-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#192233]/90 z-10" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-[#92a4c9]">🗺️ Real-time Map View</p>
                        </div>
                        {/* Map Markers */}
                        <div className="absolute top-1/4 left-1/3 z-20 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-red-500/50">!</div>
                        </div>
                        <div className="absolute top-1/2 right-1/4 z-20">
                            <div className="w-6 h-6 rounded-full bg-[#10b981] flex items-center justify-center text-white text-xs">12</div>
                        </div>
                        <div className="absolute bottom-1/3 left-1/2 z-20">
                            <div className="w-6 h-6 rounded-full bg-[#1152d4] flex items-center justify-center text-white text-xs">8</div>
                        </div>
                    </div>

                    {/* Incident List */}
                    <div className="bg-[#192233] rounded-xl border border-[#324467]">
                        <div className="px-4 py-3 border-b border-[#324467] flex items-center justify-between">
                            <h3 className="text-white font-bold">Active Incidents</h3>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 bg-red-500/20 text-red-500 text-xs font-bold rounded">Critical</button>
                                <button className="px-3 py-1 bg-white/5 text-white text-xs font-bold rounded">All</button>
                            </div>
                        </div>
                        {incidents.map((incident) => (
                            <div key={incident.id} className={`p-4 border-b border-[#324467] hover:bg-white/5 cursor-pointer ${activeIncident === incident.id ? 'bg-white/5' : ''}`} onClick={() => setActiveIncident(incident.id)}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${incident.severity === 'critical' ? 'bg-red-500/20' : incident.severity === 'high' ? 'bg-orange-500/20' : 'bg-yellow-500/20'}`}>
                                        {incident.type === 'sos' ? '🆘' : incident.type === 'weather' ? '⛈️' : '🏥'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-bold">{incident.title}</p>
                                        <p className="text-[#92a4c9] text-sm">Guide: {incident.guide} • {incident.tourists} tourists affected</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${incident.status === 'active' ? 'bg-red-500/20 text-red-500' : incident.status === 'responding' ? 'bg-orange-500/20 text-orange-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                            {incident.status}
                                        </span>
                                        <p className="text-[#92a4c9] text-xs mt-1">{incident.time}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="w-80 space-y-4">
                    <div className="bg-[#192233] rounded-xl border border-[#324467] p-4">
                        <h3 className="text-white font-bold mb-3">Quick Actions</h3>
                        <div className="space-y-2">
                            <button className="w-full py-3 bg-red-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-600">
                                🚨 Broadcast Emergency Alert
                            </button>
                            <button className="w-full py-3 bg-[#1152d4] text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-600">
                                📢 Send Notification
                            </button>
                            <button className="w-full py-3 bg-white/10 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/20">
                                📊 Generate Report
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#192233] rounded-xl border border-[#324467] p-4">
                        <h3 className="text-white font-bold mb-3">Regional Status</h3>
                        <div className="space-y-3">
                            {[
                                { region: 'Cusco', tours: 45, status: 'warning' },
                                { region: 'Lima', tours: 32, status: 'normal' },
                                { region: 'Arequipa', tours: 18, status: 'normal' },
                                { region: 'Puno', tours: 12, status: 'normal' },
                                { region: 'Iquitos', tours: 8, status: 'alert' },
                            ].map((r, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-white">{r.region}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#92a4c9] text-sm">{r.tours} tours</span>
                                        <div className={`w-2 h-2 rounded-full ${r.status === 'normal' ? 'bg-[#10b981]' : r.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
