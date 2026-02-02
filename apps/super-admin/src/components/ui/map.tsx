'use client';

import maplibregl, { Map as MapLibreMap, Marker, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';

// Peru center coordinates
const PERU_CENTER: [number, number] = [-76.0, -9.19];
const PERU_BOUNDS: [[number, number], [number, number]] = [
    [-81.4, -18.4], // Southwest
    [-68.7, -0.1],  // Northeast
];

// Context for map instance
interface MapContextValue {
    map: MapLibreMap | null;
    isLoaded: boolean;
}

const MapContext = createContext<MapContextValue>({ map: null, isLoaded: false });

export const useMap = () => useContext(MapContext);

// Tile styles
const TILE_STYLES = {
    dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
};

// ============ MAP COMPONENT ============
interface MapProps {
    children?: ReactNode;
    center?: [number, number];
    zoom?: number;
    theme?: 'light' | 'dark';
    className?: string;
    onLoad?: (map: MapLibreMap) => void;
}

export function Map({
    children,
    center = PERU_CENTER,
    zoom = 5,
    theme = 'dark',
    className = '',
    onLoad
}: MapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!containerRef.current || mapInstance) return;

        const map = new maplibregl.Map({
            container: containerRef.current,
            style: theme === 'dark' ? TILE_STYLES.dark : TILE_STYLES.light,
            center: center,
            zoom: zoom,
            maxBounds: PERU_BOUNDS,
            attributionControl: false,
        });

        map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

        map.on('load', () => {
            setIsLoaded(true);
            onLoad?.(map);
        });

        setMapInstance(map);

        return () => {
            setIsLoaded(false);
            setMapInstance(null);
            map.remove();
        };
    }, []);

    return (
        <MapContext.Provider value={{ map: mapInstance, isLoaded }}>
            <div ref={containerRef} className={`w-full h-full ${className}`}>
                {isLoaded && children}
            </div>
        </MapContext.Provider>
    );
}

// ============ MAP CONTROLS ============
interface MapControlsProps {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    showZoom?: boolean;
    showCompass?: boolean;
    showFullscreen?: boolean;
    className?: string;
}

export function MapControls({
    position = 'bottom-right',
    showZoom = true,
    showCompass = false,
    showFullscreen = false,
    className = ''
}: MapControlsProps) {
    const { map } = useMap();

    useEffect(() => {
        if (!map) return;

        if (showZoom) {
            map.addControl(new maplibregl.NavigationControl({ showCompass }), position);
        }
        if (showFullscreen) {
            map.addControl(new maplibregl.FullscreenControl(), position);
        }
    }, [map, showZoom, showCompass, showFullscreen, position]);

    return null;
}

// ============ MAP MARKER ============
interface MapMarkerProps {
    longitude: number;
    latitude: number;
    children?: ReactNode;
    color?: string;
    size?: 'sm' | 'md' | 'lg';
    pulse?: boolean;
    onClick?: () => void;
    label?: string;
    type?: 'default' | 'sos' | 'guide' | 'tourist' | 'agency';
}

export function MapMarker({
    longitude,
    latitude,
    children,
    color = '#1152d4',
    size = 'md',
    pulse = false,
    onClick,
    label,
    type = 'default'
}: MapMarkerProps) {
    const { map, isLoaded } = useMap();
    const markerRef = useRef<Marker | null>(null);
    const elementRef = useRef<HTMLDivElement | null>(null);

    const sizeMap = { sm: 24, md: 32, lg: 44 };
    const markerSize = sizeMap[size];

    const typeColors = {
        default: '#1152d4',
        sos: '#ef4444',
        guide: '#10b981',
        tourist: '#3b82f6',
        agency: '#8b5cf6',
    };

    const markerColor = typeColors[type] || color;

    useEffect(() => {
        if (!map || !isLoaded) return;

        try {
            const el = document.createElement('div');
            el.className = 'map-marker';
            el.style.cssText = `
      width: ${markerSize}px;
      height: ${markerSize}px;
      background-color: ${markerColor};
      border: 3px solid white;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transition: transform 0.2s;
      ${pulse ? 'animation: marker-pulse 2s infinite;' : ''}
    `;

            if (onClick) {
                el.addEventListener('click', onClick);
            }

            el.addEventListener('mouseenter', () => {
                el.style.transform = 'scale(1.2)';
            });
            el.addEventListener('mouseleave', () => {
                el.style.transform = 'scale(1)';
            });

            elementRef.current = el;

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([longitude, latitude])
                .addTo(map);

            markerRef.current = marker;

            return () => {
                try {
                    marker.remove();
                } catch (error) {
                    // Marker may have been destroyed
                }
            };
        } catch (error) {
            console.warn('MapMarker error:', error);
        }
    }, [map, isLoaded, longitude, latitude, markerColor, markerSize, pulse, onClick]);

    return null;
}

