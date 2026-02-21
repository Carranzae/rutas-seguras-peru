/**
 * Ruta Segura Perú - Tourist Map Screen
 * Interactive map with tour locations and guide tracking using react-native-maps
 */
import { BorderRadius, Colors, Shadows, Spacing } from '@/src/constants/theme';
import { API_CONFIG, httpClient } from '@/src/core/api';
import { useLanguage } from '@/src/i18n';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Region, UrlTile } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NearbyTour {
    id: string;
    name: string;
    distance: string;
    rating: number;
    price: number;
    latitude: number;
    longitude: number;
    category?: string;
    duration_hours?: number;
}

interface GuideLocation {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    isOnTour: boolean;
}

// CartoDB Voyager tiles - Clean modern style
const MAP_TILE_URL = 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png';

// Category icon mapping for tour markers
const CATEGORY_MARKERS: Record<string, string> = {
    adventure: '🏔️',
    culture: '🏛️',
    food: '🍽️',
    nature: '🌿',
    wellness: '🧘',
    default: '📍',
};

export default function MapScreen() {
    const { t, language } = useLanguage();
    const mapRef = useRef<MapView>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [nearbyTours, setNearbyTours] = useState<NearbyTour[]>([]);
    const [guideLocation, setGuideLocation] = useState<GuideLocation | null>(null);
    const [selectedTour, setSelectedTour] = useState<NearbyTour | null>(null);
    const [toursCount, setToursCount] = useState(0);
    const [region, setRegion] = useState<Region>({
        latitude: -13.5319,
        longitude: -71.9675,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Pulse animation for guide marker
    useEffect(() => {
        if (guideLocation) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.3, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        }
    }, [guideLocation]);

    useEffect(() => {
        initializeMap();
    }, []);

    // Subscribe to guide location when tourist has active booking
    useEffect(() => {
        let locationSubscription: WebSocket | null = null;

        const subscribeToGuideLocation = async () => {
            try {
                const response = await httpClient.get<{ booking?: { guide_id: string; guide_name: string } }>('/bookings/active');

                if (response.data?.booking) {
                    const { guide_id, guide_name } = response.data.booking;
                    const wsProtocol = API_CONFIG.BASE_URL.startsWith('https') ? 'wss' : 'ws';
                    const wsHost = API_CONFIG.BASE_URL.replace('http://', '').replace('https://', '');
                    const wsUrl = `${wsProtocol}://${wsHost}/api/v1/ws/tracking/${guide_id}`;
                    locationSubscription = new WebSocket(wsUrl);

                    locationSubscription.onmessage = (event) => {
                        try {
                            const data = JSON.parse(event.data);
                            if (data.latitude && data.longitude) {
                                setGuideLocation({
                                    id: guide_id,
                                    name: guide_name,
                                    latitude: data.latitude,
                                    longitude: data.longitude,
                                    isOnTour: true,
                                });
                            }
                        } catch (e) {
                            console.error('Error parsing guide location:', e);
                        }
                    };

                    locationSubscription.onerror = (error) => {
                        console.error('WebSocket error:', error);
                    };
                }
            } catch (error) {
                // Tourist doesn't have active booking
            }
        };

        subscribeToGuideLocation();

        return () => {
            if (locationSubscription) locationSubscription.close();
        };
    }, []);

    const initializeMap = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    language === 'es' ? 'Permiso necesario' : 'Permission needed',
                    language === 'es'
                        ? 'Necesitamos acceso a tu ubicación para mostrar tours cercanos'
                        : 'We need access to your location to show nearby tours'
                );
                await loadTours(-13.5319, -71.9675);
                setLoading(false);
                return;
            }

            try {
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: 5000,
                });

                const newLocation = {
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                };
                setCurrentLocation(newLocation);

                setRegion({
                    latitude: newLocation.lat,
                    longitude: newLocation.lng,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                });

                await loadTours(newLocation.lat, newLocation.lng);
            } catch (locError) {
                console.warn('Location error, using default:', locError);
                // Fallback to Cusco default
                const defaultLoc = { lat: -13.5319, lng: -71.9675 };
                setCurrentLocation(defaultLoc);
                await loadTours(defaultLoc.lat, defaultLoc.lng);
            }
        } catch (error) {
            console.error('Map initialization error:', error);
            const defaultLoc = { lat: -13.5319, lng: -71.9675 };
            setCurrentLocation(defaultLoc);
            await loadTours(defaultLoc.lat, defaultLoc.lng);
        } finally {
            setLoading(false);
        }
    };

    const loadTours = async (lat: number, lng: number, query?: string) => {
        try {
            // Try the search endpoint first
            const params = new URLSearchParams();
            if (query) params.append('query', query);
            params.append('per_page', '50');

            const url = params.toString() ? `/tours?${params.toString()}` : '/tours';
            const response = await httpClient.get<{ items: any[]; total?: number }>(url);

            if (response.data?.items && response.data.items.length > 0) {
                const tours = response.data.items.map((tour: any) => ({
                    id: tour.id,
                    name: tour.name,
                    distance: tour.latitude && tour.longitude
                        ? calculateDistance(lat, lng, tour.latitude, tour.longitude)
                        : '',
                    rating: tour.rating || 4.5,
                    price: tour.price || 0,
                    latitude: tour.latitude || lat + (Math.random() - 0.5) * 0.05,
                    longitude: tour.longitude || lng + (Math.random() - 0.5) * 0.05,
                    category: tour.difficulty_level || tour.category || 'default',
                    duration_hours: tour.duration_hours,
                }));

                // Sort by distance
                tours.sort((a: NearbyTour, b: NearbyTour) => {
                    const distA = parseFloat(a.distance) || 9999;
                    const distB = parseFloat(b.distance) || 9999;
                    return distA - distB;
                });

                setNearbyTours(tours);
                setToursCount(response.data.total || tours.length);
            } else {
                setNearbyTours([]);
                setToursCount(0);
            }
        } catch (error) {
            console.error('Error loading tours:', error);
            setNearbyTours([]);
            setToursCount(0);
        }
    };

    const handleSearch = async () => {
        if (currentLocation) {
            await loadTours(currentLocation.lat, currentLocation.lng, searchQuery);
        }
    };

    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): string => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance < 1 ? `${(distance * 1000).toFixed(0)} m` : `${distance.toFixed(1)} km`;
    };

    const handleTourPress = (tour: NearbyTour) => {
        setSelectedTour(tour);
        if (tour.latitude && tour.longitude) {
            mapRef.current?.animateToRegion({
                latitude: tour.latitude,
                longitude: tour.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 500);
        }
    };

    const goToTourDetail = (tour: NearbyTour) => {
        router.push({
            pathname: '/(tourist)/tour/[id]',
            params: { id: tour.id },
        });
    };

    const centerOnUser = () => {
        if (currentLocation) {
            mapRef.current?.animateToRegion({
                latitude: currentLocation.lat,
                longitude: currentLocation.lng,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            }, 500);
        }
    };

    const getMarkerEmoji = (category?: string): string => {
        return CATEGORY_MARKERS[category || 'default'] || CATEGORY_MARKERS.default;
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.loadingContainer]}>
                <View style={styles.loadingContent}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>
                        {language === 'es' ? 'Cargando mapa...' : 'Loading map...'}
                    </Text>
                    <Text style={styles.loadingSubText}>
                        {language === 'es' ? 'Buscando tours cercanos' : 'Finding nearby tours'}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Map */}
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={PROVIDER_DEFAULT}
                    initialRegion={region}
                    showsUserLocation
                    showsMyLocationButton={false}
                    showsCompass
                    rotateEnabled
                    onRegionChangeComplete={setRegion}
                >
                    {/* CartoDB Voyager Tiles @2x for retina */}
                    <UrlTile
                        urlTemplate={MAP_TILE_URL}
                        maximumZ={19}
                        flipY={false}
                    />

                    {/* Tour Markers */}
                    {nearbyTours.map((tour) => (
                        <Marker
                            key={tour.id}
                            coordinate={{
                                latitude: tour.latitude,
                                longitude: tour.longitude,
                            }}
                            title={tour.name}
                            description={`S/${tour.price} • ⭐ ${tour.rating}${tour.duration_hours ? ` • ${tour.duration_hours}h` : ''}`}
                            onPress={() => handleTourPress(tour)}
                        >
                            <View style={styles.markerContainer}>
                                <View style={[
                                    styles.marker,
                                    selectedTour?.id === tour.id && styles.markerSelected
                                ]}>
                                    <Text style={styles.markerText}>{getMarkerEmoji(tour.category)}</Text>
                                </View>
                                {selectedTour?.id === tour.id && (
                                    <View style={styles.markerPriceTag}>
                                        <Text style={styles.markerPriceText}>S/{tour.price}</Text>
                                    </View>
                                )}
                                <View style={[
                                    styles.markerArrow,
                                    selectedTour?.id === tour.id && styles.markerArrowSelected
                                ]} />
                            </View>
                        </Marker>
                    ))}

                    {/* Guide Location Marker (when tracking) */}
                    {guideLocation && (
                        <Marker
                            coordinate={{
                                latitude: guideLocation.latitude,
                                longitude: guideLocation.longitude,
                            }}
                            title={guideLocation.name}
                            description={language === 'es' ? 'Tu guía — En vivo' : 'Your guide — Live'}
                        >
                            <View style={styles.guideMarkerOuter}>
                                <View style={styles.guideMarkerPulse} />
                                <View style={styles.guideMarker}>
                                    <Ionicons name="person" size={18} color="#fff" />
                                </View>
                            </View>
                        </Marker>
                    )}
                </MapView>

                {/* Search Bar */}
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={Colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={language === 'es' ? 'Buscar tours...' : 'Search tours...'}
                        placeholderTextColor={Colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => {
                            setSearchQuery('');
                            if (currentLocation) loadTours(currentLocation.lat, currentLocation.lng);
                        }}>
                            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Map Controls */}
                <View style={styles.mapControls}>
                    {/* Location Button */}
                    <TouchableOpacity style={styles.controlButton} onPress={centerOnUser}>
                        <Ionicons name="locate" size={22} color={Colors.primary} />
                    </TouchableOpacity>

                    {/* Zoom Controls */}
                    <View style={styles.zoomGroup}>
                        <TouchableOpacity
                            style={styles.zoomButton}
                            onPress={() => {
                                mapRef.current?.animateToRegion({
                                    ...region,
                                    latitudeDelta: region.latitudeDelta / 2,
                                    longitudeDelta: region.longitudeDelta / 2,
                                }, 300);
                            }}
                        >
                            <Ionicons name="add" size={22} color={Colors.textPrimary} />
                        </TouchableOpacity>
                        <View style={styles.zoomDivider} />
                        <TouchableOpacity
                            style={styles.zoomButton}
                            onPress={() => {
                                mapRef.current?.animateToRegion({
                                    ...region,
                                    latitudeDelta: region.latitudeDelta * 2,
                                    longitudeDelta: region.longitudeDelta * 2,
                                }, 300);
                            }}
                        >
                            <Ionicons name="remove" size={22} color={Colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Bottom Panel - Nearby Tours */}
            <View style={styles.bottomPanel}>
                <View style={styles.panelHandle} />
                <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>
                        {language === 'es' ? 'Tours Cercanos' : 'Nearby Tours'}
                    </Text>
                    <View style={styles.toursBadge}>
                        <Text style={styles.toursBadgeText}>{toursCount}</Text>
                    </View>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.toursList}
                >
                    {nearbyTours.length > 0 ? (
                        nearbyTours.map((tour) => (
                            <TouchableOpacity
                                key={tour.id}
                                style={[
                                    styles.tourCard,
                                    selectedTour?.id === tour.id && styles.tourCardSelected
                                ]}
                                onPress={() => goToTourDetail(tour)}
                                onLongPress={() => handleTourPress(tour)}
                            >
                                <View style={[
                                    styles.tourIcon,
                                    selectedTour?.id === tour.id && styles.tourIconSelected
                                ]}>
                                    <Text style={styles.tourEmoji}>{getMarkerEmoji(tour.category)}</Text>
                                </View>
                                <View style={styles.tourInfo}>
                                    <Text style={styles.tourName} numberOfLines={1}>{tour.name}</Text>
                                    <View style={styles.tourMeta}>
                                        {tour.distance ? (
                                            <Text style={styles.tourDistance}>📍 {tour.distance}</Text>
                                        ) : null}
                                        <View style={styles.tourRating}>
                                            <Ionicons name="star" size={12} color="#fbbf24" />
                                            <Text style={styles.tourRatingText}>{tour.rating}</Text>
                                        </View>
                                        {tour.duration_hours ? (
                                            <Text style={styles.tourDuration}>⏱ {tour.duration_hours}h</Text>
                                        ) : null}
                                    </View>
                                </View>
                                <View style={styles.tourPriceContainer}>
                                    <Text style={styles.tourPriceText}>S/{tour.price}</Text>
                                    <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>🗺️</Text>
                            <Text style={styles.emptyTitle}>
                                {language === 'es' ? 'No hay tours disponibles' : 'No tours available'}
                            </Text>
                            <Text style={styles.emptyText}>
                                {language === 'es'
                                    ? 'Intenta buscar en otra zona o ampliar el área'
                                    : 'Try searching in another area or zoom out'}
                            </Text>
                        </View>
                    )}
                </ScrollView>

                {/* Guide Tracking (when on active tour) */}
                {guideLocation && (
                    <TouchableOpacity
                        style={styles.guideTracker}
                        onPress={() => {
                            mapRef.current?.animateToRegion({
                                latitude: guideLocation.latitude,
                                longitude: guideLocation.longitude,
                                latitudeDelta: 0.005,
                                longitudeDelta: 0.005,
                            }, 500);
                        }}
                    >
                        <View style={styles.guideTrackerContent}>
                            <View style={styles.guideAvatar}>
                                <Text style={styles.guideAvatarText}>{guideLocation.name.charAt(0)}</Text>
                            </View>
                            <View style={styles.guideTrackerInfo}>
                                <Text style={styles.guideTrackerName}>{guideLocation.name}</Text>
                                <Text style={styles.guideTrackerStatus}>
                                    {language === 'es' ? '📍 Ubicación en tiempo real' : '📍 Live location'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.liveIndicator}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveLabel}>LIVE</Text>
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    loadingContainer: { justifyContent: 'center', alignItems: 'center' },
    loadingContent: { alignItems: 'center', gap: 8 },
    loadingText: { marginTop: 12, color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
    loadingSubText: { color: Colors.textSecondary, fontSize: 13 },

    mapContainer: { flex: 1, position: 'relative' },
    map: { ...StyleSheet.absoluteFillObject },

    // Search Bar
    searchBar: {
        position: 'absolute',
        top: 12,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceLight,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: BorderRadius.xl,
        gap: 10,
        ...Shadows.md,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: Colors.textPrimary,
        paddingVertical: 0,
    },

    // Map Controls
    mapControls: {
        position: 'absolute',
        bottom: 200,
        right: 16,
        gap: 8,
    },
    controlButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.md,
    },
    zoomGroup: {
        backgroundColor: Colors.surfaceLight,
        borderRadius: 12,
        ...Shadows.md,
        overflow: 'hidden',
    },
    zoomButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    zoomDivider: {
        height: 1,
        backgroundColor: Colors.borderLight,
    },

    // Tour Markers
    markerContainer: { alignItems: 'center' },
    marker: {
        backgroundColor: Colors.primary,
        padding: 8,
        borderRadius: 20,
        borderWidth: 2.5,
        borderColor: '#fff',
        ...Shadows.sm,
    },
    markerSelected: {
        backgroundColor: '#10b981',
        transform: [{ scale: 1.2 }],
    },
    markerText: { fontSize: 18 },
    markerPriceTag: {
        backgroundColor: '#10b981',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 2,
    },
    markerPriceText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    markerArrow: {
        width: 0,
        height: 0,
        borderLeftWidth: 7,
        borderRightWidth: 7,
        borderTopWidth: 7,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: Colors.primary,
        marginTop: -1,
    },
    markerArrowSelected: {
        borderTopColor: '#10b981',
    },

    // Guide Marker
    guideMarkerOuter: { alignItems: 'center', justifyContent: 'center' },
    guideMarkerPulse: {
        position: 'absolute',
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
    },
    guideMarker: {
        backgroundColor: '#10b981',
        padding: 10,
        borderRadius: 25,
        borderWidth: 3,
        borderColor: '#fff',
        ...Shadows.md,
    },

    // Bottom Panel
    bottomPanel: {
        backgroundColor: Colors.surfaceLight,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: Spacing.md,
        paddingTop: 10,
        paddingBottom: 8,
        ...Shadows.lg,
        maxHeight: '42%',
    },
    panelHandle: {
        width: 40,
        height: 4,
        backgroundColor: Colors.borderLight,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 10,
    },
    panelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    panelTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
    toursBadge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
    },
    toursBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    toursList: { paddingBottom: 8 },

    // Tour Cards
    tourCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundLight,
        padding: 12,
        borderRadius: BorderRadius.lg,
        marginBottom: 8,
        gap: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    tourCardSelected: {
        borderColor: Colors.primary,
        backgroundColor: 'rgba(17, 82, 212, 0.05)',
    },
    tourIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(99,102,241,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tourIconSelected: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    tourEmoji: { fontSize: 24 },
    tourInfo: { flex: 1 },
    tourName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
    tourMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 10 },
    tourDistance: { fontSize: 12, color: Colors.textSecondary },
    tourRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    tourRatingText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
    tourDuration: { fontSize: 12, color: Colors.textSecondary },
    tourPriceContainer: { alignItems: 'flex-end', gap: 4 },
    tourPriceText: { fontSize: 17, fontWeight: 'bold', color: Colors.primary },

    // Empty State
    emptyState: { alignItems: 'center', paddingVertical: 24 },
    emptyIcon: { fontSize: 40, marginBottom: 8 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
    emptyText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },

    // Guide Tracker
    guideTracker: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(16,185,129,0.1)',
        padding: 12,
        borderRadius: BorderRadius.lg,
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.2)',
    },
    guideTrackerContent: { flexDirection: 'row', alignItems: 'center' },
    guideAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
    guideAvatarText: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
    guideTrackerInfo: { marginLeft: 12 },
    guideTrackerName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    guideTrackerStatus: { fontSize: 12, color: '#10b981' },
    liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
    liveLabel: { fontSize: 10, fontWeight: 'bold', color: '#10b981' },
});
