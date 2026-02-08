/**
 * Ruta Segura Perú - Tourist Safety Screen
 * Emergency features, trusted contacts, safety tips - with full i18n
 */
import { SOSButton } from '@/src/components/common';
import { BorderRadius, Colors, Shadows, Spacing } from '@/src/constants/theme';
import { useLanguage } from '@/src/i18n';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { emergencyServiceCompat as emergencyService } from '../../../src/services/emergency';
import { liveTrackingService } from '../../../src/services/liveTracking';

interface EmergencyContact {
    name: string;
    number: string;
    description: string;
    icon: string;
}

const PERU_EMERGENCY_CONTACTS: EmergencyContact[] = [
    { name: 'Police', number: '105', description: 'Policía Nacional del Perú', icon: '🚔' },
    { name: 'Ambulance', number: '106', description: 'SAMU - Medical Emergency', icon: '🚑' },
    { name: 'Fire', number: '116', description: 'Bomberos del Perú', icon: '🚒' },
    { name: 'Tourist Police', number: '0800-22221', description: 'Tourist Support', icon: '🛡️' },
];

export default function SafetyScreen() {
    const { t } = useLanguage();
    const [isSharing, setIsSharing] = useState(false);

    const handleSOS = async () => {
        try {
            // Trigger SOS - service will get location internally
            const emergency = await emergencyService.triggerSOS({
                description: 'SOS activated by tourist',
                severity: 'high',
            });

            // Navigate to active emergency screen
            router.push({
                pathname: '/(tourist)/emergency-active',
                params: { emergencyId: emergency?.id || '' },
            });
        } catch (error) {
            console.error('SOS error:', error);
            Alert.alert(t.common.error, t.safety.sosError);
        }
    };

    const handleCall = (number: string) => {
        Linking.openURL(`tel:${number}`);
    };

    const handleShareLocation = async () => {
        setIsSharing(true);
        try {
            await liveTrackingService.startTracking({
                userName: 'Turista',
                userType: 'tourist',
                intervalMs: 10000,
            });
            Alert.alert(
                `📍 ${t.safety.locationShared}`,
                t.safety.locationSharedMessage
            );
        } catch (error) {
            setIsSharing(false);
            Alert.alert(t.common.error, t.safety.locationError);
        }
    };

    const safetyTips = [
        { icon: '📱', text: t.safety.tipPhone },
        { icon: '💰', text: t.safety.tipValuables },
        { icon: '🚕', text: t.safety.tipTaxi },
        { icon: '🗺️', text: t.safety.tipItinerary },
        { icon: '🌙', text: t.safety.tipNight },
        { icon: '💧', text: t.safety.tipWater },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{t.safety.title}</Text>
                    <Text style={styles.subtitle}>{t.safety.subtitle}</Text>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={[styles.quickAction, styles.shareAction]}
                        onPress={handleShareLocation}
                    >
                        <Ionicons
                            name={isSharing ? 'location' : 'location-outline'}
                            size={28}
                            color={isSharing ? '#10b981' : '#6366f1'}
                        />
                        <Text style={styles.quickActionText}>{t.safety.shareLocation}</Text>
                        {isSharing && <View style={styles.liveBadge}><Text style={styles.liveText}>LIVE</Text></View>}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickAction}
                        onPress={() => router.push('/(tourist)/trust-circle')}
                    >
                        <Ionicons name="people-outline" size={28} color="#f59e0b" />
                        <Text style={styles.quickActionText}>{t.safety.trustedContacts}</Text>
                    </TouchableOpacity>
                </View>

                {/* Emergency Numbers */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t.safety.emergencyNumbers}</Text>
                    <View style={styles.contactsList}>
                        {PERU_EMERGENCY_CONTACTS.map((contact, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.contactCard}
                                onPress={() => handleCall(contact.number)}
                            >
                                <View style={styles.contactIcon}>
                                    <Text style={styles.contactEmoji}>{contact.icon}</Text>
                                </View>
                                <View style={styles.contactInfo}>
                                    <Text style={styles.contactName}>{contact.name}</Text>
                                    <Text style={styles.contactDesc}>{contact.description}</Text>
                                </View>
                                <View style={styles.contactAction}>
                                    <Text style={styles.contactNumber}>{contact.number}</Text>
                                    <Ionicons name="call" size={20} color="#10b981" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Safety Tips */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t.safety.safetyTips}</Text>
                    <View style={styles.tipsGrid}>
                        {safetyTips.map((tip, index) => (
                            <View key={index} style={styles.tipCard}>
                                <Text style={styles.tipIcon}>{tip.icon}</Text>
                                <Text style={styles.tipText}>{tip.text}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Your Guide Info (if on tour) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t.safety.yourGuide}</Text>
                    <View style={styles.guideCard}>
                        <View style={styles.guideAvatar}>
                            <Text style={styles.guideAvatarText}>C</Text>
                            <View style={styles.verifiedBadge}>
                                <Ionicons name="checkmark" size={10} color="#fff" />
                            </View>
                        </View>
                        <View style={styles.guideInfo}>
                            <Text style={styles.guideName}>Carlos Quispe</Text>
                            <Text style={styles.guideStatus}>✅ {t.safety.verifiedGuide}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.callGuideButton}
                            onPress={() => Linking.openURL('tel:+51987654321')}
                        >
                            <Ionicons name="call" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 160 }} />
            </ScrollView>

            {/* SOS Button */}
            <SOSButton onActivate={handleSOS} text={t.safety.slideSOS} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },

    header: { padding: Spacing.md },
    title: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary },
    subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },

    quickActions: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: 12 },
    quickAction: { flex: 1, backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: BorderRadius.xl, alignItems: 'center', ...Shadows.sm },
    shareAction: {},
    quickActionText: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600', marginTop: 8, textAlign: 'center' },
    liveBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#10b981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    liveText: { fontSize: 8, color: '#fff', fontWeight: 'bold' },

    section: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 12 },

    contactsList: { gap: 12 },
    contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: BorderRadius.lg, ...Shadows.sm },
    contactIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.1)', alignItems: 'center', justifyContent: 'center' },
    contactEmoji: { fontSize: 24 },
    contactInfo: { flex: 1, marginLeft: 12 },
    contactName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
    contactDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    contactAction: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    contactNumber: { fontSize: 18, fontWeight: 'bold', color: '#10b981' },

    tipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    tipCard: { width: '48%', backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: BorderRadius.lg, flexDirection: 'row', alignItems: 'center', gap: 10, ...Shadows.sm },
    tipIcon: { fontSize: 24 },
    tipText: { fontSize: 13, color: Colors.textPrimary, flex: 1 },

    guideCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: BorderRadius.xl, ...Shadows.sm },
    guideAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    guideAvatarText: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
    verifiedBadge: { position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
    guideInfo: { flex: 1, marginLeft: 12 },
    guideName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
    guideStatus: { fontSize: 12, color: '#10b981', marginTop: 2 },
    callGuideButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
});