// ============ MAP ROUTE ============
interface MapRouteProps {
    id: string;
    coordinates: [number, number][];
    color?: string;
    width?: number;
    opacity?: number;
    dashed?: boolean;
    onClick?: () => void;
}

export function MapRoute({
    id,
    coordinates,
    color = '#1152d4',
    width = 4,
    opacity = 0.8,
    dashed = false,
    onClick
}: MapRouteProps) {
    const { map, isLoaded } = useMap();

    useEffect(() => {
        if (!map || !isLoaded || coordinates.length < 2) return;

        const sourceId = `route-source-${id}`;
        const layerId = `route-layer-${id}`;

        try {
            // Check if source already exists
            if (map.getSource(sourceId)) {
                map.removeLayer(layerId);
                map.removeSource(sourceId);
            }

            // Add source
            map.addSource(sourceId, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: coordinates,
                    },
                },
            });

            // Add layer
            map.addLayer({
                id: layerId,
                type: 'line',
                source: sourceId,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': color,
                    'line-width': width,
                    'line-opacity': opacity,
                    ...(dashed ? { 'line-dasharray': [2, 2] } : {}),
                },
            });

            if (onClick) {
                map.on('click', layerId, onClick);
                map.on('mouseenter', layerId, () => {
                    if (map.getCanvas()) map.getCanvas().style.cursor = 'pointer';
                });
                map.on('mouseleave', layerId, () => {
                    if (map.getCanvas()) map.getCanvas().style.cursor = '';
                });
            }
        } catch (error) {
            console.warn('MapRoute error:', error);
        }

        return () => {
            try {
                if (map && map.getStyle() && map.getLayer(layerId)) map.removeLayer(layerId);
                if (map && map.getStyle() && map.getSource(sourceId)) map.removeSource(sourceId);
            } catch (error) {
                // Map may have been destroyed
            }
        };
    }, [map, isLoaded, id, coordinates, color, width, opacity, dashed, onClick]);

    return null;
}

// ============ MAP POPUP ============
interface MapPopupProps {
    longitude: number;
    latitude: number;
    children: ReactNode;
    onClose?: () => void;
    className?: string;
}

export function MapPopup({ longitude, latitude, children, onClose, className = '' }: MapPopupProps) {
    const { map, isLoaded } = useMap();
    const popupRef = useRef<Popup | null>(null);

    useEffect(() => {
        if (!map || !isLoaded) return;

        try {
            const container = document.createElement('div');
            container.className = className;
            container.innerHTML = typeof children === 'string' ? children : '';

            const popup = new maplibregl.Popup({ closeButton: true, className: 'custom-popup' })
                .setLngLat([longitude, latitude])
                .setDOMContent(container)
                .addTo(map);

            popup.on('close', () => onClose?.());

            popupRef.current = popup;

            return () => {
                try {
                    popup.remove();
                } catch (error) {
                    // Popup may have been destroyed
                }
            };
        } catch (error) {
            console.warn('MapPopup error:', error);
        }
    }, [map, isLoaded, longitude, latitude, children, onClose, className]);

    return null;
}

// Add CSS for marker pulse animation
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
    @keyframes marker-pulse {
      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
    .maplibregl-popup-content {
      background: #1c2431 !important;
      color: white !important;
      border: 1px solid #324467 !important;
      border-radius: 12px !important;
      padding: 12px !important;
    }
    .maplibregl-popup-close-button {
      color: white !important;
      font-size: 18px !important;
    }
    .maplibregl-popup-tip {
      border-top-color: #1c2431 !important;
    }
  `;
    document.head.appendChild(style);
}
