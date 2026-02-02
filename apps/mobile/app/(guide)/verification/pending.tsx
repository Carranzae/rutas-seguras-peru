// Ruta Segura Perú - Verification Pending Screen
import { Colors, Spacing } from '@/src/constants/theme';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VerificationPending() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}><Text style={styles.icon}>⏳</Text></View>
                <Text style={styles.title}>Verification in Progress</Text>
                <Text style={styles.description}>Your documents have been submitted successfully. Our team will verify your DIRCETUR license within 24-48 hours.</Text>

                <View style={styles.statusCard}>
                    <View style={styles.statusRow}><Text style={styles.statusLabel}>📸 Selfie</Text><Text style={styles.statusValue}>✓ Submitted</Text></View>
                    <View style={styles.statusRow}><Text style={styles.statusLabel}>🪪 DIRCETUR Front</Text><Text style={styles.statusValue}>✓ Submitted</Text></View>
                    <View style={styles.statusRow}><Text style={styles.statusLabel}>🪪 DIRCETUR Back</Text><Text style={styles.statusValue}>✓ Submitted</Text></View>
                    <View style={styles.statusRow}><Text style={styles.statusLabel}>🔍 Verification</Text><Text style={[styles.statusValue, { color: Colors.warning }]}>⏳ Pending</Text></View>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.infoIcon}>📧</Text>
                    <Text style={styles.infoText}>We'll send you an email notification once your verification is complete.</Text>
                </View>
            </View>

            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/(guide)/(tabs)/dashboard')}>
                    <Text style={styles.homeButtonText}>Go to Dashboard</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
    iconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(245, 158, 11, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
    icon: { fontSize: 56 },
    title: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'center' },
    description: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
    statusCard: { backgroundColor: Colors.surfaceLight, width: '100%', padding: Spacing.md, borderRadius: 16, marginBottom: Spacing.lg },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    statusLabel: { fontSize: 14, color: Colors.textSecondary },
    statusValue: { fontSize: 14, fontWeight: '600', color: Colors.success },
    infoCard: { flexDirection: 'row', backgroundColor: 'rgba(17, 82, 212, 0.05)', padding: Spacing.md, borderRadius: 12, gap: Spacing.sm },
    infoIcon: { fontSize: 20 },
    infoText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
    bottomBar: { padding: Spacing.md },
    homeButton: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    homeButtonText: { fontSize: 18, fontWeight: 'bold', color: 'white' },
});
