/**
 * Ruta Segura Perú - Emergency Active Mode Screen
 * Real-time emergency monitoring with live tracking
 */
import { emergencyServiceCompat as emergencyService } from '@/src/services/emergency';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View
} from 'react-native';

interface EmergencyDetails {
    id: string;
    type: 'SOS' | 'MEDICAL' | 'SECURITY' | 'ACCIDENT';
    status: 'active' | 'responding' | 'resolved';
    createdAt: string;
    responders: number;
    eta: number; // minutes
}

export default function EmergencyActiveScreen() {
    const router = useRouter();
    const { emergencyId } = useLocalSearchParams<{ emergencyId: string }>();

    const [emergency, setEmergency] = useState<EmergencyDetails | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null);

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start pulse animation
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.3,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();

        // Fade in
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        // Vibrate pattern
        const vibrationPattern = [500, 1000, 500, 1000];
        Vibration.vibrate(vibrationPattern, true);

        // Track location
        startLocationTracking();

        // Timer
        const timer = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);

        // Load emergency details
        loadEmergencyDetails();

        return () => {
            pulse.stop();
            Vibration.cancel();
            clearInterval(timer);
        };
    }, []);

    const loadEmergencyDetails = async () => {
        try {
            // TODO: Fetch actual emergency details
            setEmergency({
                id: emergencyId || 'EM-' + Date.now(),
                type: 'SOS',
                status: 'active',
                createdAt: new Date().toISOString(),
                responders: 3,
                eta: 8,
            });
        } catch (error) {
            console.error('Error loading emergency:', error);
        }
    };

    const startLocationTracking = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
        });

        // Continuous tracking
        Location.watchPositionAsync(
            { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 10 },
            (loc) => {
                setCurrentLocation({
                    lat: loc.coords.latitude,
                    lng: loc.coords.longitude,
                });
                // Send location to emergency responders  
                if (emergencyId) {
                    // Location updates are handled by the tracking service
                    console.log('Location update:', { lat: loc.coords.latitude, lng: loc.coords.longitude });
                }
            }
        );
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleCall105 = () => {
        Linking.openURL('tel:105');
    };

    const handleCall911 = () => {
        Linking.openURL('tel:911');
    };

    const handleCancelEmergency = () => {
        Alert.alert(
            'Cancelar Emergencia',
            '¿Estás seguro de que quieres cancelar la alerta de emergencia?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Sí, Cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (emergencyId) {
                                await emergencyService.cancelSOS(emergencyId);
                            }
                            Vibration.cancel();
                            router.replace('/(tourist)/(tabs)/home');
                        } catch (error) {
                            console.error('Error resolving emergency:', error);
                        }
                    },
                },
            ]
        );
    };

    const getEmergencyTypeLabel = (type: EmergencyDetails['type']) => {
        switch (type) {
            case 'SOS': return 'Emergencia SOS';
            case 'MEDICAL': return 'Emergencia Médica';
            case 'SECURITY': return 'Emergencia de Seguridad';
            case 'ACCIDENT': return 'Accidente';
            default: return 'Emergencia';
        }
    };

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            {/* Emergency Header */}
            <View style={styles.header}>
                <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>EMERGENCIA ACTIVA</Text>
                </View>
                <Text style={styles.timer}>{formatTime(elapsedTime)}</Text>
            </View>

            {/* Pulsing SOS Icon */}
            <View style={styles.sosContainer}>
                <Animated.View style={[styles.sosRing, { transform: [{ scale: pulseAnim }] }]} />
                <View style={styles.sosIcon}>
                    <Ionicons name="warning" size={80} color="#FFFFFF" />
                </View>
            </View>

            {/* Emergency Type */}
            <Text style={styles.emergencyType}>
                {emergency ? getEmergencyTypeLabel(emergency.type) : 'Procesando...'}
            </Text>

            {/* Status Info */}
            <View style={styles.infoContainer}>
                <View style={styles.infoCard}>
                    <Ionicons name="people" size={24} color="#4CAF50" />
                    <Text style={styles.infoValue}>{emergency?.responders || 0}</Text>
                    <Text style={styles.infoLabel}>Respondiendo</Text>
                </View>
                <View style={styles.infoCard}>
                    <Ionicons name="time" size={24} color="#FFC107" />
                    <Text style={styles.infoValue}>{emergency?.eta || '--'} min</Text>
                    <Text style={styles.infoLabel}>Tiempo estimado</Text>
                </View>
            </View>

            {/* Location Sharing Status */}
            <View style={styles.locationStatus}>
                <Ionicons name="locate" size={20} color="#4CAF50" />
                <Text style={styles.locationText}>
                    Compartiendo ubicación en tiempo real
                </Text>
            </View>

            {/* Emergency Actions */}
            <View style={styles.actionsContainer}>
                <Text style={styles.actionsTitle}>Contacto Directo</Text>

                <TouchableOpacity style={styles.callButton} onPress={handleCall105}>
                    <Ionicons name="call" size={24} color="#FFFFFF" />
                    <View style={styles.callInfo}>
                        <Text style={styles.callNumber}>105</Text>
                        <Text style={styles.callLabel}>Policía Nacional</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.callButton} onPress={handleCall911}>
                    <Ionicons name="call" size={24} color="#FFFFFF" />
                    <View style={styles.callInfo}>
                        <Text style={styles.callNumber}>911</Text>
                        <Text style={styles.callLabel}>Emergencias General</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEmergency}>
                <Text style={styles.cancelButtonText}>Cancelar Alerta</Text>
            </TouchableOpacity>

            {/* Safety Message */}
            <Text style={styles.safetyMessage}>
                Mantén la calma. Ayuda está en camino.{'\n'}
                No cierres esta pantalla.
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a0a0a',
        paddingTop: 60,
        paddingHorizontal: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 82, 82, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF5252',
        marginRight: 8,
    },
    statusText: {
        color: '#FF5252',
        fontWeight: '600',
        fontSize: 12,
        letterSpacing: 1,
    },
    timer: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    sosContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    sosRing: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 3,
        borderColor: 'rgba(255, 82, 82, 0.3)',
    },
    sosIcon: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#FF5252',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF5252',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    emergencyType: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24,
    },
    infoContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    infoCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    infoValue: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 8,
    },
    infoLabel: {
        color: '#8E8E93',
        fontSize: 12,
        marginTop: 4,
    },
    locationStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 24,
    },
    locationText: {
        color: '#4CAF50',
        fontSize: 14,
        marginLeft: 8,
    },
    actionsContainer: {
        marginBottom: 24,
    },
    actionsTitle: {
        color: '#8E8E93',
        fontSize: 14,
        marginBottom: 12,
    },
    callButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    callInfo: {
        flex: 1,
        marginLeft: 16,
    },
    callNumber: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    callLabel: {
        color: '#8E8E93',
        fontSize: 12,
    },
    cancelButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    cancelButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
    safetyMessage: {
        color: '#8E8E93',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 24,
        lineHeight: 22,
    },
});
