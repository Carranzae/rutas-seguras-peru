/**
 * Ruta Segura Perú - Guide Real-Time Translator
 * AI-powered bidirectional voice translation for tour guides
 */
import { Colors, Shadows, Spacing } from '@/src/constants/theme';
import { httpClient } from '@/src/core/api';
import {
    SUPPORTED_LANGUAGES,
    useTranslationStore,
    type TranslationMessage
} from '@/src/features/translation';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GuideTranslatorScreen() {
    // Store state
    const {
        messages,
        isSessionActive,
        connectionState,
        isRecording,
        isSpeaking,
        isTranslating,
        partnerIsTyping,
        myLanguage,
        partnerLanguage,
        autoSpeak,
        startSession,
        endSession,
        sendMessage,
        startRecording,
        stopRecording,
        speakMessage,
        stopSpeaking,
        setLanguages,
        setAutoSpeak,
        translateText,
    } = useTranslationStore();

    // Local state
    const [inputText, setInputText] = useState('');
    const [showLangPicker, setShowLangPicker] = useState<'source' | 'target' | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [quickTranslation, setQuickTranslation] = useState('');
    const flatListRef = useRef<FlatList>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Quick phrases for guides
    const QUICK_PHRASES = [
        '¡Bienvenidos!',
        '¿Tienen preguntas?',
        'Síganme por favor',
        'Tiempo libre: 30 min',
        'Punto de encuentro',
        'Cuidado con el escalón',
        'Tomen fotos aquí',
        'Baños a la derecha',
    ];

    // Initialize
    useEffect(() => {
        setLanguages('es', 'en'); // Guide speaks Spanish, tourists English
    }, []);

    // Pulse animation for recording
    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.3, duration: 400, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isRecording]);

    // Auto-scroll messages
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [messages.length]);

    // Create translation session
    const handleStartSession = async () => {
        try {
            const response = await httpClient.post<{ session_id: string }>('/ai/translation-session', {
                guide_id: 'current_guide',
                guide_language: myLanguage,
                tourist_language: partnerLanguage,
            });

            if (response.ok && response.data?.session_id) {
                setSessionId(response.data.session_id);
                await startSession({
                    sessionId: response.data.session_id,
                    userId: 'guide_' + Date.now(),
                    userName: 'Guía',
                    userType: 'guide',
                    myLanguage,
                    partnerLanguage,
                });
            }
        } catch (error) {
            console.error('Failed to create session:', error);
        }
    };

    // End session
    const handleEndSession = async () => {
        if (sessionId) {
            try {
                await httpClient.delete(`/ai/translation-session/${sessionId}`);
            } catch (error) {
                console.error('Error ending session:', error);
            }
        }
        await endSession();
        setSessionId(null);
    };

    // Send text message
    const handleSend = async () => {
        if (!inputText.trim()) return;
        await sendMessage(inputText);
        setInputText('');
    };

    // Voice press handler
    const handleVoicePress = async () => {
        if (isRecording) {
            await stopRecording();
        } else {
            await startRecording();
        }
    };

    // Quick phrase handler
    const handleQuickPhrase = async (phrase: string) => {
        const translated = await translateText(phrase);
        setQuickTranslation(translated);

        // Auto-speak translated phrase
        Speech.speak(translated, {
            language: partnerLanguage,
            rate: 0.9,
        });

        // Also send to session if active
        if (isSessionActive) {
            await sendMessage(phrase);
        }
    };

    // Swap languages
    const swapLanguages = () => {
        setLanguages(partnerLanguage, myLanguage);
    };

    // Get language config
    const getMyLangConfig = () => SUPPORTED_LANGUAGES.find(l => l.code === myLanguage) || SUPPORTED_LANGUAGES[0];
    const getPartnerLangConfig = () => SUPPORTED_LANGUAGES.find(l => l.code === partnerLanguage) || SUPPORTED_LANGUAGES[1];

    // Render message
    const renderMessage = ({ item }: { item: TranslationMessage }) => {
        const isMyMessage = item.speakerType === 'guide';

        return (
            <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.partnerMessage]}>
                <View style={styles.messageSender}>
                    <Text style={[styles.senderName, !isMyMessage && { color: Colors.textSecondary }]}>
                        {isMyMessage ? 'Tú' : item.speakerName || 'Turista'}
                    </Text>
                </View>
                <Text style={[styles.originalText, isMyMessage && styles.originalTextMy]}>
                    {item.text}
                </Text>
                <Text style={[styles.translatedText, isMyMessage && styles.translatedTextMy]}>
                    {item.translatedText}
                </Text>
                <TouchableOpacity style={styles.playButton} onPress={() => speakMessage(item)}>
                    <Ionicons name="volume-high" size={18} color={isMyMessage ? '#fff' : Colors.primary} />
                </TouchableOpacity>
            </View>
        );
    };

    // Language picker modal
    const renderLanguagePicker = () => {
        if (!showLangPicker) return null;

        return (
            <View style={styles.langPickerOverlay}>
                <View style={styles.langPickerModal}>
                    <Text style={styles.langPickerTitle}>
                        {showLangPicker === 'source' ? 'Mi Idioma' : 'Idioma Turistas'}
                    </Text>
                    <ScrollView>
                        {SUPPORTED_LANGUAGES.map((lang) => (
                            <TouchableOpacity
                                key={lang.code}
                                style={styles.langItem}
                                onPress={() => {
                                    if (showLangPicker === 'source') {
                                        setLanguages(lang.code, partnerLanguage);
                                    } else {
                                        setLanguages(myLanguage, lang.code);
                                    }
                                    setShowLangPicker(null);
                                }}
                            >
                                <Text style={styles.langFlag}>{lang.flag}</Text>
                                <Text style={styles.langName}>{lang.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={styles.langPickerClose} onPress={() => setShowLangPicker(null)}>
                        <Text style={styles.langPickerCloseText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>🌐 Traductor en Vivo</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={[styles.sessionButton, isSessionActive && styles.sessionButtonActive]}
                        onPress={isSessionActive ? handleEndSession : handleStartSession}
                    >
                        <Ionicons
                            name={isSessionActive ? 'stop-circle' : 'radio'}
                            size={20}
                            color={isSessionActive ? '#fff' : Colors.primary}
                        />
                        <Text style={[styles.sessionButtonText, isSessionActive && { color: '#fff' }]}>
                            {isSessionActive ? 'Terminar' : 'Iniciar'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Language Selector */}
            <View style={styles.langSelector}>
                <TouchableOpacity style={styles.langButton} onPress={() => setShowLangPicker('source')}>
                    <Text style={styles.langButtonFlag}>{getMyLangConfig().flag}</Text>
                    <Text style={styles.langButtonText}>{getMyLangConfig().name}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.swapButton} onPress={swapLanguages}>
                    <Ionicons name="swap-horizontal" size={24} color={Colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.langButton} onPress={() => setShowLangPicker('target')}>
                    <Text style={styles.langButtonFlag}>{getPartnerLangConfig().flag}</Text>
                    <Text style={styles.langButtonText}>{getPartnerLangConfig().name}</Text>
                </TouchableOpacity>
            </View>

            {/* Quick Translation Result */}
            {quickTranslation && (
                <View style={styles.quickResult}>
                    <Text style={styles.quickResultText}>{quickTranslation}</Text>
                    <TouchableOpacity onPress={() => Speech.speak(quickTranslation, { language: partnerLanguage })}>
                        <Ionicons name="volume-high" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Quick Phrases */}
            <View style={styles.quickPhrases}>
                <Text style={styles.quickPhrasesTitle}>Frases Rápidas</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {QUICK_PHRASES.map((phrase, i) => (
                        <TouchableOpacity
                            key={i}
                            style={styles.quickPhraseChip}
                            onPress={() => handleQuickPhrase(phrase)}
                        >
                            <Text style={styles.quickPhraseText}>{phrase}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Session Messages */}
            {isSessionActive && (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    style={styles.messagesList}
                    contentContainerStyle={styles.messagesContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="chatbubbles-outline" size={48} color={Colors.textSecondary} />
                            <Text style={styles.emptyText}>Sesión activa. Esperando mensajes...</Text>
                        </View>
                    }
                />
            )}

            {/* Input Area */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={styles.inputArea}>
                    {/* Big Voice Button */}
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <TouchableOpacity
                            style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
                            onPress={handleVoicePress}
                            disabled={isTranslating}
                        >
                            {isTranslating ? (
                                <ActivityIndicator color="#fff" size="large" />
                            ) : (
                                <Ionicons
                                    name={isRecording ? 'mic' : 'mic-outline'}
                                    size={36}
                                    color="#fff"
                                />
                            )}
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Text Input */}
                    <View style={styles.textInputContainer}>
                        <TextInput
                            style={styles.textInput}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Escribe para traducir..."
                            placeholderTextColor={Colors.textSecondary}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                            onPress={handleSend}
                            disabled={!inputText.trim()}
                        >
                            <Ionicons name="send" size={20} color={inputText.trim() ? '#fff' : Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {isRecording && (
                    <View style={styles.recordingHint}>
                        <Text style={styles.recordingText}>🎙️ Grabando... Toca para traducir</Text>
                    </View>
                )}
            </KeyboardAvoidingView>

            {renderLanguagePicker()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
    title: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary },
    headerRight: { flexDirection: 'row', gap: Spacing.sm },
    sessionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(99, 102, 241, 0.1)' },
    sessionButtonActive: { backgroundColor: Colors.success },
    sessionButtonText: { fontSize: 14, fontWeight: '600', color: Colors.primary },

    langSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.md, gap: Spacing.sm },
    langButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, gap: 8, ...Shadows.sm },
    langButtonFlag: { fontSize: 24 },
    langButtonText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    swapButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },

    quickResult: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', margin: Spacing.md, padding: Spacing.md, backgroundColor: '#eef2ff', borderRadius: 12 },
    quickResultText: { flex: 1, fontSize: 18, color: Colors.primary, fontWeight: '500' },

    quickPhrases: { paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
    quickPhrasesTitle: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
    quickPhraseChip: { backgroundColor: '#e0e7ff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8 },
    quickPhraseText: { fontSize: 14, color: '#4f46e5', fontWeight: '500' },

    messagesList: { flex: 1 },
    messagesContent: { padding: Spacing.md },
    messageContainer: { maxWidth: '80%', marginBottom: Spacing.md, padding: Spacing.md, borderRadius: 16, ...Shadows.sm },
    myMessage: { alignSelf: 'flex-end', backgroundColor: Colors.primary },
    partnerMessage: { alignSelf: 'flex-start', backgroundColor: '#fff' },
    messageSender: { marginBottom: 4 },
    senderName: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
    originalText: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
    originalTextMy: { color: 'rgba(255,255,255,0.7)' },
    translatedText: { fontSize: 16, color: Colors.textPrimary, fontWeight: '500' },
    translatedTextMy: { color: '#fff' },
    playButton: { position: 'absolute', right: 8, bottom: 8 },

    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { marginTop: 12, fontSize: 14, color: Colors.textSecondary },

    inputArea: { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.md, gap: Spacing.md, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.borderLight },
    voiceButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadows.md },
    voiceButtonActive: { backgroundColor: '#ef4444', transform: [{ scale: 1.05 }] },
    textInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#f1f5f9', borderRadius: 24, paddingHorizontal: Spacing.sm },
    textInput: { flex: 1, minHeight: 44, paddingHorizontal: Spacing.sm, fontSize: 15, color: Colors.textPrimary },
    sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
    sendButtonDisabled: { backgroundColor: Colors.borderLight },

    recordingHint: { backgroundColor: '#ef4444', paddingVertical: Spacing.sm, alignItems: 'center' },
    recordingText: { color: '#fff', fontSize: 14, fontWeight: '600' },

    langPickerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    langPickerModal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '60%' },
    langPickerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, textAlign: 'center', marginBottom: 16 },
    langItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 12 },
    langFlag: { fontSize: 28 },
    langName: { fontSize: 16, color: Colors.textPrimary },
    langPickerClose: { marginTop: 12, padding: 14, backgroundColor: '#f1f5f9', borderRadius: 12, alignItems: 'center' },
    langPickerCloseText: { fontSize: 16, color: Colors.textSecondary, fontWeight: '600' },
});
