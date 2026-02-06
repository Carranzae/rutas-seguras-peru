/**
 * Ruta Segura Perú - Tourist Live Translation Screen
 * Real-time bidirectional voice translation with guide
 */
import { Colors, Shadows, Spacing } from '@/src/constants/theme';
import { SUPPORTED_LANGUAGES, useTranslationStore, type SupportedLanguage } from '@/src/features/translation';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TouristLiveTranslatorScreen() {
    const { session_id, guide_name, guide_lang = 'es' } = useLocalSearchParams<{
        session_id: string;
        guide_name: string;
        guide_lang: SupportedLanguage;
    }>();

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
        setLanguages,
        setAutoSpeak,
    } = useTranslationStore();

    const [inputText, setInputText] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Initialize session
    useEffect(() => {
        if (session_id) {
            setLanguages('en', guide_lang as SupportedLanguage);

            startSession({
                sessionId: session_id,
                userId: 'tourist_' + Date.now(),
                userName: 'Turista',
                userType: 'tourist',
                myLanguage: 'en',
                partnerLanguage: guide_lang as SupportedLanguage,
            });
        }

        return () => {
            endSession();
        };
    }, [session_id]);

    // Pulse animation for recording
    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isRecording]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [messages.length]);

    const handleSend = async () => {
        if (!inputText.trim()) return;
        await sendMessage(inputText);
        setInputText('');
    };

    const handleVoicePress = async () => {
        if (isRecording) {
            await stopRecording();
        } else {
            await startRecording();
        }
    };

    const getMyLangConfig = () => SUPPORTED_LANGUAGES.find(l => l.code === myLanguage) || SUPPORTED_LANGUAGES[1];
    const getPartnerLangConfig = () => SUPPORTED_LANGUAGES.find(l => l.code === partnerLanguage) || SUPPORTED_LANGUAGES[0];

    const renderMessage = ({ item }: { item: typeof messages[0] }) => {
        const isMyMessage = item.speakerType === 'tourist';

        return (
            <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.partnerMessage]}>
                <View style={styles.messageSender}>
                    <Text style={[styles.senderName, !isMyMessage && { color: Colors.textSecondary }]}>
                        {isMyMessage ? 'Tú' : item.speakerName || 'Guía'}
                    </Text>
                    <Text style={[styles.messageTime, !isMyMessage && { color: Colors.textSecondary }]}>
                        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>

                <Text style={[styles.originalText, isMyMessage && styles.originalTextMy]}>
                    {isMyMessage ? item.text : item.translatedText}
                </Text>

                <Text style={[styles.translatedText, isMyMessage && styles.translatedTextMy]}>
                    {isMyMessage ? item.translatedText : item.text}
                </Text>

                <TouchableOpacity style={styles.playButton} onPress={() => speakMessage(item)}>
                    <Ionicons name={isSpeaking ? 'stop-circle' : 'volume-high'} size={20} color={isMyMessage ? '#fff' : Colors.primary} />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>
                        {guide_name || 'Guía'} {getPartnerLangConfig().flag}
                    </Text>
                    <View style={styles.connectionBadge}>
                        <View style={[styles.connectionDot, { backgroundColor: connectionState === 'connected' ? Colors.success : Colors.warning }]} />
                        <Text style={styles.connectionText}>{connectionState === 'connected' ? 'En vivo' : 'Conectando...'}</Text>
                    </View>
                </View>

                <TouchableOpacity onPress={() => setShowSettings(!showSettings)} style={styles.settingsButton}>
                    <Ionicons name="settings-outline" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Language indicator */}
            <View style={styles.languageBar}>
                <View style={styles.langIndicator}>
                    <Text style={styles.langFlag}>{getMyLangConfig().flag}</Text>
                    <Text style={styles.langText}>Tú ({getMyLangConfig().name})</Text>
                </View>
                <Ionicons name="swap-horizontal" size={20} color={Colors.textSecondary} />
                <View style={styles.langIndicator}>
                    <Text style={styles.langFlag}>{getPartnerLangConfig().flag}</Text>
                    <Text style={styles.langText}>Guía ({getPartnerLangConfig().name})</Text>
                </View>
            </View>

            {/* Settings panel */}
            {showSettings && (
                <View style={styles.settingsPanel}>
                    <TouchableOpacity style={styles.settingRow} onPress={() => setAutoSpeak(!autoSpeak)}>
                        <Text style={styles.settingLabel}>🔊 Reproducir automáticamente</Text>
                        <Ionicons name={autoSpeak ? 'toggle' : 'toggle-outline'} size={28} color={autoSpeak ? Colors.success : Colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Messages list */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                style={styles.messagesList}
                contentContainerStyle={styles.messagesContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>🌐</Text>
                        <Text style={styles.emptyTitle}>Traducción en Tiempo Real</Text>
                        <Text style={styles.emptySubtitle}>
                            Habla o escribe en {getMyLangConfig().name} y tu guía lo escuchará en {getPartnerLangConfig().name}
                        </Text>
                    </View>
                }
            />

            {/* Typing indicator */}
            {partnerIsTyping && (
                <View style={styles.typingIndicator}>
                    <Text style={styles.typingText}>El guía está escribiendo...</Text>
                </View>
            )}

            {/* Input area */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
                <View style={styles.inputArea}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <TouchableOpacity style={[styles.voiceButton, isRecording && styles.voiceButtonActive]} onPress={handleVoicePress} disabled={isTranslating}>
                            {isTranslating ? <ActivityIndicator color="#fff" /> : <Ionicons name={isRecording ? 'mic' : 'mic-outline'} size={28} color="#fff" />}
                        </TouchableOpacity>
                    </Animated.View>

                    <TextInput
                        style={styles.textInput}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder={`Escribe en ${getMyLangConfig().name}...`}
                        placeholderTextColor={Colors.textSecondary}
                        multiline
                        maxLength={500}
                    />

                    <TouchableOpacity style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} onPress={handleSend} disabled={!inputText.trim() || isTranslating}>
                        <Ionicons name="send" size={20} color={inputText.trim() ? '#fff' : Colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {isRecording && (
                    <View style={styles.recordingHint}>
                        <Text style={styles.recordingText}>🎙️ Grabando... Toca el micrófono para enviar</Text>
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.surfaceLight, ...Shadows.sm },
    backButton: { padding: 8 },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
    connectionBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    connectionDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
    connectionText: { fontSize: 12, color: Colors.textSecondary },
    settingsButton: { padding: 8 },
    languageBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.sm, backgroundColor: 'rgba(99, 102, 241, 0.1)', gap: Spacing.md },
    langIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    langFlag: { fontSize: 20 },
    langText: { fontSize: 12, color: Colors.textSecondary },
    settingsPanel: { backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    settingLabel: { fontSize: 14, color: Colors.textPrimary },
    messagesList: { flex: 1 },
    messagesContent: { padding: Spacing.md, paddingBottom: 100 },
    messageContainer: { maxWidth: '80%', marginBottom: Spacing.md, padding: Spacing.md, borderRadius: 16, ...Shadows.sm },
    myMessage: { alignSelf: 'flex-end', backgroundColor: Colors.primary },
    partnerMessage: { alignSelf: 'flex-start', backgroundColor: Colors.surfaceLight },
    messageSender: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    senderName: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
    messageTime: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
    originalText: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
    originalTextMy: { color: 'rgba(255,255,255,0.7)' },
    translatedText: { fontSize: 16, color: Colors.textPrimary, fontWeight: '500' },
    translatedTextMy: { color: '#fff' },
    playButton: { position: 'absolute', right: 8, bottom: 8, padding: 4 },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyEmoji: { fontSize: 64, marginBottom: Spacing.md },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.lg },
    typingIndicator: { paddingHorizontal: Spacing.md, paddingVertical: 8, backgroundColor: 'rgba(99, 102, 241, 0.1)' },
    typingText: { fontSize: 12, color: Colors.primary, fontStyle: 'italic' },
    inputArea: { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.sm, backgroundColor: Colors.surfaceLight, borderTopWidth: 1, borderTopColor: Colors.borderLight, gap: Spacing.sm },
    voiceButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    voiceButtonActive: { backgroundColor: '#ef4444' },
    textInput: { flex: 1, minHeight: 44, maxHeight: 100, backgroundColor: Colors.backgroundLight, borderRadius: 22, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: 15, color: Colors.textPrimary },
    sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    sendButtonDisabled: { backgroundColor: Colors.borderLight },
    recordingHint: { backgroundColor: '#ef4444', paddingVertical: Spacing.sm, alignItems: 'center' },
    recordingText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
