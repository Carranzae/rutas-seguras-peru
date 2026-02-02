'use client';

import type { DashboardStats } from '@/components/command/HoloKPICards'; // Import Type
import type { Device } from '@/components/command/RadarDisplay';
import { getAuthToken } from '@/lib/api';
import { api } from '@/services/api'; // Import api
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Dynamic imports to avoid SSR issues with canvas/map
const RadarDisplay = dynamic(() => import('@/components/command/RadarDisplay'), { ssr: false });
const TelemetryFeed = dynamic(() => import('@/components/command/TelemetryFeed'), { ssr: false });
const HexGrid = dynamic(() => import('@/components/command/HexGrid'), { ssr: false });
const HoloKPICards = dynamic(() => import('@/components/command/HoloKPICards'), { ssr: false });
const ActivityStream = dynamic(() => import('@/components/command/ActivityStream'), { ssr: false });
const CommandMap = dynamic(() => import('@/components/map/CommandMap'), { ssr: false });

export default function CommandCenterPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStatus] = useState('OPERATIONAL'); // Removed unused setter setSystemStatus
  const [stats, setStats] = useState<DashboardStats | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'terrain'>('dark');

  // Real-time tracking state
  const [activeLocations, setActiveLocations] = useState<any[]>([]);
  const [activeDevices, setActiveDevices] = useState<Device[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (error: any) {
        console.error("Failed to fetch dashboard stats", error);
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          toast.error("Sesión expirada", { description: "Por favor inicie sesión nuevamente." });
          // Optional: clear token
          localStorage.removeItem('superadmin_token');
          window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const { push } = useRouter();

  // Handle Quick Actions
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'verify-agency':
        push('/agencies?status=pending');
        break;
      case 'verify-guide':
        push('/guides?status=pending');
        break;
      case 'notify':
        toast.info("Sistema de Notificación Masiva", {
          description: "Funcionalidad en desarrollo. Pronto podrás enviar mensajes a todos los usuarios.",
        });
        break;
      case 'reports':
        push('/analytics');
        break;
      case 'tracking':
        const mapElement = document.getElementById('command-map');
        mapElement?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'payments':
        push('/payments');
        break;
    }
  };

  // WebSocket for Live Tracking
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const connectWS = () => {
      // Build proper WebSocket URL - use base URL without /api/v1
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const wsBase = baseUrl.replace('http', 'ws').replace(/\/api\/v1\/?$/, '');
      const wsUrl = `${wsBase}/api/v1/ws/admin?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Command Center WebSocket Connected');
        ws.send(JSON.stringify({ type: 'GET_STATS' }));
        toast.success("CONEXIÓN ESTABLECIDA", {
          description: "Enlace neural con servidor central activo.",
          duration: 3000,
        });
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'INITIAL_STATE') {
            const locs = msg.data.locations || [];
            setActiveLocations(locs);
            updateDevicesFromLocations(locs);
          } else if (msg.type === 'LOCATION_UPDATE') {
            const loc = msg.data;
            setActiveLocations(prev => {
              const newLocs = prev.filter(l => l.user_id !== loc.user_id).concat(loc);
              updateDevicesFromLocations(newLocs);
              return newLocs;
            });

            // Notify if new SOS
            if (loc.status === 'sos' && loc.is_emergency) {
              toast.error("¡ALERTA SOS DETECTADA!", {
                description: `Usuario: ${loc.user_name} requiere asistencia inmediata.`,
                duration: 10000,
                action: {
                  label: "VER EN MAPA",
                  onClick: () => handleQuickAction('tracking'),
                },
              });
            }

          } else if (msg.type === 'STATS') {
            // Optional: update real-time stats from WS
          }
        } catch (e) {
          console.error("WS Parse error", e);
        }
      };

      ws.onclose = () => {
        toast.warning("CONEXIÓN PERDIDA", {
          description: "Reintentando establecer enlace...",
        });
        setTimeout(connectWS, 5000);
      };

      wsRef.current = ws;
    };

    connectWS();

    return () => {
      wsRef.current?.close();
    };
  }, []);

  const updateDevicesFromLocations = (locations: any[]) => {
    // Transform locations to Radar Devices
    const devices: Device[] = locations.map(loc => ({
      id: loc.user_id,
      name: loc.user_name || 'Unknown',
      type: loc.user_type === 'guide' ? 'guide' : 'tourist',
      angle: Math.random() * 360, // Radar angle simulated for visual effect
      distance: Math.random() * 0.8 + 0.1, // Radar distance simulated
      status: loc.status === 'sos' ? 'sos' : 'active',
      ping: Math.floor(Math.random() * 100) + 20,
      battery: loc.battery || 100
    }));
    setActiveDevices(devices);
  };

  return (
    <div className="min-h-screen command-grid-bg relative">
      {/* Scanline Overlay */}
      <div className="scanline-overlay" />

      {/* Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-[rgba(0,242,255,0.2)]">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#00f2ff] animate-pulse" />
              <span className="font-telemetry text-[#00f2ff] text-lg">NEURAL COMMAND CENTER</span>
            </div>
            <span className="font-telemetry text-xs text-[#475569]">|</span>
            <span className="font-telemetry text-xs text-[#64748b]">RUTA SEGURA // SUPER ADMIN</span>
          </div>

          <div className="flex items-center gap-6">
            {/* System Status */}
            <div className="flex items-center gap-2">
              <span className={`font-telemetry text-xs ${systemStatus === 'OPERATIONAL' ? 'text-[#10b981]' : 'text-[#f59e0b]'}`}>
                ● {systemStatus}
              </span>
            </div>

            {/* Time */}
            <div className="text-right">
              {mounted && (
                <>
                  <p className="font-telemetry text-lg text-[#00f2ff]">
                    {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                  </p>
                  <p className="font-telemetry text-xs text-[#475569]">
                    {currentTime.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </>
              )}
            </div>

            {/* Admin Profile */}
            <div className="flex items-center gap-3 pl-4 border-l border-[#1e293b]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00f2ff] to-[#0891b2] flex items-center justify-center">
                <span className="font-telemetry text-xs text-[#020617]">SA</span>
              </div>
              <div>
                <p className="font-telemetry text-xs text-[#e2e8f0]">SUPER ADMIN</p>
                <p className="font-telemetry text-[10px] text-[#475569]">LEVEL: OMEGA</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-6 pb-6">
        {/* KPI Row */}
        <section className="mb-6">
          <HoloKPICards data={stats} />
        </section>

        {/* Action Buttons Row - Quick Actions */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <button onClick={() => handleQuickAction('verify-agency')} className="glass-panel p-3 hover:bg-[#00f2ff]/10 transition flex flex-col items-center gap-2 group border border-transparent hover:border-[#00f2ff]/30">
            <span className="text-2xl group-hover:scale-110 transition">🏢</span>
            <span className="font-telemetry text-[10px] text-[#00f2ff]">VERIFICAR AGENCIA</span>
          </button>
          <button onClick={() => handleQuickAction('verify-guide')} className="glass-panel p-3 hover:bg-[#00f2ff]/10 transition flex flex-col items-center gap-2 group border border-transparent hover:border-[#00f2ff]/30">
            <span className="text-2xl group-hover:scale-110 transition">🎒</span>
            <span className="font-telemetry text-[10px] text-[#00f2ff]">VERIFICAR GUÍA</span>
          </button>
          <button onClick={() => push('/users/tourists')} className="glass-panel p-3 hover:bg-[#00f2ff]/10 transition flex flex-col items-center gap-2 group border border-transparent hover:border-[#00f2ff]/30">
            <span className="text-2xl group-hover:scale-110 transition">👥</span>
            <span className="font-telemetry text-[10px] text-[#00f2ff]">GESTIONAR TURISTAS</span>
          </button>
          <button onClick={() => handleQuickAction('notify')} className="glass-panel p-3 hover:bg-[#00f2ff]/10 transition flex flex-col items-center gap-2 group border border-transparent hover:border-[#00f2ff]/30">
            <span className="text-2xl group-hover:scale-110 transition">🔔</span>
            <span className="font-telemetry text-[10px] text-[#00f2ff]">ENVIAR ALERTAS</span>
          </button>
          <button onClick={() => handleQuickAction('tracking')} className="glass-panel p-3 hover:bg-[#00f2ff]/10 transition flex flex-col items-center gap-2 group border border-transparent hover:border-[#00f2ff]/30">
            <span className="text-2xl group-hover:scale-110 transition">📍</span>
            <span className="font-telemetry text-[10px] text-[#00f2ff]">VER TRACKING</span>
          </button>
          <button onClick={() => handleQuickAction('payments')} className="glass-panel p-3 hover:bg-[#00f2ff]/10 transition flex flex-col items-center gap-2 group border border-transparent hover:border-[#00f2ff]/30">
            <span className="text-2xl group-hover:scale-110 transition">💳</span>
            <span className="font-telemetry text-[10px] text-[#00f2ff]">VER PAGOS</span>
          </button>
          <button onClick={() => push('/verifications')} className="glass-panel p-3 hover:bg-[#f59e0b]/10 transition flex flex-col items-center gap-2 group border border-transparent hover:border-[#f59e0b]/30">
            <span className="text-2xl group-hover:scale-110 transition">🔍</span>
            <span className="font-telemetry text-[10px] text-[#f59e0b]">DEEP SCAN</span>
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Radar & Telemetry */}
          <div className="col-span-3 space-y-6">
            <RadarDisplay devices={activeDevices} />
            <TelemetryFeed />
          </div>

          {/* Center Column - Map & Emergency */}
          <div className="col-span-6 space-y-6">
            {/* Main Map Placeholder */}
            <div id="command-map" className="glass-panel p-4 h-[400px] relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00f2ff] animate-pulse" />
                  <h3 className="font-telemetry text-[#00f2ff]">GLOBAL OPERATIONS MAP</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMapStyle('dark')}
                    className={`font-telemetry text-xs px-2 py-1 rounded transition ${mapStyle === 'dark'
                      ? 'bg-[rgba(0,242,255,0.2)] text-[#00f2ff] border border-[rgba(0,242,255,0.4)]'
                      : 'bg-[rgba(0,242,255,0.05)] text-[#475569] hover:bg-[rgba(0,242,255,0.1)]'
                      }`}
                  >
                    NEURAL
                  </button>
                  <button
                    onClick={() => setMapStyle('satellite')}
                    className={`font-telemetry text-xs px-2 py-1 rounded transition ${mapStyle === 'satellite'
                      ? 'bg-[rgba(0,242,255,0.2)] text-[#00f2ff] border border-[rgba(0,242,255,0.4)]'
                      : 'bg-[rgba(0,242,255,0.05)] text-[#475569] hover:bg-[rgba(0,242,255,0.1)]'
                      }`}
                  >
                    SATELLITE
                  </button>
                  <button
                    onClick={() => setMapStyle('terrain')}
                    className={`font-telemetry text-xs px-2 py-1 rounded transition ${mapStyle === 'terrain'
                      ? 'bg-[rgba(0,242,255,0.2)] text-[#00f2ff] border border-[rgba(0,242,255,0.4)]'
                      : 'bg-[rgba(0,242,255,0.05)] text-[#475569] hover:bg-[rgba(0,242,255,0.1)]'
                      }`}
                  >
                    TERRAIN
                  </button>
                </div>
              </div>

              {/* Map Component with Real Data */}
              <div className="absolute inset-0 top-14">
                <CommandMap
                  externalLocations={activeLocations}
                  mapStyle={mapStyle}
                />
              </div>

              {/* Hex Grid */}
              <HexGrid />
            </div>
          </div>

          {/* Right Column - Activity Stream */}
          <div className="col-span-3">
            <ActivityStream />
          </div>
        </div>

        {/* Footer Status Bar */}
        <footer className="fixed bottom-0 left-0 right-0 glass-panel border-t border-[rgba(0,242,255,0.2)]">
          <div className="flex items-center justify-between px-6 py-2">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="font-telemetry text-[10px] text-[#64748b]">CPU:</span>
                <span className="font-telemetry text-[10px] text-[#10b981]">12%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-telemetry text-[10px] text-[#64748b]">MEM:</span>
                <span className="font-telemetry text-[10px] text-[#10b981]">2.4GB</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-telemetry text-[10px] text-[#64748b]">NET:</span>
                <span className="font-telemetry text-[10px] text-[#10b981]">↑ 1.2MB/s ↓ 4.8MB/s</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-telemetry text-[10px] text-[#475569]">ENCRYPTED CONNECTION // TLS 1.3</span>
              <div className="w-2 h-2 rounded-full bg-[#10b981]" />
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
