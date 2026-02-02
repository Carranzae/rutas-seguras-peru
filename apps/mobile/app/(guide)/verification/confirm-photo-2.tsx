// Ruta Segura Perú - Confirm Biometric Photo Step 2
import { Colors, Spacing } from '@/src/constants/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConfirmBiometricPhoto2() {
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    const handleConfirm = () => {
        setIsVerifying(true);
        setTimeout(() => {
            setIsVerified(true);
            setTimeout(() => {
                router.push('/(guide)/verification/verify-data');
            }, 1500);
        }, 2000);
    };

    const handleRetake = () => {
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backBtnText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Confirm Photo</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                {isVerified ? (
                    <View style={styles.successContainer}>
                        <View style={styles.successIcon}>
                            <Text style={{ fontSize: 64 }}>✅</Text>
                        </View>
                        <Text style={styles.successTitle}>Face Verified!</Text>
                        <Text style={styles.successSubtitle}>Your biometric data has been captured successfully.</Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.mainTitle}>Review Your Photo</Text>
                        <Text style={styles.subtitle}>Make sure your face is clearly visible and matches your ID photo.</Text>

                        {/* Photo Preview */}
                        <View style={styles.photoContainer}>
                            <View style={styles.photoPreview}>
                                {isVerifying ? (
                                    <View style={styles.verifyingState}>
                                        <Text style={{ fontSize: 32 }}>🔄</Text>
                                        <Text style={styles.verifyingText}>Verifying face match...</Text>
                                    </View>
                                ) : (
                                    <Text style={{ fontSize: 80 }}>👤</Text>
                                )}
                            </View>
                            {!isVerifying && (
                                <View style={styles.matchIndicator}>
                                    <Text style={styles.matchIcon}>✓</Text>
                                    <Text style={styles.matchText}>Good quality</Text>
                                </View>
                            )}
                        </View>

                        {/* Comparison */}
                        {!isVerifying && (
                            <View style={styles.comparison}>
                                <View style={styles.comparisonItem}>
                                    <View style={styles.comparisonPhoto}><Text style={{ fontSize: 24 }}>🪪</Text></View>
                                    <Text style={styles.comparisonLabel}>ID Photo</Text>
                                </View>
                                <View style={styles.comparisonArrow}><Text>↔️</Text></View>
                                <View style={styles.comparisonItem}>
                                    <View style={styles.comparisonPhoto}><Text style={{ fontSize: 24 }}>📷</Text></View>
                                    <Text style={styles.comparisonLabel}>Selfie</Text>
                                </View>
                            </View>
                        )}
                    </>
                )}
            </View>

            {!isVerified && (
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake} disabled={isVerifying}>
                        <Text style={styles.retakeBtnText}>Retake</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.confirmBtn, isVerifying && styles.confirmBtnDisabled]} onPress={handleConfirm} disabled={isVerifying}>
                        <Text style={styles.confirmBtnText}>{isVerifying ? 'Verifying...' : 'Confirm & Continue'}</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundDark },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    backBtnText: { color: 'white', fontSize: 18 },
    title: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    content: { flex: 1, paddingHorizontal: Spacing.lg, alignItems: 'center', justifyContent: 'center' },
    mainTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#92a4c9', textAlign: 'center', marginBottom: Spacing.xl },
    photoContainer: { width: 200, height: 240, borderRadius: 24, overflow: 'hidden', backgroundColor: '#1e2430', marginBottom: Spacing.lg, position: 'relative' },
    photoPreview: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    verifyingState: { alignItems: 'center' },
    verifyingText: { color: Colors.primary, marginTop: Spacing.md, fontSize: 14 },
    matchIndicator: { position: 'absolute', bottom: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingVertical: 8, borderRadius: 8 },
    matchIcon: { color: Colors.success, marginRight: 4 },
    matchText: { color: Colors.success, fontSize: 12, fontWeight: 'bold' },
    comparison: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
    comparisonItem: { alignItems: 'center' },
    comparisonPhoto: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#1e2430', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    comparisonLabel: { fontSize: 12, color: '#92a4c9' },
    comparisonArrow: { marginHorizontal: Spacing.sm },
    successContainer: { alignItems: 'center' },
    successIcon: { marginBottom: Spacing.lg },
    successTitle: { fontSize: 28, fontWeight: 'bold', color: Colors.success, marginBottom: 8 },
    successSubtitle: { fontSize: 14, color: '#92a4c9', textAlign: 'center' },
    footer: { flexDirection: 'row', padding: Spacing.lg, gap: 12 },
    retakeBtn: { flex: 0.4, backgroundColor: '#1e2430', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    retakeBtnText: { color: 'white', fontWeight: 'bold' },
    confirmBtn: { flex: 0.6, backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    confirmBtnDisabled: { opacity: 0.7 },
    confirmBtnText: { color: 'white', fontWeight: 'bold' },
});
