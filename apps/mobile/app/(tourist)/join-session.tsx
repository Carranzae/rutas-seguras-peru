/**
 * Ruta Segura Perú - Join Guide Session Screen
 * Allows tourists to join a guide's translation session via code or QR
 */
import { Colors, Spacing } from '@/src/constants/theme';
import { httpClient } from '@/src/core/api';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/src/features/translation';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SessionInfo {
    session_id: string;
    guide_name: string;
    guide_language: SupportedLanguage;
    tour_name?: string;
}

export default function JoinSessionScreen() {
    const [sessionCode, setSessionCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');
    const [showLanguagePicker, setShowLanguagePicker] = useState(false);

    // Validate and join session
    const handleJoinSession = async () => {
        const code = sessionCode.trim().toUpperCase();
        if (!code) {
            Alert.alert('Código requerido', 'Ingresa el código de sesión de tu guía');
            return;
        }

        setIsLoading(true);
        try {
            // Try to get session info from backend
            const response = await httpClient.get<SessionInfo>(`/ai/translation-session/${code}`);

            if (response.ok && response.data) {
                // Navigate to live translator with session info
                router.push({
                    pathname: '/(tourist)/live-translator',
                    params: {
                        session_id: response.data.session_id,
                        guide_name: response.data.guide_name,
                        guide_lang: response.data.guide_language,
                    },
                });
            } else {
                // If backend fails, try local session (demo mode)
                router.push({
                    pathname: '/(tourist)/live-translator',
                    params: {
                        session_id: code,
                        guide_name: 'Guía',
                        guide_lang: 'es',
                    },
                });
            }
        } catch (error) {
            // Demo mode - join with the code directly
            router.push({
                pathname: '/(tourist)/live-translator',
                params: {
                    session_id: code,
                    guide_name: 'Guía',
                    guide_lang: 'es',
                },
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Get language config
    const getCurrentLangConfig = () =>
        SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[1];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Conectar con Guía</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Hero */}
                <View style={styles.heroSection}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="language" size={64} color={Colors.primary} />
                        <View style={styles.syncBadge}>
                            <Ionicons name="sync" size={24} color="#fff" />
                        </View>
                    </View>
                    <Text style={styles.heroTitle}>Traducción en Tiempo Real</Text>
                    <Text style={styles.heroSubtitle}>
                        Únete a la sesión de tu guía para traducir{'\n'}conversaciones al instante
                    </Text>
                </View>

                {/* My Language Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Mi idioma</Text>
                    <TouchableOpacity
                        style={styles.languageSelector}
                        onPress={() => setShowLanguagePicker(!showLanguagePicker)}
                    >
                        <Text style={styles.langFlag}>{getCurrentLangConfig().flag}</Text>
                        <Text style={styles.langName}>{getCurrentLangConfig().name}</Text>
                        <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>

                    {showLanguagePicker && (
                        <View style={styles.languageList}>
                            {SUPPORTED_LANGUAGES.map(lang => (
                                <TouchableOpacity
                                    key={lang.code}
                                    style={[
                                        styles.languageOption,
                                        selectedLanguage === lang.code && styles.languageOptionSelected
                                    ]}
                                    onPress={() => {
                                        setSelectedLanguage(lang.code);
                                        setShowLanguagePicker(false);
                                    }}
                                >
                                    <Text style={styles.optionFlag}>{lang.flag}</Text>
                                    <Text style={styles.optionName}>{lang.name}</Text>
                                    {selectedLanguage === lang.code && (
                                        <Ionicons name="checkmark" size={20} color={Colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Session Code Input */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Código de Sesión</Text>
                    <View style={styles.codeInputContainer}>
                        <Ionicons name="key-outline" size={24} color={Colors.textSecondary} />
                        <TextInput
                            style={styles.codeInput}
                            value={sessionCode}
                            onChangeText={(text) => setSessionCode(text.toUpperCase())}
                            placeholder="Ej: ABC123"
                            placeholderTextColor={Colors.textSecondary}
                            autoCapitalize="characters"
                            maxLength={10}
                        />
                    </View>
                    <Text style={styles.codeHint}>
                        Pide el código a tu guía turístico
                    </Text>
                </View>

                {/* Join Button */}
                <TouchableOpacity
                    style={[styles.joinButton, (!sessionCode.trim() || isLoading) && styles.joinButtonDisabled]}
                    onPress={handleJoinSession}
                    disabled={!sessionCode.trim() || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="enter-outline" size={24} color="#fff" />
                            <Text style={styles.joinButtonText}>Unirse a Sesión</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Or divider */}
                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>o</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Standalone translator option */}
                <TouchableOpacity
                    style={styles.standaloneButton}
                    onPress={() => router.push('/(tourist)/translator')}
                >
                    <Ionicons name="chatbubbles-outline" size={24} color={Colors.primary} />
                    <View style={styles.standaloneText}>
                        <Text style={styles.standaloneTitle}>Usar Traductor Libre</Text>
                        <Text style={styles.standaloneSubtitle}>Traduce sin conectar a un guía</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>

                {/* Help section */}
                <View style={styles.helpBox}>
                    <Ionicons name="information-circle-outline" size={24} color={Colors.primary} />
                    <View style={styles.helpContent}>
                        <Text style={styles.helpTitle}>¿Cómo funciona?</Text>
                        <Text style={styles.helpText}>
                            1. Tu guía inicia una sesión de traducción{'\n'}
                            2. El guía te comparte el código{'\n'}
                            3. Ingresas el código aquí{'\n'}
                            4. ¡Hablen en su idioma y escuchen traducido!
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    content: { padding: Spacing.lg },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary },

    heroSection: { alignItems: 'center', marginBottom: Spacing.xl },
    iconContainer: { position: 'relative', marginBottom: Spacing.md },
    syncBadge: { position: 'absolute', right: -8, bottom: -4, backgroundColor: Colors.success, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.backgroundLight },
    heroTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 8 },
    heroSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

    section: { marginBottom: Spacing.lg },
    sectionLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },

    languageSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: 12, gap: 12 },
    langFlag: { fontSize: 28 },
    langName: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.textPrimary },

    languageList: { backgroundColor: Colors.surfaceLight, borderRadius: 12, marginTop: 8, overflow: 'hidden' },
    languageOption: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    languageOptionSelected: { backgroundColor: 'rgba(99, 102, 241, 0.1)' },
    optionFlag: { fontSize: 24 },
    optionName: { flex: 1, fontSize: 15, color: Colors.textPrimary },

    codeInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: 12, gap: 12 },
    codeInput: { flex: 1, fontSize: 20, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 4 },
    codeHint: { fontSize: 12, color: Colors.textSecondary, marginTop: 8, marginLeft: 4 },

    joinButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: 16, gap: 10, marginTop: Spacing.sm },
    joinButtonDisabled: { opacity: 0.5 },
    joinButtonText: { fontSize: 18, fontWeight: '700', color: '#fff' },

    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg },
    dividerLine: { flex: 1, height: 1, backgroundColor: Colors.borderLight },
    dividerText: { paddingHorizontal: Spacing.md, fontSize: 14, color: Colors.textSecondary },

    standaloneButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: 12, gap: 12 },
    standaloneText: { flex: 1 },
    standaloneTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
    standaloneSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

    helpBox: { flexDirection: 'row', backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: Spacing.md, borderRadius: 12, marginTop: Spacing.xl, gap: 12 },
    helpContent: { flex: 1 },
    helpTitle: { fontSize: 14, fontWeight: '600', color: Colors.primary, marginBottom: 8 },
    helpText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 22 },
});
