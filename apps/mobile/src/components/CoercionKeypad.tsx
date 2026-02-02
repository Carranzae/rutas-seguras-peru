/**
 * Ruta Segura Perú - Coercion PIN Keypad
 * Dual-PIN system with silent alarm for duress situations
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View
} from 'react-native';
import api from '../services/api';

interface CoercionKeypadProps {
    onSuccess: () => void;
    onCancel?: () => void;
    visible: boolean;
}

// Storage keys
const REAL_PIN_KEY = '@ruta_segura:real_pin';
const COERCION_PIN_KEY = '@ruta_segura:coercion_pin';

/**
 * CoercionKeypad - Dual PIN authentication system
 * 
 * Real PIN: Unlocks the app normally
 * Coercion PIN: Shows fake error but triggers silent SOS
 */
export default function CoercionKeypad({ onSuccess, onCancel, visible }: CoercionKeypadProps) {
    const [pin, setPin] = useState('');
    const [realPin, setRealPin] = useState<string | null>(null);
    const [coercionPin, setCoercionPin] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [attempts, setAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);

    const shakeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadPins();
    }, []);

    const loadPins = async () => {
        try {
            const stored_real = await SecureStore.getItemAsync(REAL_PIN_KEY);
            const stored_coercion = await SecureStore.getItemAsync(COERCION_PIN_KEY);

            setRealPin(stored_real || '1234');  // Default for demo
            setCoercionPin(stored_coercion || '9911');  // Default coercion PIN
        } catch (e) {
            console.error('Failed to load PINs:', e);
        }
    };

    const shake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const handleKeyPress = useCallback(async (key: string) => {
        if (isLocked) return;

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (key === 'delete') {
            setPin(prev => prev.slice(0, -1));
            setError(null);
            return;
        }

        if (pin.length >= 6) return;

        const newPin = pin + key;
        setPin(newPin);

        // Check when PIN is complete (4 digits)
        if (newPin.length === 4) {
            await verifyPin(newPin);
        }
    }, [pin, isLocked, realPin, coercionPin]);

    const verifyPin = async (enteredPin: string) => {
        // Check for COERCION PIN first
        if (enteredPin === coercionPin) {
            await handleCoercionPin();
            return;
        }

        // Check for REAL PIN
        if (enteredPin === realPin) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSuccess();
            setPin('');
            return;
        }

        // Invalid PIN
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Vibration.vibrate(200);
        shake();

        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 5) {
            setIsLocked(true);
            setError('Demasiados intentos. Intente en 30 segundos.');
            setTimeout(() => {
                setIsLocked(false);
                setAttempts(0);
                setError(null);
            }, 30000);
        } else {
            setError(`PIN incorrecto. Intentos restantes: ${5 - newAttempts}`);
        }

        setPin('');
    };

    const handleCoercionPin = async () => {
        /**
         * COERCION PIN FLOW:
         * 1. Show fake "error" to deceive attacker
         * 2. Silently trigger SOS in background
         * 3. Vibrate like normal error
         */

        // Make it look like a normal error
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Vibration.vibrate(200);
        shake();

        setError('Error de conexión. Intente nuevamente.');
        setPin('');

        // Trigger silent SOS in background
        try {
            // Get current location
            const location = await getCurrentLocation();

            await api.post('/emergencies/sos', {
                location: {
                    latitude: location?.latitude || 0,
                    longitude: location?.longitude || 0,
                },
                severity: 'CRITICAL',
                description: 'COERCION PIN ACTIVATED - Silent Alert',
                is_silent: true,  // Critical flag for backend
            });

            console.log('Silent SOS triggered successfully');
        } catch (error) {
            // Silently fail - don't alert the attacker
            console.error('Silent SOS failed:', error);
        }
    };

    const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
        try {
            const Location = require('expo-location');
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return null;

            const location = await Location.getCurrentPositionAsync({});
            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
        } catch (e) {
            return null;
        }
    };

    const renderPinDots = () => {
        return (
            <View style={styles.dotsContainer}>
                {[0, 1, 2, 3].map(i => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            pin.length > i && styles.dotFilled,
                            error && styles.dotError,
                        ]}
                    />
                ))}
            </View>
        );
    };

    const renderKeypad = () => {
        const keys = [
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['', '0', 'delete'],
        ];

        return (
            <View style={styles.keypad}>
                {keys.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.keypadRow}>
                        {row.map((key, keyIndex) => {
                            if (key === '') {
                                return <View key={keyIndex} style={styles.keyEmpty} />;
                            }

                            return (
                                <TouchableOpacity
                                    key={keyIndex}
                                    style={[
                                        styles.key,
                                        isLocked && styles.keyDisabled,
                                    ]}
                                    onPress={() => handleKeyPress(key)}
                                    disabled={isLocked}
                                >
                                    {key === 'delete' ? (
                                        <Ionicons name="backspace-outline" size={28} color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.keyText}>{key}</Text>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </View>
        );
    };

    if (!visible) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {onCancel && (
                    <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                        <Ionicons name="close" size={24} color="#8E8E93" />
                    </TouchableOpacity>
                )}
                <View style={styles.iconContainer}>
                    <Ionicons name="lock-closed" size={40} color="#FF6B35" />
                </View>
                <Text style={styles.title}>Ingrese su PIN</Text>
                <Text style={styles.subtitle}>
                    Ingrese su código de 4 dígitos para continuar
                </Text>
            </View>

            <Animated.View style={[styles.pinContainer, { transform: [{ translateX: shakeAnim }] }]}>
                {renderPinDots()}
                {error && <Text style={styles.errorText}>{error}</Text>}
            </Animated.View>

            {renderKeypad()}

            <Text style={styles.hint}>
                ¿Olvidaste tu PIN? Usa tu huella dactilar o Face ID.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0F1C',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    cancelButton: {
        position: 'absolute',
        right: 0,
        top: -20,
        padding: 8,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 107, 53, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
    },
    pinContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#8E8E93',
        backgroundColor: 'transparent',
    },
    dotFilled: {
        backgroundColor: '#FF6B35',
        borderColor: '#FF6B35',
    },
    dotError: {
        borderColor: '#FF5252',
        backgroundColor: '#FF5252',
    },
    errorText: {
        color: '#FF5252',
        fontSize: 14,
        marginTop: 16,
        textAlign: 'center',
    },
    keypad: {
        gap: 16,
    },
    keypadRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
    },
    key: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyDisabled: {
        opacity: 0.3,
    },
    keyEmpty: {
        width: 72,
        height: 72,
    },
    keyText: {
        fontSize: 28,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    hint: {
        color: '#8E8E93',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 40,
    },
});
