// Ruta Segura Perú - Biometric Selfie Check Screen
import { Colors, Spacing } from '@/src/constants/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BiometricSelfieCheck() {
    const [step, setStep] = useState(0); // 0: intro, 1: camera, 2: confirm

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Text style={styles.backIcon}>←</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>Identity Verification</Text>
                <Text style={styles.stepIndicator}>1/3</Text>
            </View>

            <View style={styles.content}>
                {step === 0 && (
                    <>
                        <View style={styles.iconContainer}><Text style={styles.icon}>📸</Text></View>
                        <Text style={styles.title}>Take a Selfie</Text>
                        <Text style={styles.description}>We need to verify your identity. Please take a clear photo of your face in good lighting.</Text>

                        <View style={styles.tips}>
                            <View style={styles.tipItem}><Text style={styles.tipIcon}>💡</Text><Text style={styles.tipText}>Good lighting</Text></View>
                            <View style={styles.tipItem}><Text style={styles.tipIcon}>👓</Text><Text style={styles.tipText}>Remove glasses</Text></View>
                            <View style={styles.tipItem}><Text style={styles.tipIcon}>🎭</Text><Text style={styles.tipText}>No masks</Text></View>
                            <View style={styles.tipItem}><Text style={styles.tipIcon}>📱</Text><Text style={styles.tipText}>Hold steady</Text></View>
                        </View>

                        <TouchableOpacity style={styles.startButton} onPress={() => setStep(1)}>
                            <Text style={styles.startButtonText}>Open Camera</Text>
                        </TouchableOpacity>
                    </>
                )}

                {step === 1 && (
                    <>
                        <View style={styles.cameraPlaceholder}>
                            <View style={styles.faceGuide}><Text style={styles.faceEmoji}>😊</Text></View>
                            <Text style={styles.cameraText}>Position your face in the circle</Text>
                        </View>
                        <TouchableOpacity style={styles.captureButton} onPress={() => setStep(2)}>
                            <View style={styles.captureInner} />
                        </TouchableOpacity>
                    </>
                )}

                {step === 2 && (
                    <>
                        <View style={styles.previewContainer}>
                            <View style={styles.previewImage}><Text style={styles.previewEmoji}>🧑</Text></View>
                            <View style={styles.checkBadge}><Text style={styles.checkIcon}>✓</Text></View>
                        </View>
                        <Text style={styles.title}>Photo Captured!</Text>
                        <Text style={styles.description}>Review your photo to make sure your face is clearly visible.</Text>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.retakeButton} onPress={() => setStep(1)}><Text style={styles.retakeText}>Retake</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.confirmButton} onPress={() => router.push('/(guide)/verification/dircetur-front')}><Text style={styles.confirmText}>Continue</Text></TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 20 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
    stepIndicator: { fontSize: 14, color: Colors.textSecondary },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
    iconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(17, 82, 212, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
    icon: { fontSize: 48 },
    title: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.sm },
    description: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
    tips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
    tipItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
    tipIcon: { fontSize: 16 },
    tipText: { fontSize: 12, color: Colors.textSecondary },
    startButton: { backgroundColor: Colors.primary, width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    startButtonText: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    cameraPlaceholder: { width: 280, height: 360, backgroundColor: Colors.surfaceDark, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
    faceGuide: { width: 180, height: 220, borderRadius: 90, borderWidth: 3, borderColor: Colors.primary, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
    faceEmoji: { fontSize: 64, opacity: 0.5 },
    cameraText: { position: 'absolute', bottom: 20, color: Colors.textMuted, fontSize: 12 },
    captureButton: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary },
    previewContainer: { position: 'relative', marginBottom: Spacing.lg },
    previewImage: { width: 160, height: 160, borderRadius: 80, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
    previewEmoji: { fontSize: 72 },
    checkBadge: { position: 'absolute', bottom: 0, right: 0, width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' },
    checkIcon: { fontSize: 24, color: 'white' },
    buttonRow: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
    retakeButton: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: Colors.surfaceLight },
    retakeText: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
    confirmButton: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: Colors.primary },
    confirmText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
});
