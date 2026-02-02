// Ruta Segura Perú - Confirm Biometric Photo Step 1
import { Colors, Spacing } from '@/src/constants/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConfirmBiometricPhoto1() {
    const [isCapturing, setIsCapturing] = useState(false);

    const handleCapture = () => {
        setIsCapturing(true);
        setTimeout(() => {
            router.navigate({ pathname: '/(guide)/verification/confirm-photo-2' } as never);
        }, 2000);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backBtnText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Biometric Verification</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Progress */}
            <View style={styles.progress}>
                <View style={styles.progressHeader}>
                    <Text style={styles.progressStep}>Step 2 of 4</Text>
                    <Text style={styles.progressLabel}>Face Capture</Text>
                </View>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '50%' }]} />
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.mainTitle}>Capture Your Face</Text>
                <Text style={styles.subtitle}>Position your face within the oval frame. Look directly at the camera.</Text>

                {/* Camera Area */}
                <View style={styles.cameraContainer}>
                    <View style={styles.cameraPreview}>
                        {isCapturing ? (
                            <View style={styles.capturingState}>
                                <Text style={{ fontSize: 48 }}>📸</Text>
                                <Text style={styles.capturingText}>Capturing...</Text>
                            </View>
                        ) : (
                            <View style={styles.readyState}>
                                <Text style={{ fontSize: 64 }}>👤</Text>
                                <Text style={styles.cameraHint}>Position your face here</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.ovalOverlay} />
                </View>

                {/* Tips */}
                <View style={styles.tips}>
                    <View style={styles.tip}>
                        <Text style={styles.tipIcon}>✓</Text>
                        <Text style={styles.tipText}>Good lighting</Text>
                    </View>
                    <View style={styles.tip}>
                        <Text style={styles.tipIcon}>✓</Text>
                        <Text style={styles.tipText}>Look straight</Text>
                    </View>
                    <View style={styles.tip}>
                        <Text style={styles.tipIcon}>✓</Text>
                        <Text style={styles.tipText}>No glasses</Text>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.captureBtn, isCapturing && styles.capturingBtn]} onPress={handleCapture} disabled={isCapturing}>
                    <View style={[styles.captureInner, isCapturing && styles.capturingInner]} />
                </TouchableOpacity>
                <Text style={styles.captureHint}>{isCapturing ? 'Hold still...' : 'Tap to capture'}</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundDark },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    backBtnText: { color: 'white', fontSize: 18 },
    title: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    progress: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressStep: { fontSize: 14, color: '#92a4c9' },
    progressLabel: { fontSize: 12, color: Colors.primary, fontWeight: 'bold', textTransform: 'uppercase' },
    progressBar: { height: 6, backgroundColor: '#324467', borderRadius: 3 },
    progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
    content: { flex: 1, paddingHorizontal: Spacing.lg, alignItems: 'center' },
    mainTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#92a4c9', textAlign: 'center', marginBottom: Spacing.lg },
    cameraContainer: { width: '100%', aspectRatio: 0.8, borderRadius: 24, overflow: 'hidden', backgroundColor: '#1e2430', position: 'relative' },
    cameraPreview: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    readyState: { alignItems: 'center' },
    capturingState: { alignItems: 'center' },
    cameraHint: { color: '#92a4c9', marginTop: Spacing.md, fontSize: 14 },
    capturingText: { color: Colors.primary, marginTop: Spacing.md, fontSize: 16, fontWeight: 'bold' },
    ovalOverlay: { position: 'absolute', top: '10%', left: '15%', right: '15%', bottom: '20%', borderWidth: 3, borderColor: Colors.primary, borderRadius: 999, opacity: 0.7 },
    tips: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: Spacing.lg },
    tip: { flexDirection: 'row', alignItems: 'center' },
    tipIcon: { color: Colors.success, marginRight: 4 },
    tipText: { color: '#92a4c9', fontSize: 12 },
    footer: { alignItems: 'center', paddingBottom: Spacing.xl },
    captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 4, borderColor: 'white', alignItems: 'center', justifyContent: 'center' },
    capturingBtn: { borderColor: Colors.primary },
    captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white' },
    capturingInner: { backgroundColor: Colors.primary, transform: [{ scale: 0.8 }] },
    captureHint: { color: '#92a4c9', marginTop: Spacing.md, fontSize: 14 },
});
