// Ruta Segura Perú - Biometric Password Reset
import { Colors, Spacing } from '@/src/constants/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BiometricPasswordReset() {
    const [step, setStep] = useState(1); // 1: selfie, 2: new password
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [capturedSelfie, setCapturedSelfie] = useState(false);

    const handleCaptureSelfie = () => {
        // Simulate biometric capture
        setCapturedSelfie(true);
        setTimeout(() => {
            setStep(2);
        }, 1500);
    };

    const handleResetPassword = () => {
        if (newPassword.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        Alert.alert('Success', 'Your password has been reset successfully!', [
            { text: 'OK', onPress: () => router.replace('/(auth)/login') }
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backBtnText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Reset Password</Text>
                <View style={{ width: 40 }} />
            </View>

            {step === 1 ? (
                <View style={styles.content}>
                    <View style={styles.titleSection}>
                        <Text style={styles.mainTitle}>Biometric Verification</Text>
                        <Text style={styles.subtitle}>For security, we need to verify your identity before resetting your password.</Text>
                    </View>

                    {/* Camera Preview */}
                    <View style={styles.cameraContainer}>
                        {capturedSelfie ? (
                            <View style={styles.cameraPreview}>
                                <Text style={{ fontSize: 64 }}>✅</Text>
                                <Text style={styles.verifyingText}>Verifying face...</Text>
                            </View>
                        ) : (
                            <View style={styles.cameraPreview}>
                                <Text style={{ fontSize: 64 }}>📷</Text>
                                <Text style={styles.cameraHint}>Position your face in the frame</Text>
                            </View>
                        )}
                        <View style={styles.cameraOverlay} />
                    </View>

                    <View style={styles.instructions}>
                        <View style={styles.instructionItem}>
                            <Text style={styles.instructionIcon}>💡</Text>
                            <Text style={styles.instructionText}>Ensure good lighting</Text>
                        </View>
                        <View style={styles.instructionItem}>
                            <Text style={styles.instructionIcon}>👤</Text>
                            <Text style={styles.instructionText}>Look directly at the camera</Text>
                        </View>
                        <View style={styles.instructionItem}>
                            <Text style={styles.instructionIcon}>🚫</Text>
                            <Text style={styles.instructionText}>Remove glasses or hats</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.captureBtn} onPress={handleCaptureSelfie} disabled={capturedSelfie}>
                        <Text style={styles.captureBtnText}>{capturedSelfie ? 'Verifying...' : 'Capture Selfie'}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.content}>
                    <View style={styles.titleSection}>
                        <View style={styles.successIcon}>
                            <Text style={{ fontSize: 32 }}>✅</Text>
                        </View>
                        <Text style={styles.mainTitle}>Identity Verified!</Text>
                        <Text style={styles.subtitle}>Create a new password for your account.</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>New Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Minimum 8 characters"
                                placeholderTextColor="#92a4c9"
                                secureTextEntry
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Re-enter your password"
                                placeholderTextColor="#92a4c9"
                                secureTextEntry
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.submitBtn} onPress={handleResetPassword}>
                        <Text style={styles.submitBtnText}>Reset Password</Text>
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
    content: { flex: 1, padding: Spacing.lg },
    titleSection: { alignItems: 'center', marginBottom: Spacing.xl },
    mainTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 14, color: '#92a4c9', textAlign: 'center', lineHeight: 20 },
    successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(16, 185, 129, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
    cameraContainer: { aspectRatio: 1, width: '100%', borderRadius: 24, overflow: 'hidden', backgroundColor: '#1e2430', marginBottom: Spacing.lg, position: 'relative' },
    cameraPreview: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    cameraHint: { color: '#92a4c9', marginTop: Spacing.md, fontSize: 14 },
    verifyingText: { color: Colors.success, marginTop: Spacing.md, fontSize: 16, fontWeight: 'bold' },
    cameraOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 3, borderColor: Colors.primary, borderRadius: 24, opacity: 0.5 },
    instructions: { marginBottom: Spacing.lg },
    instructionItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    instructionIcon: { fontSize: 18, marginRight: 12 },
    instructionText: { color: '#92a4c9', fontSize: 14 },
    captureBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    captureBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    form: { marginBottom: Spacing.lg },
    inputGroup: { marginBottom: Spacing.md },
    label: { fontSize: 14, fontWeight: '600', color: 'white', marginBottom: 8 },
    input: { backgroundColor: '#1e2430', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: 'white', fontSize: 16, borderWidth: 1, borderColor: '#324467' },
    submitBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    submitBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
