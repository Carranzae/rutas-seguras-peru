// Ruta Segura Perú - Safety Onboarding Screen
import { Colors, Spacing } from '@/src/constants/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SafetyOnboarding() {
    const [step, setStep] = useState(0);

    const steps = [
        { emoji: '🛡️', title: 'Safety First', description: 'Your safety is our priority. Ruta Segura Peru provides real-time monitoring and emergency response to keep you protected.' },
        { emoji: '📍', title: 'Live Tracking', description: 'Share your location with family and friends. They can follow your journey in real-time on any device.' },
        { emoji: '🆘', title: 'SOS Button', description: 'In an emergency, press the SOS button. We\'ll alert local authorities and your emergency contacts immediately.' },
        { emoji: '🛰️', title: 'Satellite Coverage', description: 'No signal? No problem. Our satellite connection ensures you can always send an emergency alert, even in remote areas.' },
        { emoji: '🌐', title: 'AI Translator', description: 'Communicate with your guide in any language. Our AI-powered translator breaks down language barriers instantly.' },
    ];

    const currentStep = steps[step];
    const isLast = step === steps.length - 1;

    const nextStep = () => {
        if (isLast) {
            router.replace('/(tourist)/(tabs)/explore');
        } else {
            setStep(step + 1);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.replace('/(tourist)/(tabs)/explore')}><Text style={styles.skipText}>Skip</Text></TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.emojiContainer}><Text style={styles.emoji}>{currentStep.emoji}</Text></View>
                <Text style={styles.title}>{currentStep.title}</Text>
                <Text style={styles.description}>{currentStep.description}</Text>
            </View>

            <View style={styles.footer}>
                <View style={styles.dots}>
                    {steps.map((_, i) => (<View key={i} style={[styles.dot, i === step && styles.dotActive]} />))}
                </View>
                <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
                    <Text style={styles.nextButtonText}>{isLast ? 'Get Started' : 'Next'}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    header: { flexDirection: 'row', justifyContent: 'flex-end', padding: Spacing.md },
    skipText: { fontSize: 14, color: Colors.textSecondary },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
    emojiContainer: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(17, 82, 212, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
    emoji: { fontSize: 72 },
    title: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.md, textAlign: 'center' },
    description: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
    footer: { padding: Spacing.xl },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: Spacing.lg },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.borderLight },
    dotActive: { width: 24, backgroundColor: Colors.primary },
    nextButton: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    nextButtonText: { fontSize: 18, fontWeight: 'bold', color: 'white' },
});
