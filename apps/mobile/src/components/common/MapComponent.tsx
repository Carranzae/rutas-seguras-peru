/**
 * Ruta Segura Perú - Shared Map Component
 * Reusable map with CartoDB tiles (no watermark)
 */
import { Colors, Shadows } from '@/src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Region, UrlTile } from 'react-native-maps';

// CartoDB Voyager - Clean tiles without visible branding
const TILE_PROVIDERS = {
    voyager: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    dark: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    light: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
} as const;

export interface MapMarker {
    id: string;
    latitude: number;
    longitude: number;
    title?: string;
    description?: string;
    icon?: React.ReactNode;
    color?: string;
}

export interface MapComponentProps {
    initialRegion?: Region;
    markers?: MapMarker[];
    showUserLocation?: boolean;
    showControls?: boolean;
    tileStyle?: keyof typeof TILE_PROVIDERS;
    onMarkerPress?: (marker: MapMarker) => void;
    onRegionChange?: (region: Region) => void;
    onUserLocationChange?: (location: { latitude: number; longitude: number }) => void;
    style?: ViewStyle;
    children?: React.ReactNode;
}

export interface MapComponentRef {
    animateToRegion: (region: Region, duration?: number) => void;
    animateToCoordinate: (lat: number, lng: number, zoom?: number) => void;
    getCurrentRegion: () => Region | null;
}

// Default region: Cusco, Peru
const DEFAULT_REGION: Region = {
    latitude: -13.5319,
    longitude: -71.9675,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
};

export const MapComponent = forwardRef<MapComponentRef, MapComponentProps>(
    (
        {
            initialRegion = DEFAULT_REGION,
            markers = [],
            showUserLocation = true,
            showControls = true,
            tileStyle = 'voyager',
            onMarkerPress,
            onRegionChange,
            style,
            children,
        },
        ref
    ) => {
        const mapRef = useRef<MapView>(null);
        const currentRegion = useRef<Region>(initialRegion);

        useImperativeHandle(ref, () => ({
            animateToRegion: (region: Region, duration = 500) => {
                mapRef.current?.animateToRegion(region, duration);
            },
            animateToCoordinate: (lat: number, lng: number, zoom = 0.02) => {
                mapRef.current?.animateToRegion(
                    {
                        latitude: lat,
                        longitude: lng,
                        latitudeDelta: zoom,
                        longitudeDelta: zoom,
                    },
                    500
                );
            },
            getCurrentRegion: () => currentRegion.current,
        }));

        const handleRegionChange = (region: Region) => {
            currentRegion.current = region;
            onRegionChange?.(region);
        };

        const zoomIn = () => {
            const region = currentRegion.current;
            mapRef.current?.animateToRegion(
                {
                    ...region,
                    latitudeDelta: region.latitudeDelta / 2,
                    longitudeDelta: region.longitudeDelta / 2,
                },
                300
            );
        };

        const zoomOut = () => {
            const region = currentRegion.current;
            mapRef.current?.animateToRegion(
                {
                    ...region,
                    latitudeDelta: region.latitudeDelta * 2,
                    longitudeDelta: region.longitudeDelta * 2,
                },
                300
            );
        };

        return (
            <View style={[styles.container, style]}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={PROVIDER_DEFAULT}
                    initialRegion={initialRegion}
                    showsUserLocation={showUserLocation}
                    showsMyLocationButton={false}
                    showsCompass
                    rotateEnabled
                    onRegionChangeComplete={handleRegionChange}
                >
                    {/* CartoDB Tiles - No watermark */}
                    <UrlTile
                        urlTemplate={TILE_PROVIDERS[tileStyle]}
                        maximumZ={19}
                        flipY={false}
                    />

                    {/* Custom Markers */}
                    {markers.map((marker) => (
                        <Marker
                            key={marker.id}
                            coordinate={{
                                latitude: marker.latitude,
                                longitude: marker.longitude,
                            }}
                            title={marker.title}
                            description={marker.description}
                            onPress={() => onMarkerPress?.(marker)}
                        >
                            {marker.icon || (
                                <View style={[styles.defaultMarker, marker.color ? { backgroundColor: marker.color } : {}]}>
                                    <Ionicons name="location" size={20} color="#fff" />
                                </View>
                            )}
                        </Marker>
                    ))}

                    {children}
                </MapView>

                {/* Zoom Controls */}
                {showControls && (
                    <View style={styles.controls}>
                        <TouchableOpacity style={styles.controlButton} onPress={zoomIn}>
                            <Ionicons name="add" size={24} color={Colors.textPrimary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.controlButton} onPress={zoomOut}>
                            <Ionicons name="remove" size={24} color={Colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    }
);

MapComponent.displayName = 'MapComponent';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    controls: {
        position: 'absolute',
        bottom: 100,
        right: 16,
        backgroundColor: Colors.surfaceLight,
        borderRadius: 12,
        ...Shadows.md,
    },
    controlButton: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    defaultMarker: {
        backgroundColor: Colors.primary,
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#fff',
    },
});

export default MapComponent;
