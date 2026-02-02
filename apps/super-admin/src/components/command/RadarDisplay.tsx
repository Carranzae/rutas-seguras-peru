'use client';

import { useEffect, useRef } from 'react';

export interface Device {
    id: string;
    name: string;
    type: 'guide' | 'tourist' | 'agency';
    angle: number;
    distance: number;
    status: 'active' | 'warning' | 'sos' | 'offline';
    ping: number;
    battery: number;
}

interface RadarDisplayProps {
    devices?: Device[];
}

export default function RadarDisplay({ devices = [] }: RadarDisplayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sweepAngle = useRef(0);

    // Initialize mock devices REMOVED - Using props
    // If no devices provided (e.g. initial load), we show empty radar or could show waiting state



    // Animate radar
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        let animationId: number;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Background
            ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Radar circles
            for (let i = 1; i <= 4; i++) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, (radius / 4) * i, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(0, 242, 255, 0.15)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // Cross lines
            ctx.beginPath();
            ctx.moveTo(centerX - radius, centerY);
            ctx.lineTo(centerX + radius, centerY);
            ctx.moveTo(centerX, centerY - radius);
            ctx.lineTo(centerX, centerY + radius);
            ctx.strokeStyle = 'rgba(0, 242, 255, 0.1)';
            ctx.stroke();

            // Sweep
            const gradient = ctx.createConicGradient(
                sweepAngle.current * (Math.PI / 180),
                centerX,
                centerY
            );
            gradient.addColorStop(0, 'rgba(0, 242, 255, 0.3)');
            gradient.addColorStop(0.1, 'rgba(0, 242, 255, 0)');
            gradient.addColorStop(1, 'rgba(0, 242, 255, 0)');

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Sweep line
            const sweepX = centerX + Math.cos(sweepAngle.current * (Math.PI / 180)) * radius;
            const sweepY = centerY + Math.sin(sweepAngle.current * (Math.PI / 180)) * radius;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(sweepX, sweepY);
            ctx.strokeStyle = 'rgba(0, 242, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw devices
            devices.forEach((device) => {
                const x = centerX + Math.cos(device.angle * (Math.PI / 180)) * (radius * device.distance);
                const y = centerY + Math.sin(device.angle * (Math.PI / 180)) * (radius * device.distance);

                // Determine color based on status
                let color = '#00f2ff';
                if (device.status === 'warning') color = '#f59e0b';
                if (device.status === 'sos') color = '#ef4444';
                if (device.status === 'offline') color = '#475569';

                // Glow effect
                ctx.beginPath();
                ctx.arc(x, y, device.status === 'sos' ? 12 : 8, 0, Math.PI * 2);
                const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, device.status === 'sos' ? 12 : 8);
                glowGradient.addColorStop(0, color);
                glowGradient.addColorStop(1, 'transparent');
                ctx.fillStyle = glowGradient;
                ctx.fill();

                // Core dot
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();

                // SOS ripple effect
                if (device.status === 'sos') {
                    const pulseSize = 20 + Math.sin(Date.now() / 200) * 5;
                    ctx.beginPath();
                    ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            });

            // Center dot
            ctx.beginPath();
            ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#00f2ff';
            ctx.fill();

            // Update sweep angle
            sweepAngle.current = (sweepAngle.current + 1) % 360;

            animationId = requestAnimationFrame(draw);
        };

        draw();

        return () => cancelAnimationFrame(animationId);
    }, [devices]);

    return (
        <div className="glass-panel p-4 relative">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00f2ff] animate-pulse" />
                    <h3 className="font-telemetry text-[#00f2ff]">SATELLITE UPLINK</h3>
                </div>
                <span className="font-telemetry text-xs text-[#10b981]">● CONNECTED</span>
            </div>

            <div className="flex justify-center">
                <canvas
                    ref={canvasRef}
                    width={280}
                    height={280}
                    className="rounded-full border border-[rgba(0,242,255,0.2)]"
                />
            </div>

            {/* Status indicators */}
            <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="text-center p-2 bg-[rgba(0,242,255,0.1)] rounded">
                    <p className="font-telemetry text-xs text-[#64748b]">TRACKED</p>
                    <p className="font-telemetry text-lg text-[#00f2ff]">{devices.filter(d => d.status !== 'offline').length}</p>
                </div>
                <div className="text-center p-2 bg-[rgba(245,158,11,0.1)] rounded">
                    <p className="font-telemetry text-xs text-[#64748b]">WARNING</p>
                    <p className="font-telemetry text-lg text-[#f59e0b]">{devices.filter(d => d.status === 'warning').length}</p>
                </div>
                <div className="text-center p-2 bg-[rgba(239,68,68,0.1)] rounded">
                    <p className="font-telemetry text-xs text-[#64748b]">SOS</p>
                    <p className="font-telemetry text-lg text-[#ef4444]">{devices.filter(d => d.status === 'sos').length}</p>
                </div>
            </div>
        </div>
    );
}
