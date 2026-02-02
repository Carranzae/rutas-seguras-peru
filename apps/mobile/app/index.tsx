/**
 * Ruta Segura Perú - Welcome Screen with Language Selection
 * First screen for tourists to select their preferred language
 */
import { SUPPORTED_LANGUAGES, SupportedLanguage, useLanguage } from '@/src/i18n';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
    const { language, setLanguage, t, isLoading } = useLanguage();
    const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(language);
    const [showLanguageList, setShowLanguageList] = useState(false);
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();

        // Check if user has already selected language and logged in
        checkExistingSession();
    }, []);

    const checkExistingSession = async () => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            const userData = await AsyncStorage.getItem('user_data');
            if (token && userData) {
                // Already logged in, go to home
                router.replace('/(tourist)/(tabs)/explore');
            }
        } catch (error) {
            console.log('No existing session');
        }
    };

    const handleSelectLanguage = async (lang: SupportedLanguage) => {
        setSelectedLang(lang);
        await setLanguage(lang);
        setShowLanguageList(false);
    };

    const handleGetStarted = async () => {
        await setLanguage(selectedLang);
        router.push('/(auth)/register');
    };

    const handleLogin = async () => {
        await setLanguage(selectedLang);
        router.push('/(auth)/login');
    };

    const selectedLanguage = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang);

    if (isLoading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <Text style={styles.loadingText}>🇵🇪</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1a1a2e', '#16213e', '#0f3460']}
                style={styles.gradient}
            >
                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    {/* Logo/Header Section */}
                    <View style={styles.headerSection}>
                        <View style={styles.logoContainer}>
                            <Text style={styles.logoEmoji}>🛡️</Text>
                        </View>
                        <Text style={styles.appName}>Ruta Segura</Text>
                        <Text style={styles.appTagline}>PERÚ</Text>
                    </View>

                    {/* Welcome Message */}
                    <View style={styles.welcomeSection}>
                        <Text style={styles.welcomeTitle}>{t.welcome.title}</Text>
                        <Text style={styles.welcomeSubtitle}>{t.welcome.subtitle}</Text>
                    </View>

                    {/* Language Selector */}
                    <View style={styles.languageSection}>
                        <Text style={styles.languageLabel}>{t.welcome.selectLanguage}</Text>

                        <TouchableOpacity
                            style={styles.languageSelector}
                            onPress={() => setShowLanguageList(!showLanguageList)}
                        >
                            <Text style={styles.languageFlag}>{selectedLanguage?.flag}</Text>
                            <Text style={styles.languageName}>{selectedLanguage?.nativeName}</Text>
                            <Ionicons
                                name={showLanguageList ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color="#fff"
                            />
                        </TouchableOpacity>

                        {showLanguageList && (
                            <View style={styles.languageList}>
                                <FlatList
                                    data={SUPPORTED_LANGUAGES}
                                    keyExtractor={(item) => item.code}
                                    numColumns={2}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[
                                                styles.languageItem,
                                                selectedLang === item.code && styles.languageItemSelected,
                                            ]}
                                            onPress={() => handleSelectLanguage(item.code)}
                                        >
                                            <Text style={styles.languageItemFlag}>{item.flag}</Text>
                                            <Text style={styles.languageItemName}>{item.nativeName}</Text>
                                            {selectedLang === item.code && (
                                                <Ionicons name="checkmark-circle" size={16} color="#4ade80" />
                                            )}
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        )}

                        <Text style={styles.languageHint}>{t.welcome.languageHint}</Text>
                    </View>

                    {/* Features Preview */}
                    <View style={styles.featuresRow}>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>🏛️</Text>
                            <Text style={styles.featureText}>Tours</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>🛡️</Text>
                            <Text style={styles.featureText}>Safety</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>🌐</Text>
                            <Text style={styles.featureText}>Translate</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>👥</Text>
                            <Text style={styles.featureText}>Connect</Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.buttonSection}>
                        <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
                            <Text style={styles.primaryButtonText}>{t.welcome.getStarted}</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryButton} onPress={handleLogin}>
                            <Text style={styles.secondaryButtonText}>{t.auth.haveAccount} {t.auth.login}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' },
    loadingText: { fontSize: 64 },
    gradient: { flex: 1 },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },

    headerSection: { alignItems: 'center', marginBottom: 32 },
    logoContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    logoEmoji: { fontSize: 48 },
    appName: { fontSize: 36, fontWeight: 'bold', color: '#fff', letterSpacing: 2 },
    appTagline: { fontSize: 14, color: '#fbbf24', letterSpacing: 6, marginTop: 4 },

    welcomeSection: { alignItems: 'center', marginBottom: 32 },
    welcomeTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
    welcomeSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 8 },

    languageSection: { marginBottom: 24 },
    languageLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 12, textAlign: 'center' },
    languageSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, gap: 12 },
    languageFlag: { fontSize: 28 },
    languageName: { fontSize: 18, color: '#fff', fontWeight: '600', flex: 1 },

    languageList: { marginTop: 12, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 8, maxHeight: 200 },
    languageItem: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, margin: 4, gap: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
    languageItemSelected: { backgroundColor: 'rgba(74, 222, 128, 0.2)', borderWidth: 1, borderColor: '#4ade80' },
    languageItemFlag: { fontSize: 20 },
    languageItemName: { fontSize: 13, color: '#fff', flex: 1 },

    languageHint: { fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 12 },

    featuresRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 32 },
    featureItem: { alignItems: 'center' },
    featureIcon: { fontSize: 28, marginBottom: 4 },
    featureText: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

    buttonSection: { marginTop: 'auto', paddingBottom: 40 },
    primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f59e0b', paddingVertical: 18, borderRadius: 16, gap: 8, marginBottom: 16 },
    primaryButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    secondaryButton: { alignItems: 'center', paddingVertical: 14 },
    secondaryButtonText: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
});
