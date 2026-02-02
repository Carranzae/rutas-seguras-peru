'use client';

import { useEffect, useState } from 'react';

interface BiometricData {
    id: string;
    name: string;
    photo: string;
    agency: string;
    status: 'scanning' | 'verified' | 'rejected' | 'pending';
    scanProgress: number;
    matchScore?: number;
    documentVerified: boolean;
}

export default function BiometricScanner() {
    const [scans, setScans] = useState<BiometricData[]>([]);
    const [activeScan, setActiveScan] = useState<BiometricData | null>(null);

    useEffect(() => {
        const mockScans: BiometricData[] = [
            { id: '1', name: 'Carlos Mendoza', photo: 'CM', agency: 'Peru Adventure', status: 'scanning', scanProgress: 45, documentVerified: true },
            { id: '2', name: 'Ana Torres', photo: 'AT', agency: 'Cusco Magic', status: 'verified', scanProgress: 100, matchScore: 98.7, documentVerified: true },
            { id: '3', name: 'Luis Vargas', photo: 'LV', agency: 'Inca Trail Pro', status: 'pending', scanProgress: 0, documentVerified: false },
        ];
        setScans(mockScans);
        setActiveScan(mockScans[0]);

        // Simulate scan progress
        const interval = setInterval(() => {
            setScans(prev => prev.map(scan => {
                if (scan.status === 'scanning' && scan.scanProgress < 100) {
                    const newProgress = Math.min(scan.scanProgress + 5, 100);
                    return {
                        ...scan,
                        scanProgress: newProgress,
                        status: newProgress >= 100 ? 'verified' : 'scanning',
                        matchScore: newProgress >= 100 ? 97.3 : undefined,
                    };
                }
                return scan;
            }));
        }, 200);

        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: BiometricData['status']) => {
        switch (status) {
            case 'verified': return '#10b981';
            case 'rejected': return '#ef4444';
            case 'scanning': return '#00f2ff';
            default: return '#64748b';
        }
    };

    return (
        <div className="glass-panel p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00f2ff] animate-pulse" />
                    <h3 className="font-telemetry text-[#00f2ff]">BIOMETRIC SCANNER</h3>
                </div>
                <span className="font-telemetry text-xs text-[#64748b]">{scans.length} PENDING</span>
            </div>

            {/* Active Scan Display */}
            {activeScan && (
                <div className="relative mb-4">
                    {/* Photo Container */}
                    <div className="relative w-32 h-32 mx-auto rounded-lg overflow-hidden border-2 border-[rgba(0,242,255,0.3)]">
                        {/* Placeholder Avatar */}
                        <div className="w-full h-full bg-gradient-to-br from-[#1e293b] to-[#0f172a] flex items-center justify-center">
                            <span className="text-4xl font-bold text-[#475569]">{activeScan.photo}</span>
                        </div>

                        {/* Scan Line Effect */}
                        {activeScan.status === 'scanning' && (
                            <div
                                className="absolute left-0 right-0 h-1 bg-gradient-to-b from-transparent via-[#00f2ff] to-transparent"
                                style={{
                                    top: `${activeScan.scanProgress}%`,
                                    boxShadow: '0 0 20px rgba(0,242,255,0.8)',
                                }}
                            />
                        )}

                        {/* Status Overlay */}
                        {activeScan.status === 'verified' && (
                            <div className="absolute inset-0 bg-[rgba(16,185,129,0.2)] flex items-center justify-center border-2 border-[#10b981]">
                                <span className="text-4xl">✓</span>
                            </div>
                        )}
                        {activeScan.status === 'rejected' && (
                            <div className="absolute inset-0 bg-[rgba(239,68,68,0.2)] flex items-center justify-center border-2 border-[#ef4444]">
                                <span className="text-4xl">✕</span>
                            </div>
                        )}
                    </div>

                    {/* Scan Info */}
                    <div className="text-center mt-3">
                        <p className="font-medium text-[#e2e8f0]">{activeScan.name}</p>
                        <p className="font-telemetry text-xs text-[#64748b]">{activeScan.agency}</p>
                    </div>

                    {/* Progress Bar */}
                    {activeScan.status === 'scanning' && (
                        <div className="mt-3">
                            <div className="h-1 bg-[#1e293b] rounded overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#00f2ff] to-[#0891b2] transition-all duration-200"
                                    style={{ width: `${activeScan.scanProgress}%` }}
                                />
                            </div>
                            <p className="font-telemetry text-xs text-center mt-1 text-[#00f2ff]">
                                ANALYZING... {activeScan.scanProgress}%
                            </p>
                        </div>
                    )}

                    {/* Match Score */}
                    {activeScan.matchScore && (
                        <div className="mt-3 text-center">
                            <p className="font-telemetry text-xs text-[#64748b]">MATCH SCORE</p>
                            <p className="font-telemetry text-2xl text-glow-green">{activeScan.matchScore}%</p>
                        </div>
                    )}
                </div>
            )}

            {/* Scan Queue */}
            <div className="border-t border-[#1e293b] pt-3 mt-3">
                <p className="font-telemetry text-xs text-[#64748b] mb-2">QUEUE</p>
                <div className="space-y-2">
                    {scans.map((scan) => (
                        <div
                            key={scan.id}
                            className="flex items-center justify-between p-2 rounded bg-[rgba(0,242,255,0.05)] cursor-pointer hover:bg-[rgba(0,242,255,0.1)] transition"
                            onClick={() => setActiveScan(scan)}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center">
                                    <span className="font-telemetry text-xs text-[#64748b]">{scan.photo}</span>
                                </div>
                                <span className="text-sm text-[#e2e8f0]">{scan.name}</span>
                            </div>
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: getStatusColor(scan.status) }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
                <button className="flex-1 py-2 font-telemetry text-xs bg-[rgba(16,185,129,0.2)] text-[#10b981] rounded border border-[#10b981] hover:bg-[rgba(16,185,129,0.3)] transition">
                    ✓ APPROVE
                </button>
                <button className="flex-1 py-2 font-telemetry text-xs bg-[rgba(239,68,68,0.2)] text-[#ef4444] rounded border border-[#ef4444] hover:bg-[rgba(239,68,68,0.3)] transition">
                    ✕ REJECT
                </button>
            </div>
        </div>
    );
}
