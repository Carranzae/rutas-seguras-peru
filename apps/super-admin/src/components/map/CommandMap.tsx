'use client';

import L from 'leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useRef, useState } from 'react';

// We'll import MarkerClusterGroup dynamically to avoid SSR issues

interface Location {
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

interface CommandMapProps {
    wsUrl?: string;
    authToken?: string;
    center?: [number, number];
    zoom?: number;
    onLocationSelect?: (location: Location) => void;
    onEmergencyClick?: (location: Location) => void;
    externalLocations?: Location[]; // New prop for controlled mode
    mapStyle?: 'dark' | 'satellite' | 'terrain';
}

const TILE_LAYERS = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    terrain: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
};

const TILE_ATTRIBUTIONS = {
    dark: '© OpenStreetMap contributors, © CARTO',
    satellite: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    terrain: '© OpenStreetMap contributors'
};

// Custom marker icons
const createMarkerIcon = (type: 'guide' | 'tourist' | 'emergency', status: string = 'active') => {
    const colors = {
        guide: '#00f2ff',      // Cyan
        tourist: '#10b981',    // Green
        emergency: '#ef4444',  // Red
    };

    const color = type === 'emergency' ? colors.emergency : colors[type];
    const pulseClass = type === 'emergency' ? 'sos-pulse' : '';

    return L.divIcon({
        className: `custom-marker ${pulseClass}`,
        html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 15px ${color}80;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
        font-weight: bold;
      ">
        ${type === 'guide' ? '🎒' : type === 'tourist' ? '👤' : '🆘'}
      </div>
    `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
    });
};

export default function CommandMap({
    wsUrl,
    authToken,
    center = [-13.5319, -71.9675], // Cusco default
    zoom = 12,
    onLocationSelect,
    onEmergencyClick,
    externalLocations,
    mapStyle = 'dark',
}: CommandMapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<Map<string, L.Marker>>(new Map());
    const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const tileLayerRef = useRef<L.TileLayer | null>(null);

    const [connected, setConnected] = useState(false);
    const [locations, setLocations] = useState<Map<string, Location>>(new Map());
    const [stats, setStats] = useState({ guides: 0, tourists: 0, emergencies: 0 });

    // Sync external locations if provided
    useEffect(() => {
        if (externalLocations) {
            const locMap = new Map<string, Location>();
            externalLocations.forEach(loc => {
                locMap.set(loc.user_id, loc);
                updateMarker(loc);
            });
            setLocations(locMap);
            // Remove stale markers handling
            markersRef.current.forEach((marker, id) => {
                if (!locMap.has(id)) {
                    // remove marker logic if we wanted full sync
                    // For now, simpler to just keep adding/updating
                }
            });
            updateStats();
        }
    }, [externalLocations]);

    // Initialize map
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        // Create map
        mapRef.current = L.map(containerRef.current, {
            center: center as L.LatLngExpression,
            zoom,
            zoomControl: false,
        });

        // Add zoom control to top-right
        L.control.zoom({ position: 'topright' }).addTo(mapRef.current);

        // Initialize marker cluster group
        import('leaflet.markercluster').then(() => {
            clusterGroupRef.current = L.markerClusterGroup({
                maxClusterRadius: 50,
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true,
                iconCreateFunction: (cluster: any) => {
                    const count = cluster.getChildCount();
                    const hasEmergency = cluster.getAllChildMarkers().some(
                        (m: any) => m.options.isEmergency
                    );

                    const childCount = cluster.getChildCount();
                    let c = 'MarkerCluster-';
                    if (childCount < 10) {
                        c += 'small';
                    } else if (childCount < 100) {
                        c += 'medium';
                    } else {
                        c += 'large';
                    }
                    return L.divIcon({
                        className: 'custom-cluster',
                        html: `
              <div style="
                width: 40px;
                height: 40px;
                background: ${hasEmergency ? '#ef4444' : '#00f2ff'};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 14px;
                border: 3px solid white;
                box-shadow: 0 0 20px ${hasEmergency ? '#ef444480' : '#00f2ff80'};
                ${hasEmergency ? 'animation: sos-pulse 1s infinite;' : ''}
              ">
                ${count}
              </div>
            `,
                        iconSize: [40, 40],
                        iconAnchor: [20, 20],
                    });
                },
            });

            mapRef.current?.addLayer(clusterGroupRef.current);
        });

        return () => {
            mapRef.current?.remove();
            mapRef.current = null;
        };
    }, []);

    // Handle map style changes
    useEffect(() => {
        if (!mapRef.current) return;

        // Remove existing tile layer
        if (tileLayerRef.current) {
            mapRef.current.removeLayer(tileLayerRef.current);
        }

        // Add new tile layer
        const layerUrl = TILE_LAYERS[mapStyle] || TILE_LAYERS.dark;
        const attribution = TILE_ATTRIBUTIONS[mapStyle] || TILE_ATTRIBUTIONS.dark;

        tileLayerRef.current = L.tileLayer(layerUrl, {
            attribution,
            maxZoom: 19,
        });

        tileLayerRef.current.addTo(mapRef.current);
    }, [mapStyle]);

    // WebSocket connection
    useEffect(() => {
        if (!wsUrl || !authToken) return;

        const connectWebSocket = () => {
            const ws = new WebSocket(`${wsUrl}?token=${authToken}`);

            ws.onopen = () => {
                setConnected(true);
                console.log('🛰️ WebSocket connected');
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    handleWebSocketMessage(message);
                } catch (e) {
                    console.error('WS parse error:', e);
                }
            };

            ws.onclose = () => {
                setConnected(false);
                console.log('🔴 WebSocket disconnected, reconnecting...');
                setTimeout(connectWebSocket, 3000);
            };

            ws.onerror = (e) => {
                console.error('WebSocket error:', e);
            };

            wsRef.current = ws;
        };

        connectWebSocket();

        return () => {
            wsRef.current?.close();
        };
    }, [wsUrl, authToken]);

    // Handle incoming WebSocket messages
    const handleWebSocketMessage = useCallback((message: any) => {
        switch (message.type) {
            case 'INITIAL_STATE':
                // Load all initial locations
                message.data.locations?.forEach((loc: Location) => {
                    updateMarker(loc);
                    setLocations(prev => new Map(prev).set(loc.user_id, loc));
                });
                break;

            case 'LOCATION_UPDATE':
                const loc = message.data as Location;
                updateMarker(loc);
                setLocations(prev => new Map(prev).set(loc.user_id, loc));
                break;

            case 'EMERGENCY':
                const emergency = message.data;
                // Flash the map or show alert
                handleEmergency(emergency);
                break;
        }

        // Update stats
        updateStats();
    }, []);

    // Update or create marker with smooth animation
    const updateMarker = useCallback((location: Location) => {
        if (!mapRef.current || !clusterGroupRef.current) return;

        const existingMarker = markersRef.current.get(location.user_id);
        const newLatLng = L.latLng(location.latitude, location.longitude);

        if (existingMarker) {
            // Smooth transition animation (Uber-style)
            const currentLatLng = existingMarker.getLatLng();
            const duration = 1000; // 1 second
            const startTime = Date.now();

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease-out cubic
                const easeProgress = 1 - Math.pow(1 - progress, 3);

                const lat = currentLatLng.lat + (newLatLng.lat - currentLatLng.lat) * easeProgress;
                const lng = currentLatLng.lng + (newLatLng.lng - currentLatLng.lng) * easeProgress;

                existingMarker.setLatLng([lat, lng]);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);

            // Update icon if status changed
            const icon = createMarkerIcon(
                location.is_emergency ? 'emergency' : location.user_type,
                location.status
            );
            existingMarker.setIcon(icon);
        } else {
            // Create new marker
            const icon = createMarkerIcon(
                location.is_emergency ? 'emergency' : location.user_type,
                location.status
            );

            const marker = L.marker(newLatLng, {
                icon,
                isEmergency: location.is_emergency,
            } as any);

            // Popup with user info
            marker.bindPopup(`
        <div style="font-family: monospace; min-width: 200px;">
          <div style="font-weight: bold; margin-bottom: 8px; color: ${location.is_emergency ? '#ef4444' : '#00f2ff'};">
            ${location.is_emergency ? '🆘 EMERGENCIA' : location.user_type === 'guide' ? '🎒 GUÍA' : '👤 TURISTA'}
          </div>
          <div><strong>${location.user_name}</strong></div>
          <div style="font-size: 11px; color: #666; margin-top: 4px;">
            <div>📍 ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}</div>
            ${location.speed ? `<div>🚶 ${location.speed.toFixed(1)} km/h</div>` : ''}
            ${location.battery ? `<div>🔋 ${location.battery}%</div>` : ''}
            ${location.accuracy ? `<div>📡 ±${location.accuracy.toFixed(0)}m</div>` : ''}
          </div>
        </div>
      `);

            marker.on('click', () => {
                onLocationSelect?.(location);
                if (location.is_emergency) {
                    onEmergencyClick?.(location);
                }
            });

            clusterGroupRef.current.addLayer(marker);
            markersRef.current.set(location.user_id, marker);
        }
    }, [onLocationSelect, onEmergencyClick]);

    // Handle emergency with visual feedback
    const handleEmergency = useCallback((emergency: any) => {
        // Add/update emergency marker
        const emergencyLocation: Location = {
            ...emergency,
            is_emergency: true,
            status: 'sos',
        };
        updateMarker(emergencyLocation);

        // Fly to emergency location
        if (mapRef.current) {
            mapRef.current.flyTo([emergency.latitude, emergency.longitude], 16, {
                duration: 1.5,
            });
        }

        onEmergencyClick?.(emergencyLocation);
    }, [updateMarker, onEmergencyClick]);

    // Update stats from locations
    const updateStats = useCallback(() => {
        let guides = 0, tourists = 0, emergencies = 0;

        locations.forEach((loc) => {
            if (loc.is_emergency) emergencies++;
            else if (loc.user_type === 'guide') guides++;
            else if (loc.user_type === 'tourist') tourists++;
        });

        setStats({ guides, tourists, emergencies });
    }, [locations]);

    // Fit map to show all markers
    const fitToMarkers = useCallback(() => {
        if (!mapRef.current || !clusterGroupRef.current) return;

        const bounds = clusterGroupRef.current.getBounds();
        if (bounds.isValid()) {
            mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
    }, []);

    return (
        <div className="relative w-full h-full">
            {/* Map Container */}
            <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden" />

            {/* Connection Status */}
            <div className="absolute top-4 left-4 z-[1000]">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono ${connected ? 'bg-green-900/80 text-green-400' : 'bg-red-900/80 text-red-400'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                    {connected ? 'UPLINK ACTIVE' : 'DISCONNECTED'}
                </div>
            </div>

            {/* Stats Overlay */}
            <div className="absolute bottom-4 left-4 z-[1000] grid grid-cols-3 gap-2">
                <div className="bg-cyan-900/80 text-cyan-400 px-3 py-2 rounded text-center font-mono text-xs">
                    <div className="text-lg font-bold">{stats.guides}</div>
                    <div>GUIDES</div>
                </div>
                <div className="bg-emerald-900/80 text-emerald-400 px-3 py-2 rounded text-center font-mono text-xs">
                    <div className="text-lg font-bold">{stats.tourists}</div>
                    <div>TOURISTS</div>
                </div>
                <div className={`px-3 py-2 rounded text-center font-mono text-xs ${stats.emergencies > 0
                    ? 'bg-red-900/80 text-red-400 animate-pulse'
                    : 'bg-gray-900/80 text-gray-400'
                    }`}>
                    <div className="text-lg font-bold">{stats.emergencies}</div>
                    <div>SOS</div>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
                <button
                    onClick={fitToMarkers}
                    className="bg-cyan-900/80 text-cyan-400 p-2 rounded hover:bg-cyan-800/80 transition"
                    title="Fit all markers"
                >
                    📍
                </button>
            </div>

            {/* CSS for animations */}
            <style jsx global>{`
        @keyframes sos-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          50% { box-shadow: 0 0 20px 10px rgba(239, 68, 68, 0.3); }
        }
        
        .sos-pulse {
          animation: sos-pulse 1s ease-in-out infinite;
        }
        
        .leaflet-popup-content-wrapper {
          background: rgba(2, 6, 23, 0.95);
          color: #e2e8f0;
          border: 1px solid rgba(0, 242, 255, 0.3);
        }
        
        .leaflet-popup-tip {
          background: rgba(2, 6, 23, 0.95);
        }
      `}</style>
        </div>
    );
}
