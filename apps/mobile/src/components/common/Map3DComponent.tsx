/**
 * Ruta Segura Perú - High Performance WebGL 3D Map
 * Powered by MapLibre GL JS + OpenStreetMap within a WebView.
 * Bypasses native Google Play Services crashes completely.
 */
import { Colors } from '@/src/constants/theme';
import * as Location from 'expo-location';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

export interface MapMarker {
    id: string;
    latitude: number;
    longitude: number;
    title?: string;
    description?: string;
    color?: string;
    icon?: string;
}

export interface Map3DComponentProps {
    initialLat?: number;
    initialLng?: number;
    markers?: MapMarker[];
    guideLocation?: { lat: number; lng: number } | null;
    onMarkerPress?: (markerId: string) => void;
    onMapLoad?: () => void;
    enable3DBuildings?: boolean;
    pitch?: number;
}

export interface Map3DComponentRef {
    flyTo: (lat: number, lng: number, zoom?: number, pitch?: number) => void;
    updateGuideLocation: (lat: number, lng: number) => void;
}

export const Map3DComponent = forwardRef<Map3DComponentRef, Map3DComponentProps>((props, ref) => {
    const webViewRef = useRef<WebView>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [userLoc, setUserLoc] = useState<{ lat: number, lng: number } | null>(null);

    // Initial default location (Cusco)
    const startLat = props.initialLat || -13.5319;
    const startLng = props.initialLng || -71.9675;

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                setUserLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude });
            }
        })();
    }, []);

    useImperativeHandle(ref, () => ({
        flyTo: (lat: number, lng: number, zoom = 15, pitch = 60) => {
            if (!isLoaded) return;
            webViewRef.current?.injectJavaScript(`
                if (window.map) {
                    window.map.flyTo({
                        center: [${lng}, ${lat}],
                        zoom: ${zoom},
                        pitch: ${pitch},
                        bearing: 0,
                        duration: 2000
                    });
                }
                true;
            `);
        },
        updateGuideLocation: (lat: number, lng: number) => {
            if (!isLoaded) return;
            webViewRef.current?.injectJavaScript(`
                if (window.updateGuideMarker) {
                    window.updateGuideMarker(${lng}, ${lat});
                }
                true;
            `);
        }
    }));

    // Update markers dynamically when props change
    useEffect(() => {
        if (!isLoaded) return;
        webViewRef.current?.injectJavaScript(`
            if (window.updateMarkers) {
                window.updateMarkers(${JSON.stringify(props.markers || [])});
            }
            true;
        `);
    }, [props.markers, isLoaded]);

    const handleMessage = (event: WebViewMessageEvent) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'map_loaded') {
                setIsLoaded(true);
                props.onMapLoad?.();
                if (userLoc) {
                    webViewRef.current?.injectJavaScript(`
                        if (window.setUserLocation) window.setUserLocation(${userLoc.lng}, ${userLoc.lat});
                    `);
                }
            } else if (data.type === 'marker_press') {
                props.onMarkerPress?.(data.id);
            }
        } catch (e) {
            console.error("WebView msg error", e);
        }
    };

    // Advanced MapLibre HTML Injection
    // Features: 3D Buildings Extrusion, Custom Style, Smooth Animations
    const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://unpkg.com/maplibre-gl@3.3.1/dist/maplibre-gl.js"></script>
        <link href="https://unpkg.com/maplibre-gl@3.3.1/dist/maplibre-gl.css" rel="stylesheet" />
        <style>
            body { margin: 0; padding: 0; background-color: #0a0f1c; }
            #map { position: absolute; top: 0; bottom: 0; width: 100%; }
            .tour-marker {
                background-color: #1152d4;
                color: white;
                border-radius: 50%;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                border: 3px solid white;
                box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                cursor: pointer;
                transition: transform 0.2s;
            }
            .user-marker {
                background-color: #4CAF50;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 0 10px rgba(76,175,80,0.8);
            }
            .user-pulse {
                border-radius: 50%;
                height: 40px;
                width: 40px;
                position: absolute;
                left: -10px;
                top: -10px;
                animation: pulsate 1.5s ease-out infinite;
                opacity: 0.0;
                background-color: #4CAF50;
                z-index: -1;
            }
            @keyframes pulsate {
                0% {transform: scale(0.1, 0.1); opacity: 0.0;}
                50% {opacity: 0.5;}
                100% {transform: scale(1.2, 1.2); opacity: 0.0;}
            }
            .guide-marker {
                background-color: #10b981;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 3px solid white;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 15px rgba(16,185,129,0.8);
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            // Initialize MapLibre
            const map = new maplibregl.Map({
                container: 'map',
                style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json', // Crisp modern OSM style
                center: [${startLng}, ${startLat}],
                zoom: 14,
                pitch: ${props.pitch || (props.enable3DBuildings ? 60 : 0)},
                bearing: -17.6,
                attributionControl: false
            });

            window.map = map;
            let currentMarkers = {};
            let userMarkerObj = null;
            let guideMarkerObj = null;

            map.on('load', () => {
                // Add 3D Building Layer
                ${props.enable3DBuildings ? `
                if (!map.getLayer('3d-buildings')) {
                    // We extract building data from the standard OSM source that Voyager provides
                    map.addLayer({
                        'id': '3d-buildings',
                        'source': 'carto', // the default vector source in Voyager
                        'source-layer': 'building',
                        'type': 'fill-extrusion',
                        'minzoom': 15,
                        'paint': {
                            'fill-extrusion-color': '#aaa',
                            'fill-extrusion-height': [
                                'interpolate', ['linear'], ['zoom'],
                                15, 0,
                                15.05, ['get', 'render_height']
                            ],
                            'fill-extrusion-base': [
                                'interpolate', ['linear'], ['zoom'],
                                15, 0,
                                15.05, ['get', 'render_min_height']
                            ],
                            'fill-extrusion-opacity': 0.6
                        }
                    });
                }
                ` : ''}
                
                // Notify React Native
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'map_loaded' }));
            });

            // Expose function to update Tour Markers
            window.updateMarkers = (markers) => {
                // Clean up old markers
                Object.values(currentMarkers).forEach(m => m.remove());
                currentMarkers = {};

                markers.forEach(markerData => {
                    const el = document.createElement('div');
                    el.className = 'tour-marker';
                    el.innerHTML = markerData.icon || '📍';
                    if (markerData.color) el.style.backgroundColor = markerData.color;

                    el.addEventListener('click', () => {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'marker_press',
                            id: markerData.id
                        }));
                    });

                    currentMarkers[markerData.id] = new maplibregl.Marker({ element: el })
                        .setLngLat([markerData.longitude, markerData.latitude])
                        .addTo(map);
                });
            };

            // User GPS
            window.setUserLocation = (lng, lat) => {
                if (userMarkerObj) userMarkerObj.remove();
                
                const el = document.createElement('div');
                el.innerHTML = '<div class="user-pulse"></div><div class="user-marker"></div>';
                
                userMarkerObj = new maplibregl.Marker({ element: el })
                    .setLngLat([lng, lat])
                    .addTo(map);
            };

            // Live Guide Tracking
            window.updateGuideMarker = (lng, lat) => {
                if (guideMarkerObj) {
                    guideMarkerObj.setLngLat([lng, lat]);
                } else {
                    const el = document.createElement('div');
                    el.className = 'guide-marker';
                    guideMarkerObj = new maplibregl.Marker({ element: el })
                        .setLngLat([lng, lat])
                        .addTo(map);
                }
            };
            
            ${props.guideLocation ? `window.updateGuideMarker(${props.guideLocation.lng}, ${props.guideLocation.lat});` : ''}
            
        </script>
    </body>
    </html>
    `;

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                style={styles.webview}
                source={{ html: mapHtml }}
                onMessage={handleMessage}
                scrollEnabled={false}
                bounces={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                androidLayerType="hardware"
            />
            {!isLoaded && (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#e5e5e5' },
    webview: { flex: 1, backgroundColor: 'transparent' },
    loader: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.backgroundLight,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10
    }
});
