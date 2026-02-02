'use client';

import { useEffect, useState } from 'react';

interface ActivityEvent {
    id: string;
    type: 'login' | 'sos' | 'transaction' | 'verification' | 'tour' | 'system';
    message: string;
    actor: string;
    timestamp: Date;
    priority: 'low' | 'medium' | 'high' | 'critical';
}

export default function ActivityStream() {
    const [events, setEvents] = useState<ActivityEvent[]>([]);

    useEffect(() => {
        const initialEvents: ActivityEvent[] = [
            { id: '1', type: 'sos', message: 'SOS ACTIVATED by tourist María García', actor: 'TR-9999', timestamp: new Date(), priority: 'critical' },
            { id: '2', type: 'transaction', message: 'Payment processed: S/ 450.00', actor: 'Peru Adventure Tours', timestamp: new Date(Date.now() - 60000), priority: 'medium' },
            { id: '3', type: 'verification', message: 'Biometric scan completed', actor: 'GD-7842', timestamp: new Date(Date.now() - 120000), priority: 'low' },
            { id: '4', type: 'tour', message: 'Tour started: Machu Picchu Express', actor: 'GD-5521', timestamp: new Date(Date.now() - 180000), priority: 'low' },
            { id: '5', type: 'login', message: 'Agency admin login', actor: 'Cusco Magic Tours', timestamp: new Date(Date.now() - 240000), priority: 'low' },
            { id: '6', type: 'system', message: 'Database backup completed', actor: 'SYSTEM', timestamp: new Date(Date.now() - 300000), priority: 'low' },
        ];
        setEvents(initialEvents);
    }, []);

    const getTypeIcon = (type: ActivityEvent['type']) => {
        switch (type) {
            case 'sos': return '🚨';
            case 'transaction': return '💳';
            case 'verification': return '🔐';
            case 'tour': return '🏔️';
            case 'login': return '👤';
            case 'system': return '⚙️';
            default: return '●';
        }
    };

    const getPriorityColor = (priority: ActivityEvent['priority']) => {
        switch (priority) {
            case 'critical': return 'border-l-[#ef4444] bg-[rgba(239,68,68,0.1)]';
            case 'high': return 'border-l-[#f59e0b] bg-[rgba(245,158,11,0.05)]';
            case 'medium': return 'border-l-[#00f2ff] bg-[rgba(0,242,255,0.05)]';
            default: return 'border-l-[#475569] bg-transparent';
        }
    };

    return (
        <div className="glass-panel p-4 h-full overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00f2ff] animate-pulse" />
                    <h3 className="font-telemetry text-[#00f2ff]">ACTIVITY STREAM</h3>
                </div>
                <span className="font-telemetry text-xs text-[#64748b]">LIVE</span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[300px]">
                {events.map((event, index) => (
                    <div
                        key={event.id}
                        className={`
              p-3 rounded border-l-2 transition-all duration-300
              ${getPriorityColor(event.priority)}
              ${event.priority === 'critical' ? 'animate-hud-pulse' : ''}
            `}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2">
                                <span className="text-lg">{getTypeIcon(event.type)}</span>
                                <div>
                                    <p className={`text-sm ${event.priority === 'critical' ? 'text-[#ef4444] font-bold' : 'text-[#e2e8f0]'}`}>
                                        {event.message}
                                    </p>
                                    <p className="font-telemetry text-xs text-[#64748b] mt-1">
                                        {event.actor}
                                    </p>
                                </div>
                            </div>
                            <span className="font-telemetry text-xs text-[#475569]">
                                {event.timestamp.toLocaleTimeString('en-US', { hour12: false })}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Gradient fade at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none" />
        </div>
    );
}
