/**
 * Ruta Segura Perú - Guide Live Tracking Screen
 * Real-time GPS tracking with map visualization
 */
import { BorderRadius, Colors, Shadows, Spacing } from '@/src/constants/theme';
import { liveTrackingService } from '@/src/services';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, Region, UrlTile } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

// CartoDB Dark tiles for guide tracking (dark theme)
const MAP_TILE_URL = 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';

interface TrackPoint {
    latitude: number;
    longitude: number;
    timestamp: Date;
}

export default function LiveTrackingScreen() {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [trackingActive, setTrackingActive] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);
    const [speed, setSpeed] = useState(0);
    const [altitude, setAltitude] = useState(0);
    const [accuracy, setAccuracy] = useState(0);
    const [batteryLevel] = useState(85);
    const [distance, setDistance] = useState(0);
    const [duration, setDuration] = useState(0);
    const [pointsCount, setPointsCount] = useState(0);
    const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([]);
    const [region, setRegion] = useState<Region>({
        latitude: -13.5319,
        longitude: -71.9675,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
    });

    const mapRef = useRef<MapView>(null);
    const startTime = useRef<Date | null>(null);
    const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastLocation = useRef<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso requerido', 'Se necesita acceso a la ubicación');
                return;
            }
            const currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);
            updateMetrics(currentLocation);

            // Center map on current location
            setRegion({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            });
        })();
        return () => stopTracking();
    }, []);

    const updateMetrics = (loc: Location.LocationObject) => {
        setSpeed(loc.coords.speed ? Math.round(loc.coords.speed * 3.6 * 10) / 10 : 0);
        setAltitude(Math.round(loc.coords.altitude || 0));
        setAccuracy(Math.round(loc.coords.accuracy || 0));
    };

    const calculateDistanceIncrement = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const startTracking = async () => {
        setTrackingActive(true);
        startTime.current = new Date();
        setDistance(0);
        setDuration(0);
        setPointsCount(0);
        setTrackPoints([]);
        lastLocation.current = null;

        const success = await liveTrackingService.startTracking({
            intervalMs: 5000,
            userType: 'guide',
            userName: 'Guía',
            onLocationUpdate: (loc, analysis) => {
                setLocation(loc);
                updateMetrics(loc);
                setPointsCount(c => c + 1);

                // Add to track polyline
                const newPoint = {
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                    timestamp: new Date(),
                };
                setTrackPoints(prev => [...prev, newPoint]);

                // Calculate distance
                if (lastLocation.current) {
                    const distInc = calculateDistanceIncrement(
                        lastLocation.current.lat,
                        lastLocation.current.lng,
                        loc.coords.latitude,
                        loc.coords.longitude
                    );
                    setDistance(d => d + distInc);
                }
                lastLocation.current = { lat: loc.coords.latitude, lng: loc.coords.longitude };

                // Animate map to follow
                mapRef.current?.animateToRegion({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }, 500);

                if (analysis) {
                    console.log(`📍 Safety: ${analysis.risk_level} (${analysis.risk_score}/100)`);
                }
            },
            onConnectionChange: (connected) => {
                setWsConnected(connected);
            },
            onAlert: (alert) => {
                Alert.alert(alert.title || 'Alerta', alert.message);
            },
            onCommand: (command, data) => {
                if (command === 'ACTIVATE_SOS') {
                    Alert.alert('🆘 SOS Activado', data?.reason || 'Emergencia activada remotamente');
                }
            },
        });

        if (!success) {
            Alert.alert('Error', 'No se pudo iniciar el tracking. Verifica tu conexión.');
            setTrackingActive(false);
            return;
        }

        durationInterval.current = setInterval(() => {
            if (startTime.current) {
                setDuration(Math.floor((Date.now() - startTime.current.getTime()) / 1000));
            }
        }, 1000);
    };

    const stopTracking = () => {
        setTrackingActive(false);
        liveTrackingService.stopTracking();
        if (durationInterval.current) clearInterval(durationInterval.current);
    };

    const centerOnUser = () => {
        if (location) {
            mapRef.current?.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 500);
        }
    };

    const formatDuration = (s: number) => {
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = s % 60;
        if (hrs > 0) return `${hrs}h ${mins}m`;
        if (mins > 0) return `${mins}m ${secs}s`;
        return `${secs}s`;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Tracking en Vivo</Text>
                    <View style={styles.badgeRow}>
                        {trackingActive && (
                            <View style={styles.liveBadge}>
                                <View style={styles.liveIndicator} />
                                <Text style={styles.liveText}>EN VIVO</Text>
                            </View>
                        )}
                        {trackingActive && (
                            <View style={[styles.liveBadge, { backgroundColor: wsConnected ? '#10b981' : '#f59e0b' }]}>
                                <Text style={styles.liveText}>{wsConnected ? '✓ CONECTADO' : '⋯ CONECTANDO'}</Text>
                            </View>
                        )}
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.sosButton}
                    onPress={() => {
                        Alert.alert(
                            '🆘 Activar SOS',
                            '¿Desea enviar una alerta de emergencia?',
                            [
                                { text: 'Cancelar', style: 'cancel' },
                                {
                                    text: 'ACTIVAR SOS',
                                    style: 'destructive',
                                    onPress: () => {
                                        if (trackingActive) {
                                            liveTrackingService.sendSOS('Emergencia - Necesito ayuda');
                                            Alert.alert('SOS Enviado', 'La central ha sido notificada');
                                        } else {
                                            Alert.alert('Error', 'Primero inicie el tracking');
                                        }
                                    }
                                }
                            ]
                        );
                    }}
                >
                    <Text style={styles.sosIcon}>🆘</Text>
                </TouchableOpacity>
            </View>

            {/* Map View */}
            {Platform.OS !== 'web' ? (
                <View style={styles.mapContainer}>
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        provider={PROVIDER_DEFAULT}
                        initialRegion={region}
                        showsUserLocation={false}
                        showsMyLocationButton={false}
                        showsCompass
                    >
                        {/* Dark CartoDB Tiles */}
                        <UrlTile
                            urlTemplate={MAP_TILE_URL}
                            maximumZ={19}
                            flipY={false}
                        />

                        {/* Track polyline */}
                        {trackPoints.length > 1 && (
                            <Polyline
                                coordinates={trackPoints}
                                strokeColor="#10b981"
                                strokeWidth={4}
                                lineDashPattern={[1]}
                            />
                        )}

                        {/* Current position marker */}
                        {location && (
                            <Marker
                                coordinate={{
                                    latitude: location.coords.latitude,
                                    longitude: location.coords.longitude,
                                }}
                                title="Tu ubicación"
                            >
                                <View style={styles.guideMarker}>
                                    <View style={styles.guideMarkerInner}>
                                        <Ionicons name="navigate" size={20} color="#fff" />
                                    </View>
                                    <View style={styles.markerPulse} />
                                </View>
                            </Marker>
                        )}
                    </MapView>

                    {/* Center button */}
                    <TouchableOpacity style={styles.centerButton} onPress={centerOnUser}>
                        <Ionicons name="locate" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.webNotice}>
                    <Text style={styles.webNoticeText}>🗺️ El mapa GPS está disponible en la app móvil</Text>
                </View>
            )}

            {/* Metrics Panel */}
            <View style={styles.metricsPanel}>
                <View style={styles.metricRow}>
                    <View style={styles.metric}>
                        <Text style={styles.metricIcon}>🚶</Text>
                        <Text style={styles.metricValue}>{speed}</Text>
                        <Text style={styles.metricLabel}>km/h</Text>
                    </View>
                    <View style={styles.metric}>
                        <Text style={styles.metricIcon}>🏔️</Text>
                        <Text style={styles.metricValue}>{altitude}</Text>
                        <Text style={styles.metricLabel}>m alt</Text>
                    </View>
                    <View style={styles.metric}>
                        <Text style={styles.metricIcon}>📍</Text>
                        <Text style={styles.metricValue}>±{accuracy}</Text>
                        <Text style={styles.metricLabel}>m GPS</Text>
                    </View>
                    <View style={styles.metric}>
                        <Text style={styles.metricIcon}>🔋</Text>
                        <Text style={[styles.metricValue, batteryLevel < 20 && { color: '#ef4444' }]}>{batteryLevel}%</Text>
                        <Text style={styles.metricLabel}>batería</Text>
                    </View>
                </View>
                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>{distance.toFixed(2)} km</Text>
                        <Text style={styles.statLabel}>Distancia</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>{formatDuration(duration)}</Text>
                        <Text style={styles.statLabel}>Duración</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>{pointsCount}</Text>
                        <Text style={styles.statLabel}>Puntos</Text>
                    </View>
                </View>
            </View>

            {/* Control Button */}
            <View style={styles.controlContainer}>
                <TouchableOpacity
                    style={[styles.controlButton, trackingActive && styles.controlButtonStop]}
                    onPress={trackingActive ? stopTracking : startTracking}
                >
                    <Text style={styles.controlIcon}>{trackingActive ? '⏹️' : '▶️'}</Text>
                    <Text style={styles.controlText}>{trackingActive ? 'Detener Tracking' : 'Iniciar Tracking'}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#101622' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: 'rgba(26, 34, 53, 0.95)',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: { alignItems: 'center', flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    badgeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ef4444',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    liveIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'white', marginRight: 4 },
    liveText: { fontSize: 10, fontWeight: 'bold', color: 'white' },
    sosButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sosIcon: { fontSize: 20 },

    // Map
    mapContainer: { flex: 1, position: 'relative' },
    map: { ...StyleSheet.absoluteFillObject },
    centerButton: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(26, 34, 53, 0.95)',
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.md,
    },
    guideMarker: { alignItems: 'center', justifyContent: 'center' },
    guideMarkerInner: {
        backgroundColor: '#10b981',
        padding: 10,
        borderRadius: 25,
        borderWidth: 3,
        borderColor: '#fff',
        zIndex: 2,
    },
    markerPulse: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(16, 185, 129, 0.3)',
    },

    // Web fallback
    webNotice: {
        flex: 1,
        backgroundColor: 'rgba(17, 82, 212, 0.2)',
        padding: Spacing.md,
        margin: Spacing.md,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    webNoticeText: { textAlign: 'center', color: '#60a5fa', fontSize: 14 },

    // Metrics
    metricsPanel: {
        backgroundColor: 'rgba(26, 34, 53, 0.95)',
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.sm,
        borderRadius: BorderRadius.xl,
        padding: Spacing.md,
        ...Shadows.lg,
    },
    metricRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.md },
    metric: { alignItems: 'center' },
    metricIcon: { fontSize: 20, marginBottom: 4 },
    metricValue: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    metricLabel: { fontSize: 10, color: '#9ca3af' },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    stat: { alignItems: 'center' },
    statValue: { fontSize: 14, fontWeight: 'bold', color: '#10b981' },
    statLabel: { fontSize: 10, color: '#9ca3af' },
    statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },

    // Control
    controlContainer: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
    },
    controlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10b981',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.xl,
        ...Shadows.lg,
    },
    controlButtonStop: { backgroundColor: '#ef4444' },
    controlIcon: { fontSize: 24, marginRight: Spacing.sm },
    controlText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
});
