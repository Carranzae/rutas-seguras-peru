'use client';

import { useEffect, useState } from 'react';

interface TelemetryData {
    id: string;
    type: 'ping' | 'auth' | 'device' | 'alert' | 'system';
    message: string;
    timestamp: Date;
    status: 'success' | 'warning' | 'error' | 'info';
}

export default function TelemetryFeed() {
    const [logs, setLogs] = useState<TelemetryData[]>([]);

    useEffect(() => {
        // Simulate telemetry stream
        const mockLogs: TelemetryData[] = [
            { id: '1', type: 'ping', message: 'PING: 45ms | NODE_CUSCO_01', timestamp: new Date(), status: 'success' },
            { id: '2', type: 'device', message: 'DEVICE_ID: GD-7842 | ACTIVE', timestamp: new Date(), status: 'info' },
            { id: '3', type: 'auth', message: 'AUTH: JWT_VERIFIED | AGENCY_012', timestamp: new Date(), status: 'success' },
            { id: '4', type: 'system', message: 'UPLINK: SATELLITE_CONNECTED', timestamp: new Date(), status: 'success' },
            { id: '5', type: 'ping', message: 'PING: 78ms | NODE_LIMA_02', timestamp: new Date(), status: 'warning' },
        ];
        setLogs(mockLogs);

        // Add new log every 2 seconds
        const interval = setInterval(() => {
            const types: TelemetryData['type'][] = ['ping', 'auth', 'device', 'system'];
            const statuses: TelemetryData['status'][] = ['success', 'warning', 'info'];
            const messages = [
                'PING: ' + (Math.floor(Math.random() * 100) + 20) + 'ms | NODE_' + ['CUSCO', 'LIMA', 'AREQUIPA', 'PUNO'][Math.floor(Math.random() * 4)] + '_0' + (Math.floor(Math.random() * 9) + 1),
                'DEVICE_ID: GD-' + (Math.floor(Math.random() * 9000) + 1000) + ' | ACTIVE',
                'AUTH: TOKEN_REFRESH | USER_' + (Math.floor(Math.random() * 900) + 100),
                'GPS_UPDATE: LAT -' + (12 + Math.random()).toFixed(4) + ' | SYNCED',
                'HEARTBEAT: OK | SYSTEM_STABLE',
            ];

            const newLog: TelemetryData = {
                id: Date.now().toString(),
                type: types[Math.floor(Math.random() * types.length)],
                message: messages[Math.floor(Math.random() * messages.length)],
                timestamp: new Date(),
                status: statuses[Math.floor(Math.random() * statuses.length)],
            };

            setLogs(prev => [newLog, ...prev.slice(0, 19)]);
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: TelemetryData['status']) => {
        switch (status) {
            case 'success': return 'text-[#10b981]';
            case 'warning': return 'text-[#f59e0b]';
            case 'error': return 'text-[#ef4444]';
            default: return 'text-[#00f2ff]';
        }
    };

    return (
        <div className="glass-panel h-full p-4">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#00f2ff] animate-pulse" />
                <h3 className="font-telemetry text-[#00f2ff]">TELEMETRY FEED</h3>
            </div>

            <div className="space-y-1 overflow-hidden">
                {logs.map((log, index) => (
                    <div
                        key={log.id}
                        className={`font-telemetry text-xs py-1 border-b border-[#1e293b] ${getStatusColor(log.status)}`}
                        style={{
                            opacity: 1 - (index * 0.04),
                            animationDelay: `${index * 100}ms`
                        }}
                    >
                        <span className="text-[#475569]">
                            {log.timestamp.toLocaleTimeString('en-US', { hour12: false })}
                        </span>
                        {' // '}
                        {log.message}
                    </div>
                ))}
            </div>

            {/* Data Stream Effect */}
            <div className="absolute right-0 top-0 bottom-0 w-1 overflow-hidden opacity-30">
                <div className="h-8 w-full bg-gradient-to-b from-transparent via-[#00f2ff] to-transparent animate-data-stream" />
            </div>
        </div>
    );
}
