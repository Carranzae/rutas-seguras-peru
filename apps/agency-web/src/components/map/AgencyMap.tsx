'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useRef, useState } from 'react';

interface AgencyLocation {
    user_id: string;
    user_type: 'guide' | 'tourist';
    user_name: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    battery?: number;
    status: string;
    tour_id?: string;
    is_emergency?: boolean;
    timestamp: string;
}

interface AgencyMapProps {
    wsUrl?: string;
    authToken?: string;
    agencyId?: string;
    center?: [number, number];
    zoom?: number;
    tourFilter?: string;
    onGuideSelect?: (guide: AgencyLocation) => void;
    onSOSAlert?: (location: AgencyLocation) => void;
}

// MapTiler dark theme tiles
const TILE_LAYER = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

export default function AgencyMap({
    wsUrl,
    authToken,
    agencyId,
    center = [-13.5319, -71.9675],
    zoom = 13,
    tourFilter,
    onGuideSelect,
    onSOSAlert,
}: AgencyMapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<Map<string, L.Marker>>(new Map());
    const pathRef = useRef<Map<string, L.Polyline>>(new Map());
    const containerRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);

    const [locations, setLocations] = useState<Map<string, AgencyLocation>>(new Map());
    const [connected, setConnected] = useState(false);
    const [selectedGuide, setSelectedGuide] = useState<string | null>(null);

    // Initialize map
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        mapRef.current = L.map(containerRef.current, {
            center: center as L.LatLngExpression,
            zoom,
            zoomControl: true,
        });

        L.tileLayer(TILE_LAYER, {
            attribution: '© OpenStreetMap, © CARTO',
            maxZoom: 19,
        }).addTo(mapRef.current);

        return () => {
            mapRef.current?.remove();
            mapRef.current = null;
        };
    }, []);

    // WebSocket connection
    useEffect(() => {
        if (!wsUrl || !authToken) return;

        const connect = () => {
            const url = agencyId
                ? `${wsUrl}?token=${authToken}&agency_id=${agencyId}`
                : `${wsUrl}?token=${authToken}`;

            const ws = new WebSocket(url);

            ws.onopen = () => {
                setConnected(true);
                console.log('Agency map connected');
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    handleMessage(msg);
                } catch (e) { }
            };

            ws.onclose = () => {
                setConnected(false);
                setTimeout(connect, 3000);
            };

            wsRef.current = ws;
        };

        connect();

        return () => wsRef.current?.close();
    }, [wsUrl, authToken, agencyId]);

    const handleMessage = useCallback((msg: any) => {
        if (msg.type === 'INITIAL_STATE') {
            msg.data.locations?.forEach((loc: AgencyLocation) => {
                if (!tourFilter || loc.tour_id === tourFilter) {
                    updateMarker(loc);
                }
            });
        } else if (msg.type === 'LOCATION_UPDATE') {
            const loc = msg.data as AgencyLocation;
            if (!tourFilter || loc.tour_id === tourFilter) {
                updateMarker(loc);
            }
        } else if (msg.type === 'EMERGENCY') {
            const emergency = msg.data;
            handleEmergency(emergency);
        }
    }, [tourFilter]);

    const updateMarker = useCallback((location: AgencyLocation) => {
        if (!mapRef.current) return;

        setLocations(prev => new Map(prev).set(location.user_id, location));

        const existing = markersRef.current.get(location.user_id);
        const newPos = L.latLng(location.latitude, location.longitude);

        // Icon based on type and status
        const isEmergency = location.is_emergency;
        const color = isEmergency ? '#ef4444' : location.user_type === 'guide' ? '#00f2ff' : '#10b981';

        const icon = L.divIcon({
            className: isEmergency ? 'sos-marker' : 'track-marker',
            html: `
        <div style="
          width: 20px; height: 20px;
          background: ${color};
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 10px ${color}80;
          ${isEmergency ? 'animation: pulse 1s infinite;' : ''}
        "></div>
      `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
        });

        if (existing) {
            // Smooth animation
            animateMarker(existing, existing.getLatLng(), newPos);
            existing.setIcon(icon);

            // Update trail for selected guide
            if (selectedGuide === location.user_id && location.user_type === 'guide') {
                updateTrail(location.user_id, newPos);
            }
        } else {
            const marker = L.marker(newPos, { icon });

            marker.bindPopup(`
        <div style="font-size: 12px;">
          <strong>${location.user_name}</strong><br/>
          <span style="color: #888;">${location.user_type === 'guide' ? 'Guía' : 'Turista'}</span><br/>
          ${location.battery ? `🔋 ${location.battery}%` : ''}
          ${location.speed ? ` | 🚶 ${location.speed.toFixed(1)} km/h` : ''}
        </div>
      `);

            marker.on('click', () => {
                setSelectedGuide(location.user_id);
                onGuideSelect?.(location);
            });

            marker.addTo(mapRef.current!);
            markersRef.current.set(location.user_id, marker);
        }
    }, [selectedGuide, onGuideSelect]);

    const animateMarker = (marker: L.Marker, from: L.LatLng, to: L.LatLng) => {
        const duration = 1000;
        const start = Date.now();

        const animate = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);

            const lat = from.lat + (to.lat - from.lat) * ease;
            const lng = from.lng + (to.lng - from.lng) * ease;

            marker.setLatLng([lat, lng]);

            if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    };

    const updateTrail = (userId: string, newPos: L.LatLng) => {
        if (!mapRef.current) return;

        let polyline = pathRef.current.get(userId);

        if (!polyline) {
            polyline = L.polyline([], {
                color: '#00f2ff',
                weight: 2,
                opacity: 0.6,
                dashArray: '5, 10',
            }).addTo(mapRef.current);
            pathRef.current.set(userId, polyline);
        }

        const latlngs = polyline.getLatLngs() as L.LatLng[];
        latlngs.push(newPos);

        // Keep only last 50 points
        if (latlngs.length > 50) {
            latlngs.shift();
        }

        polyline.setLatLngs(latlngs);
    };

    const handleEmergency = useCallback((emergency: any) => {
        const loc: AgencyLocation = {
            ...emergency,
            is_emergency: true,
            status: 'sos',
        };

        updateMarker(loc);

        if (mapRef.current) {
            mapRef.current.flyTo([emergency.latitude, emergency.longitude], 16);
        }

        onSOSAlert?.(loc);
    }, [updateMarker, onSOSAlert]);

    return (
        <div className="relative w-full h-full rounded-lg overflow-hidden border border-[rgba(0,242,255,0.2)]">
            <div ref={containerRef} className="w-full h-full" />

            {/* Status indicator */}
            <div className={`absolute top-2 left-2 z-[1000] px-2 py-1 rounded text-xs font-mono ${connected ? 'bg-green-900/80 text-green-400' : 'bg-red-900/80 text-red-400'
                }`}>
                {connected ? '● EN VIVO' : '○ DESCONECTADO'}
            </div>

            {/* Legend */}
            <div className="absolute bottom-2 left-2 z-[1000] bg-[rgba(2,6,23,0.9)] p-2 rounded text-xs">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-[#00f2ff]" />
                    <span>Guías</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                    <span>Turistas</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ef4444] animate-pulse" />
                    <span>SOS</span>
                </div>
            </div>

            <style jsx global>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }
          50% { box-shadow: 0 0 15px 8px rgba(239,68,68,0.3); }
        }
      `}</style>
        </div>
    );
}
