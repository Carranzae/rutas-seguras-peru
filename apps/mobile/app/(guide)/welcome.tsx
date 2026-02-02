// Ruta Segura Perú - Welcome Guide App Screen
import { Colors, Shadows, Spacing } from '@/src/constants/theme';
import { router } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WelcomeGuide() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logo}>🎯</Text>
                    <View style={styles.flagBadge}><Text style={styles.flag}>🇵🇪</Text></View>
                </View>

                <Text style={styles.title}>Welcome, Guide!</Text>
                <Text style={styles.subtitle}>Join the Ruta Segura network and provide safe, memorable experiences for tourists in Peru.</Text>

                <View style={styles.features}>
                    <View style={styles.featureItem}><Text style={styles.featureIcon}>🌐</Text><Text style={styles.featureText}>AI Voice Translator</Text></View>
                    <View style={styles.featureItem}><Text style={styles.featureIcon}>📍</Text><Text style={styles.featureText}>Real-time Tracking</Text></View>
                    <View style={styles.featureItem}><Text style={styles.featureIcon}>🆘</Text><Text style={styles.featureText}>Emergency Response</Text></View>
                    <View style={styles.featureItem}><Text style={styles.featureIcon}>💰</Text><Text style={styles.featureText}>Secure Payments</Text></View>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.registerButton} onPress={() => router.push('/(guide)/verification/selfie')}>
                    <Text style={styles.registerButtonText}>Get Started</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/(guide)/(tabs)/dashboard')}>
                    <Text style={styles.loginButtonText}>I already have an account</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
    logoContainer: { position: 'relative', marginBottom: Spacing.xl },
    logo: { fontSize: 80 },
    flagBadge: { position: 'absolute', bottom: -8, right: -8, width: 36, height: 36, borderRadius: 18, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', ...Shadows.md },
    flag: { fontSize: 20 },
    title: { fontSize: 32, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.sm },
    subtitle: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.xl },
    features: { width: '100%', gap: Spacing.sm },
    featureItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: 12 },
    featureIcon: { fontSize: 24 },
    featureText: { fontSize: 16, color: Colors.textPrimary, fontWeight: '500' },
    footer: { padding: Spacing.xl, gap: Spacing.sm },
    registerButton: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    registerButtonText: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    loginButton: { paddingVertical: 16, alignItems: 'center' },
    loginButtonText: { fontSize: 14, color: Colors.primary },
});
