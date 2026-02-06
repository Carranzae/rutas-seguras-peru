/**
 * Ruta Segura Perú - Tourist Map Screen
 * Interactive map with tour locations and guide tracking using react-native-maps
 */
import { BorderRadius, Colors, Shadows, Spacing } from '@/src/constants/theme';
import { httpClient } from '@/src/core/api';
import { useLanguage } from '@/src/i18n';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
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
    latitude?: number;
    longitude?: number;
}

interface GuideLocation {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    isOnTour: boolean;
}

// CartoDB Voyager tiles - Clean modern style without visible watermark
const MAP_TILE_URL = 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';

export default function MapScreen() {
    const { t, language } = useLanguage();
    const mapRef = useRef<MapView>(null);
    const [loading, setLoading] = useState(true);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [nearbyTours, setNearbyTours] = useState<NearbyTour[]>([]);
    const [guideLocation, setGuideLocation] = useState<GuideLocation | null>(null);
    const [selectedTour, setSelectedTour] = useState<NearbyTour | null>(null);
    const [region, setRegion] = useState<Region>({
        latitude: -13.5319,
        longitude: -71.9675,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });

    useEffect(() => {
        initializeMap();
    }, []);

    const initializeMap = async () => {
        try {
            // Request location permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    language === 'es' ? 'Permiso necesario' : 'Permission needed',
                    language === 'es'
                        ? 'Necesitamos acceso a tu ubicación para mostrar tours cercanos'
                        : 'We need access to your location to show nearby tours'
                );
                setLoading(false);
                return;
            }

            // Get current location
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const newLocation = {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
            };
            setCurrentLocation(newLocation);

            // Update map region
            setRegion({
                latitude: newLocation.lat,
                longitude: newLocation.lng,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            });

            // Fetch nearby tours
            await loadNearbyTours(newLocation.lat, newLocation.lng);
        } catch (error) {
            console.error('Map initialization error:', error);
            // Use Cusco as default location
            setCurrentLocation({ lat: -13.5319, lng: -71.9675 });
            loadMockTours();
        } finally {
            setLoading(false);
        }
    };

    const loadNearbyTours = async (lat: number, lng: number) => {
        try {
            const response = await httpClient.get<{ items: any[] }>(`/tours/search?lat=${lat}&lng=${lng}&radius=50`);

            if (response.data?.items) {
                const toursWithLocation = response.data.items.map((tour: any) => ({
                    id: tour.id,
                    name: tour.name,
                    distance: calculateDistance(lat, lng, tour.latitude || lat + (Math.random() - 0.5) * 0.1, tour.longitude || lng + (Math.random() - 0.5) * 0.1),
                    rating: tour.rating || 4.5,
                    price: tour.price,
                    latitude: tour.latitude || lat + (Math.random() - 0.5) * 0.1,
                    longitude: tour.longitude || lng + (Math.random() - 0.5) * 0.1,
                }));
                setNearbyTours(toursWithLocation);
            } else {
                loadMockTours();
            }
        } catch (error) {
            console.error('Error loading tours:', error);
            loadMockTours();
        }
    };

    const loadMockTours = () => {
        const baseLat = currentLocation?.lat || -13.5319;
        const baseLng = currentLocation?.lng || -71.9675;

        setNearbyTours([
            {
                id: '1',
                name: 'Machu Picchu Sunrise',
                distance: '2.3 km',
                rating: 4.9,
                price: 120,
                latitude: baseLat + 0.02,
                longitude: baseLng + 0.015,
            },
            {
                id: '2',
                name: 'Sacred Valley Tour',
                distance: '5.1 km',
                rating: 4.8,
                price: 85,
                latitude: baseLat - 0.015,
                longitude: baseLng + 0.025,
            },
            {
                id: '3',
                name: 'Cusco City Walk',
                distance: '0.5 km',
                rating: 4.7,
                price: 35,
                latitude: baseLat + 0.005,
                longitude: baseLng - 0.008,
            },
            {
                id: '4',
                name: 'Rainbow Mountain',
                distance: '15.2 km',
                rating: 4.6,
                price: 95,
                latitude: baseLat - 0.03,
                longitude: baseLng - 0.02,
            },
        ]);
    };

    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): string => {
        const R = 6371; // Earth's radius in km
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

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>
                    {language === 'es' ? 'Cargando mapa...' : 'Loading map...'}
                </Text>
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
                    {/* CartoDB Voyager Tiles - No watermark */}
                    <UrlTile
                        urlTemplate={MAP_TILE_URL}
                        maximumZ={19}
                        flipY={false}
                    />

                    {/* Tour Markers */}
                    {nearbyTours.map((tour) => (
                        tour.latitude && tour.longitude && (
                            <Marker
                                key={tour.id}
                                coordinate={{
                                    latitude: tour.latitude,
                                    longitude: tour.longitude,
                                }}
                                title={tour.name}
                                description={`$${tour.price} • ⭐ ${tour.rating}`}
                                onPress={() => handleTourPress(tour)}
                            >
                                <View style={styles.markerContainer}>
                                    <View style={[
                                        styles.marker,
                                        selectedTour?.id === tour.id && styles.markerSelected
                                    ]}>
                                        <Text style={styles.markerText}>🏛️</Text>
                                    </View>
                                    <View style={styles.markerArrow} />
                                </View>
                            </Marker>
                        )
                    ))}

                    {/* Guide Location Marker (when tracking) */}
                    {guideLocation && (
                        <Marker
                            coordinate={{
                                latitude: guideLocation.latitude,
                                longitude: guideLocation.longitude,
                            }}
                            title={guideLocation.name}
                            description="Tu guía"
                        >
                            <View style={styles.guideMarker}>
                                <Ionicons name="person" size={20} color="#fff" />
                            </View>
                        </Marker>
                    )}
                </MapView>

                {/* Search Button */}
                <TouchableOpacity style={styles.searchButton}>
                    <Ionicons name="search" size={20} color={Colors.textPrimary} />
                    <Text style={styles.searchText}>
                        {language === 'es' ? 'Buscar lugares...' : 'Search places...'}
                    </Text>
                </TouchableOpacity>

                {/* Current Location Button */}
                <TouchableOpacity style={styles.locationButton} onPress={centerOnUser}>
                    <Ionicons name="locate" size={24} color={Colors.primary} />
                </TouchableOpacity>

                {/* Zoom Controls */}
                <View style={styles.zoomControls}>
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
                        <Ionicons name="add" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
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
                        <Ionicons name="remove" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bottom Panel - Nearby Tours */}
            <View style={styles.bottomPanel}>
                <View style={styles.panelHandle} />
                <Text style={styles.panelTitle}>
                    {language === 'es' ? 'Tours Cercanos' : 'Nearby Tours'}
                </Text>

                {nearbyTours.map((tour) => (
                    <TouchableOpacity
                        key={tour.id}
                        style={[
                            styles.tourCard,
                            selectedTour?.id === tour.id && styles.tourCardSelected
                        ]}
                        onPress={() => goToTourDetail(tour)}
                    >
                        <View style={styles.tourIcon}>
                            <Text style={styles.tourEmoji}>🏛️</Text>
                        </View>
                        <View style={styles.tourInfo}>
                            <Text style={styles.tourName} numberOfLines={1}>{tour.name}</Text>
                            <View style={styles.tourMeta}>
                                <Text style={styles.tourDistance}>📍 {tour.distance}</Text>
                                <View style={styles.tourRating}>
                                    <Ionicons name="star" size={12} color="#fbbf24" />
                                    <Text style={styles.tourRatingText}>{tour.rating}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.tourPrice}>
                            <Text style={styles.tourPriceText}>${tour.price}</Text>
                        </View>
                    </TouchableOpacity>
                ))}

                {/* Guide Tracking (when on active tour) */}
                {guideLocation && (
                    <View style={styles.guideTracker}>
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
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    loadingContainer: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: Colors.textSecondary },

    mapContainer: { flex: 1, position: 'relative' },
    map: { ...StyleSheet.absoluteFillObject },

    searchButton: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceLight,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: BorderRadius.xl,
        gap: 12,
        ...Shadows.md
    },
    searchText: { fontSize: 15, color: Colors.textSecondary },

    locationButton: {
        position: 'absolute',
        bottom: 200,
        right: 16,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.md
    },

    zoomControls: {
        position: 'absolute',
        bottom: 260,
        right: 16,
        backgroundColor: Colors.surfaceLight,
        borderRadius: 12,
        ...Shadows.md,
    },
    zoomButton: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },

    markerContainer: { alignItems: 'center' },
    marker: {
        backgroundColor: Colors.primary,
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#fff',
    },
    markerSelected: {
        backgroundColor: '#10b981',
        transform: [{ scale: 1.2 }],
    },
    markerText: { fontSize: 18 },
    markerArrow: {
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: Colors.primary,
        marginTop: -2,
    },

    guideMarker: {
        backgroundColor: '#10b981',
        padding: 10,
        borderRadius: 25,
        borderWidth: 3,
        borderColor: '#fff',
    },

    bottomPanel: {
        backgroundColor: Colors.surfaceLight,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: Spacing.md,
        paddingTop: 12,
        ...Shadows.lg,
        maxHeight: '40%',
    },
    panelHandle: { width: 40, height: 4, backgroundColor: Colors.borderLight, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
    panelTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 12 },

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
    tourIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.1)', alignItems: 'center', justifyContent: 'center' },
    tourEmoji: { fontSize: 24 },
    tourInfo: { flex: 1 },
    tourName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
    tourMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 12 },
    tourDistance: { fontSize: 12, color: Colors.textSecondary },
    tourRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    tourRatingText: { fontSize: 12, color: Colors.textSecondary },
    tourPrice: {},
    tourPriceText: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },

    guideTracker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.1)', padding: 12, borderRadius: BorderRadius.lg, marginTop: 8 },
    guideTrackerContent: { flexDirection: 'row', alignItems: 'center' },
    guideAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    guideAvatarText: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
    guideTrackerInfo: { marginLeft: 12 },
    guideTrackerName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    guideTrackerStatus: { fontSize: 12, color: '#10b981' },
    liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
    liveLabel: { fontSize: 10, fontWeight: 'bold', color: '#10b981' },
});
