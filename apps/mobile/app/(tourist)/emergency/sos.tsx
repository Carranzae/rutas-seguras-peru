// Ruta Segura Perú - Satelital SOS Emergency Screen
import { Colors, Spacing } from '@/src/constants/theme';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SatelitalSOSEmergency() {
    const [isActivated, setIsActivated] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        if (isActivated && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (isActivated && countdown === 0) {
            Vibration.vibrate([0, 500, 200, 500]);
        }
    }, [isActivated, countdown]);

    const activateSOS = () => {
        Vibration.vibrate(500);
        setIsActivated(true);
    };

    const cancelSOS = () => {
        setIsActivated(false);
        setCountdown(5);
    };

    return (
        <SafeAreaView style={[styles.container, isActivated && styles.containerActive]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Text style={styles.backIcon}>←</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>Emergency SOS</Text>
                <View style={styles.satIcon}><Text>📡</Text></View>
            </View>

            {!isActivated ? (
                <View style={styles.content}>
                    <View style={styles.infoBox}>
                        <Text style={styles.infoIcon}>🛰️</Text>
                        <Text style={styles.infoTitle}>Satellite Emergency</Text>
                        <Text style={styles.infoText}>Press and hold the button below to send an emergency signal via satellite. Your location will be shared with emergency services.</Text>
                    </View>

                    <Animated.View style={[styles.sosButtonOuter, { transform: [{ scale: pulseAnim }] }]}>
                        <TouchableOpacity style={styles.sosButton} onLongPress={activateSOS} delayLongPress={1000}>
                            <Text style={styles.sosIcon}>🆘</Text>
                            <Text style={styles.sosText}>HOLD FOR SOS</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    <View style={styles.statusCard}>
                        <View style={styles.statusRow}><Text style={styles.statusLabel}>📍 GPS Status</Text><Text style={styles.statusValue}>Active</Text></View>
                        <View style={styles.statusRow}><Text style={styles.statusLabel}>📡 Satellite</Text><Text style={styles.statusValue}>Connected</Text></View>
                        <View style={styles.statusRow}><Text style={styles.statusLabel}>🔋 Battery</Text><Text style={styles.statusValue}>78%</Text></View>
                    </View>

                    <Text style={styles.instructions}>Press and hold for 3 seconds to activate emergency signal</Text>
                </View>
            ) : (
                <View style={styles.content}>
                    <View style={styles.activatedBox}>
                        <Text style={styles.alertEmoji}>🚨</Text>
                        {countdown > 0 ? (
                            <>
                                <Text style={styles.countdownText}>{countdown}</Text>
                                <Text style={styles.countdownLabel}>SENDING IN...</Text>
                                <TouchableOpacity style={styles.cancelButton} onPress={cancelSOS}>
                                    <Text style={styles.cancelButtonText}>Cancel Emergency</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={styles.sentTitle}>🛰️ SIGNAL SENT</Text>
                                <Text style={styles.sentText}>Emergency services have been notified. Stay calm, help is on the way.</Text>
                                <View style={styles.locationCard}>
                                    <Text style={styles.locationLabel}>Your Location</Text>
                                    <Text style={styles.locationValue}>-13.163141, -72.544963</Text>
                                    <Text style={styles.locationName}>Near Machu Picchu, Cusco</Text>
                                </View>
                                <Text style={styles.etaText}>Estimated response: 15-30 minutes</Text>
                            </>
                        )}
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundDark },
    containerActive: { backgroundColor: '#1a0a0a' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 20, color: 'white' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    satIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(16, 185, 129, 0.2)', alignItems: 'center', justifyContent: 'center' },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
    infoBox: { alignItems: 'center', marginBottom: Spacing.xl },
    infoIcon: { fontSize: 48, marginBottom: Spacing.sm },
    infoTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: Spacing.sm },
    infoText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
    sosButtonOuter: { width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(239, 68, 68, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
    sosButton: { width: 160, height: 160, borderRadius: 80, backgroundColor: Colors.danger, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: Colors.danger, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16 },
    sosIcon: { fontSize: 48 },
    sosText: { fontSize: 14, fontWeight: 'bold', color: 'white', marginTop: 8 },
    statusCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: Spacing.md, width: '100%', marginBottom: Spacing.lg },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    statusLabel: { fontSize: 14, color: Colors.textMuted },
    statusValue: { fontSize: 14, color: Colors.success, fontWeight: '600' },
    instructions: { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
    activatedBox: { alignItems: 'center' },
    alertEmoji: { fontSize: 64, marginBottom: Spacing.md },
    countdownText: { fontSize: 96, fontWeight: 'bold', color: Colors.danger },
    countdownLabel: { fontSize: 18, color: Colors.textMuted, marginBottom: Spacing.xl },
    cancelButton: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    cancelButtonText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
    sentTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.success, marginBottom: Spacing.sm },
    sentText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.lg },
    locationCard: { backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: Spacing.md, borderRadius: 12, alignItems: 'center', marginBottom: Spacing.md },
    locationLabel: { fontSize: 12, color: Colors.textMuted },
    locationValue: { fontSize: 16, fontWeight: 'bold', color: 'white', fontFamily: 'monospace', marginTop: 4 },
    locationName: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
    etaText: { fontSize: 14, color: Colors.warning },
});
