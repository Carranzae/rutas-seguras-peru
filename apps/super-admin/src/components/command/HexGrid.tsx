'use client';

import { useEffect, useState } from 'react';

interface Region {
    id: string;
    name: string;
    code: string;
    status: 'normal' | 'warning' | 'sos' | 'offline';
    activeDevices: number;
    emergencies: number;
}

const regions: Region[] = [
    { id: '1', name: 'Lima', code: 'LIM', status: 'normal', activeDevices: 45, emergencies: 0 },
    { id: '2', name: 'Cusco', code: 'CUS', status: 'sos', activeDevices: 128, emergencies: 1 },
    { id: '3', name: 'Arequipa', code: 'AQP', status: 'normal', activeDevices: 32, emergencies: 0 },
    { id: '4', name: 'Puno', code: 'PUN', status: 'warning', activeDevices: 18, emergencies: 0 },
    { id: '5', name: 'Iquitos', code: 'IQT', status: 'normal', activeDevices: 12, emergencies: 0 },
    { id: '6', name: 'Trujillo', code: 'TRU', status: 'normal', activeDevices: 25, emergencies: 0 },
    { id: '7', name: 'Piura', code: 'PIU', status: 'offline', activeDevices: 0, emergencies: 0 },
];

function HexCell({ region, index }: { region: Region; index: number }) {
    const [isGlitching, setIsGlitching] = useState(false);

    useEffect(() => {
        if (region.status === 'sos') {
            const interval = setInterval(() => {
                setIsGlitching(true);
                setTimeout(() => setIsGlitching(false), 100);
            }, 500);
            return () => clearInterval(interval);
        }
    }, [region.status]);

    const getStatusStyles = () => {
        switch (region.status) {
            case 'sos':
                return 'border-[#ef4444] bg-[rgba(239,68,68,0.15)] animate-sos-pulse';
            case 'warning':
                return 'border-[#f59e0b] bg-[rgba(245,158,11,0.1)]';
            case 'offline':
                return 'border-[#475569] bg-[rgba(71,85,105,0.1)] opacity-50';
            default:
                return 'border-[rgba(0,242,255,0.3)] bg-[rgba(0,242,255,0.05)] hover:border-[#00f2ff]';
        }
    };

    return (
        <div
            className={`
        relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer
        ${getStatusStyles()}
        ${isGlitching ? 'glitch-effect' : ''}
      `}
            style={{
                clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                minHeight: '120px',
            }}
        >
            <div className="text-center">
                <p className={`font-telemetry text-lg font-bold ${region.status === 'sos' ? 'text-glow-red' :
                        region.status === 'warning' ? 'text-glow-amber' :
                            region.status === 'offline' ? 'text-[#475569]' :
                                'text-glow-cyan'
                    }`}>
                    {region.code}
                </p>
                <p className="font-telemetry text-xs text-[#64748b] mt-1">{region.name}</p>
                <div className="mt-2">
                    <p className="font-telemetry text-xs">
                        <span className="text-[#64748b]">DEV: </span>
                        <span className="text-[#00f2ff]">{region.activeDevices}</span>
                    </p>
                    {region.emergencies > 0 && (
                        <p className="font-telemetry text-xs text-[#ef4444] animate-pulse">
                            🚨 {region.emergencies} SOS
                        </p>
                    )}
                </div>
            </div>

            {/* Status indicator dot */}
            <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${region.status === 'sos' ? 'bg-[#ef4444] animate-pulse' :
                    region.status === 'warning' ? 'bg-[#f59e0b]' :
                        region.status === 'offline' ? 'bg-[#475569]' :
                            'bg-[#10b981]'
                }`} />
        </div>
    );
}

export default function HexGrid() {
    return (
        <div className="glass-panel p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00f2ff] animate-pulse" />
                    <h3 className="font-telemetry text-[#00f2ff]">NERVE CENTER MATRIX</h3>
                </div>
                <span className="font-telemetry text-xs text-[#64748b]">7 REGIONS</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {regions.map((region, index) => (
                    <HexCell key={region.id} region={region} index={index} />
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-[#1e293b]">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                    <span className="font-telemetry text-xs text-[#64748b]">NORMAL</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                    <span className="font-telemetry text-xs text-[#64748b]">WARNING</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
                    <span className="font-telemetry text-xs text-[#64748b]">SOS</span>
                </div>
            </div>
        </div>
    );
}
