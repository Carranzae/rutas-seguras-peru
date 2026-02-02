'use client';



import { useEffect, useState } from 'react';

interface KPIData {
    id: string;
    label: string;
    value: number | string;
    suffix?: string;
    prefix?: string;
    trend?: 'up' | 'down' | 'stable';
    trendValue?: string;
    status: 'normal' | 'warning' | 'critical' | 'success';
    icon: string;
}

function HoloCard({ kpi, index }: { kpi: KPIData; index: number }) {
    const [displayValue, setDisplayValue] = useState(0);
    const numericValue = typeof kpi.value === 'number' ? kpi.value : parseFloat(kpi.value.toString()) || 0;

    useEffect(() => {
        // Animate number counting
        const duration = 1000;
        const steps = 30;
        const increment = numericValue / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= numericValue) {
                setDisplayValue(numericValue);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [numericValue]);

    const getStatusColor = () => {
        switch (kpi.status) {
            case 'critical': return '#ef4444';
            case 'warning': return '#f59e0b';
            case 'success': return '#10b981';
            default: return '#00f2ff';
        }
    };

    const getStatusGlow = () => {
        switch (kpi.status) {
            case 'critical': return '0 0 20px rgba(239,68,68,0.4)';
            case 'warning': return '0 0 15px rgba(245,158,11,0.3)';
            case 'success': return '0 0 15px rgba(16,185,129,0.3)';
            default: return '0 0 15px rgba(0,242,255,0.3)';
        }
    };

    return (
        <div
            className={`
        glass-panel p-4 border-l-4 glass-panel-hover transition-all duration-300
        ${kpi.status === 'critical' ? 'animate-hud-pulse' : ''}
      `}
            style={{
                borderLeftColor: getStatusColor(),
                boxShadow: getStatusGlow(),
                animationDelay: `${index * 100}ms`,
            }}
        >
            {/* Icon and Label */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{kpi.icon}</span>
                <span className="font-telemetry text-xs text-[#64748b]">{kpi.label}</span>
            </div>

            {/* Value */}
            <div className="flex items-end justify-between">
                <div>
                    <span
                        className="font-telemetry text-3xl font-bold"
                        style={{ color: getStatusColor() }}
                    >
                        {kpi.prefix}{typeof kpi.value === 'number' ? displayValue.toLocaleString() : kpi.value}{kpi.suffix}
                    </span>
                </div>

                {/* Trend */}
                {kpi.trend && (
                    <div className={`flex items-center gap-1 font-telemetry text-xs ${kpi.trend === 'up' && kpi.status !== 'critical' ? 'text-[#10b981]' :
                        kpi.trend === 'up' && kpi.status === 'critical' ? 'text-[#ef4444]' :
                            kpi.trend === 'down' ? 'text-[#10b981]' :
                                'text-[#64748b]'
                        }`}>
                        {kpi.trend === 'up' && '▲'}
                        {kpi.trend === 'down' && '▼'}
                        {kpi.trend === 'stable' && '●'}
                        {kpi.trendValue}
                    </div>
                )}
            </div>

            {/* Holographic line effect */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-current to-transparent opacity-30" style={{ color: getStatusColor() }} />
        </div>
    );
}

export interface DashboardStats {
    total_users: number;
    total_agencies: number;
    total_guides: number;
    total_tours: number;
    total_emergencies: number;
    total_revenue: number;
    platform_earnings: number;
    pending_verifications: number;
    active_emergencies: number;
}

export default function HoloKPICards({ data }: { data?: DashboardStats }) {
    // If no data, show loading or empty placeholders
    if (!data) return <div className="text-center font-telemetry animate-pulse text-[#00f2ff]">INITIALIZING DATA STREAM...</div>;

    const kpis: KPIData[] = [
        {
            id: 'users',
            label: 'TOTAL USERS',
            value: data.total_users,
            trend: 'up',
            trendValue: '+2', // Mock trend for now or calc if we had history
            status: 'normal',
            icon: '👥',
        },
        {
            id: 'revenue',
            label: 'REVENUE',
            value: data.platform_earnings,
            prefix: 'S/ ',
            trend: 'up',
            trendValue: '+15%',
            status: 'success',
            icon: '💰',
        },
        {
            id: 'pending',
            label: 'PENDING VERIF.',
            value: data.pending_verifications,
            trend: data.pending_verifications > 0 ? 'up' : 'stable',
            status: data.pending_verifications > 5 ? 'warning' : 'normal',
            icon: '📋',
        },
        {
            id: 'guides',
            label: 'ACTIVE GUIDES',
            value: data.total_guides,
            status: 'success',
            icon: '🧭',
        },
        {
            id: 'agencies',
            label: 'AGENCIES',
            value: data.total_agencies,
            status: 'normal',
            icon: '🏢',
        },
        {
            id: 'emergencies',
            label: 'ACTIVE ALERTS',
            value: data.active_emergencies,
            trend: data.active_emergencies > 0 ? 'up' : 'stable',
            status: data.active_emergencies > 0 ? 'critical' : 'success',
            icon: '🚨',
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {kpis.map((kpi, index) => (
                <HoloCard key={kpi.id} kpi={kpi} index={index} />
            ))}
        </div>
    );
}
