// Ruta Segura Perú - Verify DIRCETUR Card Data
import { Colors, Spacing } from '@/src/constants/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VerifyCardData() {
    const [licenseNumber, setLicenseNumber] = useState('1234-5678-90');
    const [fullName, setFullName] = useState('Juan Perez');
    const [expiryDate, setExpiryDate] = useState('12/2025');

    const handleSubmit = () => {
        router.push('/(guide)/verification/pending');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Verify Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Progress Bar */}
                <View style={styles.progress}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressStep}>Step 3 of 4</Text>
                        <Text style={styles.progressLabel}>Data Review</Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '75%' }]} />
                    </View>
                </View>

                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.mainTitle}>Review Card Details</Text>
                    <Text style={styles.subtitle}>Please verify the information scanned from your DIRCETUR card. Tap images to zoom in and check details.</Text>
                </View>

                {/* Card Images */}
                <View style={styles.cardImages}>
                    <TouchableOpacity style={styles.cardImage}>
                        <View style={styles.cardPlaceholder}><Text style={{ fontSize: 32 }}>🪪</Text></View>
                        <Text style={styles.cardLabel}>Front</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cardImage}>
                        <View style={styles.cardPlaceholder}><Text style={{ fontSize: 32 }}>🔲</Text></View>
                        <Text style={styles.cardLabel}>Back</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.retakeBtn}>
                    <Text style={styles.retakeBtnText}>📷 Retake Photos</Text>
                </TouchableOpacity>

                {/* Form Fields */}
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>LICENSE NUMBER</Text>
                        <View style={styles.inputContainer}>
                            <TextInput style={styles.input} value={licenseNumber} onChangeText={setLicenseNumber} />
                            <Text style={styles.validIcon}>✅</Text>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>FULL NAME</Text>
                        <View style={styles.inputContainer}>
                            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
                            <Text style={styles.validIcon}>✅</Text>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>EXPIRY DATE</Text>
                        <View style={[styles.inputContainer, styles.inputWarning]}>
                            <TextInput style={styles.input} value={expiryDate} onChangeText={setExpiryDate} />
                            <Text style={styles.warningIcon}>⚠️</Text>
                        </View>
                        <Text style={styles.warningText}>ℹ️ Please confirm expiry date format</Text>
                    </View>
                </View>

                {/* Info Box */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoIcon}>🛡️</Text>
                    <Text style={styles.infoText}>By submitting, you confirm that the details above match your physical DIRCETUR card exactly.</Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                    <Text style={styles.submitBtnText}>Submit for Audit</Text>
                    <Text style={styles.submitBtnArrow}>→</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rescanBtn}>
                    <Text style={styles.rescanBtnText}>Data is incorrect? Scan Again</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundDark },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    content: { flex: 1, paddingHorizontal: Spacing.lg },
    progress: { marginBottom: Spacing.lg },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressStep: { fontSize: 14, color: '#92a4c9' },
    progressLabel: { fontSize: 12, color: Colors.primary, fontWeight: 'bold', textTransform: 'uppercase' },
    progressBar: { height: 6, backgroundColor: '#324467', borderRadius: 3 },
    progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
    titleSection: { marginBottom: Spacing.lg },
    mainTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#92a4c9', lineHeight: 20 },
    cardImages: { flexDirection: 'row', gap: 12, marginBottom: 8 },
    cardImage: { flex: 1, alignItems: 'center' },
    cardPlaceholder: { width: '100%', aspectRatio: 1.5, backgroundColor: '#1c262e', borderRadius: 12, borderWidth: 1, borderColor: '#324467', alignItems: 'center', justifyContent: 'center' },
    cardLabel: { fontSize: 12, color: '#92a4c9', marginTop: 8 },
    retakeBtn: { alignSelf: 'center', marginBottom: Spacing.lg },
    retakeBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
    form: { marginBottom: Spacing.lg },
    inputGroup: { marginBottom: Spacing.md },
    label: { fontSize: 10, fontWeight: 'bold', color: '#92a4c9', letterSpacing: 1, marginBottom: 6 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c262e', borderRadius: 12, borderWidth: 1, borderColor: '#324467' },
    inputWarning: { borderColor: '#f59e0b' },
    input: { flex: 1, color: 'white', fontSize: 16, paddingHorizontal: 16, paddingVertical: 14 },
    validIcon: { paddingRight: 16, fontSize: 16 },
    warningIcon: { paddingRight: 16, fontSize: 16 },
    warningText: { fontSize: 12, color: '#f59e0b', marginTop: 4 },
    infoBox: { flexDirection: 'row', backgroundColor: 'rgba(17, 82, 212, 0.1)', borderRadius: 12, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(17, 82, 212, 0.2)' },
    infoIcon: { fontSize: 18, marginRight: 8 },
    infoText: { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
    footer: { padding: Spacing.lg, backgroundColor: '#1c262e', borderTopWidth: 1, borderTopColor: '#324467' },
    submitBtn: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 8, marginBottom: 12 },
    submitBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    submitBtnArrow: { color: 'white', fontSize: 18 },
    rescanBtn: { alignItems: 'center' },
    rescanBtnText: { color: '#92a4c9', fontSize: 14 },
});
