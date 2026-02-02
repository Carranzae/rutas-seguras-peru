// Ruta Segura Perú - Upload DIRCETUR Card Back Screen
import { Colors, Spacing } from '@/src/constants/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UploadDircerturBack() {
    const [hasPhoto, setHasPhoto] = useState(false);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Text style={styles.backIcon}>←</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>DIRCETUR Card</Text>
                <Text style={styles.stepIndicator}>2/3</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.progressBar}><View style={[styles.progressFill, { width: '80%' }]} /></View>
                <Text style={styles.title}>Back of Card</Text>
                <Text style={styles.description}>Now take a photo of the BACK of your DIRCETUR guide license card.</Text>

                <TouchableOpacity style={styles.uploadArea} onPress={() => setHasPhoto(true)}>
                    {hasPhoto ? (
                        <View style={styles.previewCard}><Text style={styles.previewEmoji}>🪪</Text><Text style={styles.previewText}>Card Back Captured</Text><View style={styles.checkBadge}><Text style={styles.checkText}>✓</Text></View></View>
                    ) : (
                        <>
                            <View style={styles.cardOutline}><Text style={styles.cardEmoji}>🪪</Text><Text style={styles.cardLabel}>REVERSO</Text></View>
                            <Text style={styles.uploadText}>Tap to capture photo</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.bottomBar}>
                <TouchableOpacity style={[styles.continueButton, !hasPhoto && styles.buttonDisabled]} onPress={() => router.push('/(guide)/verification/pending')} disabled={!hasPhoto}>
                    <Text style={styles.continueText}>Submit for Verification</Text>
                </TouchableOpacity>
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
    content: { flex: 1, padding: Spacing.md },
    progressBar: { height: 4, backgroundColor: Colors.borderLight, borderRadius: 2, marginBottom: Spacing.lg },
    progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
    title: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.sm },
    description: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.lg },
    uploadArea: { backgroundColor: Colors.surfaceLight, borderRadius: 16, padding: Spacing.xl, alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.borderLight, minHeight: 200, justifyContent: 'center' },
    cardOutline: { width: 240, height: 150, borderRadius: 12, borderWidth: 2, borderColor: Colors.warning, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
    cardEmoji: { fontSize: 48 },
    cardLabel: { fontSize: 12, color: Colors.warning, fontWeight: 'bold', marginTop: 8 },
    uploadText: { fontSize: 14, color: Colors.textSecondary },
    previewCard: { alignItems: 'center' },
    previewEmoji: { fontSize: 64 },
    previewText: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginTop: Spacing.sm },
    checkBadge: { marginTop: Spacing.sm, backgroundColor: Colors.success, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    checkText: { color: 'white', fontSize: 16 },
    bottomBar: { padding: Spacing.md },
    continueButton: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { backgroundColor: Colors.borderLight },
    continueText: { fontSize: 18, fontWeight: 'bold', color: 'white' },
});
