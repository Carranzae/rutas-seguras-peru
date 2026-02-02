'use client';

import { useEffect, useState } from 'react';

interface SOSAlert {
    id: string;
    touristName: string;
    touristId: string;
    guideName: string;
    guideId: string;
    agency: string;
    location: { lat: number; lng: number };
    address: string;
    timestamp: Date;
    severity: 'critical' | 'high' | 'medium';
    batteryLevel: number;
    signalStrength: number;
    gpsHistory: { lat: number; lng: number; time: Date }[];
}

interface Props {
    alert: SOSAlert | null;
    onClose: () => void;
}

export default function SOSOverlay({ alert, onClose }: Props) {
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        if (!alert) return;

        const start = alert.timestamp.getTime();
        const interval = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - start) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [alert]);

    if (!alert) return null;

    const formatElapsedTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Darkened background */}
            <div className="absolute inset-0 bg-[rgba(2,6,23,0.9)]" onClick={onClose} />

            {/* Red pulsing border */}
            <div className="emergency-border" />

            {/* Main Panel */}
            <div className="relative z-10 w-full max-w-4xl mx-4 animate-hud-pulse">
                <div className="glass-panel border-2 border-[#ef4444] p-6" style={{ boxShadow: '0 0 60px rgba(239,68,68,0.5)' }}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-4 h-4 rounded-full bg-[#ef4444] animate-pulse" />
                            <h2 className="font-telemetry text-2xl text-glow-red">🚨 EMERGENCY SOS ACTIVE</h2>
                        </div>
                        <div className="text-right">
                            <p className="font-telemetry text-xs text-[#64748b]">ELAPSED TIME</p>
                            <p className="font-telemetry text-3xl text-[#ef4444]">{formatElapsedTime(elapsedTime)}</p>
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-3 gap-6">
                        {/* Left - Tourist Info */}
                        <div className="glass-panel p-4 border border-[rgba(239,68,68,0.3)]">
                            <h3 className="font-telemetry text-xs text-[#ef4444] mb-3">TOURIST DATA</h3>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-[#ef4444] bg-opacity-20 flex items-center justify-center border border-[#ef4444]">
                                    <span className="text-xl">👤</span>
                                </div>
                                <div>
                                    <p className="font-medium text-[#e2e8f0]">{alert.touristName}</p>
                                    <p className="font-telemetry text-xs text-[#64748b]">ID: {alert.touristId}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="font-telemetry text-xs text-[#64748b]">BATTERY</span>
                                    <span className={`font-telemetry text-xs ${alert.batteryLevel < 20 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
                                        {alert.batteryLevel}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-telemetry text-xs text-[#64748b]">SIGNAL</span>
                                    <span className="font-telemetry text-xs text-[#f59e0b]">{alert.signalStrength}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Center - Location */}
                        <div className="glass-panel p-4 border border-[rgba(239,68,68,0.3)]">
                            <h3 className="font-telemetry text-xs text-[#ef4444] mb-3">LOCATION</h3>
                            <div className="h-32 bg-[rgba(239,68,68,0.1)] rounded relative overflow-hidden mb-3">
                                {/* Mini map placeholder */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="relative">
                                        <div className="w-4 h-4 bg-[#ef4444] rounded-full animate-pulse" />
                                        <div className="absolute inset-0 w-8 h-8 -m-2 border-2 border-[#ef4444] rounded-full animate-ping" />
                                    </div>
                                </div>
                                {/* Trajectory line */}
                                <svg className="absolute inset-0" viewBox="0 0 100 100">
                                    <path d="M30,70 L40,60 L50,55 L50,50" stroke="#ef4444" strokeWidth="2" fill="none" strokeDasharray="5,5" />
                                </svg>
                            </div>
                            <div className="text-center">
                                <p className="font-telemetry text-xs text-[#64748b]">COORDINATES</p>
                                <p className="font-telemetry text-sm text-[#e2e8f0]">
                                    {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}
                                </p>
                                <p className="font-telemetry text-xs text-[#64748b] mt-1">{alert.address}</p>
                            </div>
                        </div>

                        {/* Right - Guide & Agency */}
                        <div className="glass-panel p-4 border border-[rgba(239,68,68,0.3)]">
                            <h3 className="font-telemetry text-xs text-[#ef4444] mb-3">ASSIGNED GUIDE</h3>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-[#00f2ff] bg-opacity-20 flex items-center justify-center border border-[#00f2ff]">
                                    <span className="text-xl">🎒</span>
                                </div>
                                <div>
                                    <p className="font-medium text-[#e2e8f0]">{alert.guideName}</p>
                                    <p className="font-telemetry text-xs text-[#64748b]">ID: {alert.guideId}</p>
                                </div>
                            </div>
                            <div className="pt-3 border-t border-[#1e293b]">
                                <p className="font-telemetry text-xs text-[#64748b]">AGENCY</p>
                                <p className="text-sm text-[#e2e8f0]">{alert.agency}</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 mt-6">
                        <button className="flex-1 py-3 font-telemetry text-sm bg-[#ef4444] text-white rounded hover:bg-[#dc2626] transition animate-pulse">
                            🚔 DISPATCH EMERGENCY SERVICES
                        </button>
                        <button className="flex-1 py-3 font-telemetry text-sm bg-[rgba(0,242,255,0.2)] text-[#00f2ff] rounded border border-[#00f2ff] hover:bg-[rgba(0,242,255,0.3)] transition">
                            📞 CONTACT GUIDE
                        </button>
                        <button className="flex-1 py-3 font-telemetry text-sm bg-[rgba(245,158,11,0.2)] text-[#f59e0b] rounded border border-[#f59e0b] hover:bg-[rgba(245,158,11,0.3)] transition">
                            📍 SHARE LIVE LOCATION
                        </button>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[rgba(239,68,68,0.2)] text-[#ef4444] flex items-center justify-center hover:bg-[rgba(239,68,68,0.3)] transition"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
}
