/**
 * Ruta Segura Perú - Real-Time Voice Translator
 * AI-powered speech-to-speech translation for guide-tourist communication
 */
import { api } from '@/src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useState } from 'react';
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

interface Language {
    code: string;
    name: string;
    flag: string;
}

const LANGUAGES: Language[] = [
    { code: 'es', name: 'Español', flag: '🇵🇪' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

interface TranslationEntry {
    id: string;
    original: string;
    translated: string;
    fromLang: string;
    toLang: string;
    timestamp: Date;
}

export default function TranslatorScreen() {
    const [sourceLang, setSourceLang] = useState<Language>(LANGUAGES[0]); // Spanish
    const [targetLang, setTargetLang] = useState<Language>(LANGUAGES[1]); // English
    const [inputText, setInputText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [history, setHistory] = useState<TranslationEntry[]>([]);
    const [showLangPicker, setShowLangPicker] = useState<'source' | 'target' | null>(null);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);

    // Request audio permissions
    useEffect(() => {
        (async () => {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });
        })();

        return () => {
            Speech.stop();
        };
    }, []);

    // Swap languages
    const swapLanguages = () => {
        const temp = sourceLang;
        setSourceLang(targetLang);
        setTargetLang(temp);
        setInputText(translatedText);
        setTranslatedText(inputText);
    };

    // Start recording voice
    const startRecording = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso requerido', 'Necesitamos acceso al micrófono.');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(newRecording);
            setIsRecording(true);
        } catch (err) {
            console.error('Failed to start recording:', err);
            Alert.alert('Error', 'No se pudo iniciar la grabación.');
        }
    };

    // Stop recording and process
    const stopRecording = async () => {
        if (!recording) return;

        setIsRecording(false);
        await recording.stopAndUnloadAsync();

        const uri = recording.getURI();
        setRecording(null);

        if (uri) {
            // In production, send audio to speech-to-text API
            // For now, simulate with placeholder
            setIsTranslating(true);

            try {
                // Simulate speech-to-text processing
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Mock recognized text (in production, use Google/Whisper API)
                const recognizedText = '¡Bienvenidos a Machu Picchu! Esta es una de las siete maravillas del mundo.';
                setInputText(recognizedText);

                // Translate
                await translateText(recognizedText);
            } catch (error) {
                console.error('Speech processing error:', error);
            }
        }
    };

    // Translate text
    const translateText = useCallback(async (text?: string) => {
        const textToTranslate = text || inputText;
        if (!textToTranslate.trim()) return;

        setIsTranslating(true);

        try {
            // Call backend translation API
            const response = await api.post('/ai/translate', {
                text: textToTranslate,
                source_language: sourceLang.code,
                target_language: targetLang.code,
            });

            if (response.ok && response.data?.translated_text) {
                setTranslatedText(response.data.translated_text);

                // Add to history
                const entry: TranslationEntry = {
                    id: Date.now().toString(),
                    original: textToTranslate,
                    translated: response.data.translated_text,
                    fromLang: sourceLang.code,
                    toLang: targetLang.code,
                    timestamp: new Date(),
                };
                setHistory(prev => [entry, ...prev.slice(0, 19)]);
            } else {
                // Fallback mock translation for demo
                const mockTranslations: Record<string, string> = {
                    'Hola': 'Hello',
                    'Bienvenidos': 'Welcome',
                    '¡Bienvenidos a Machu Picchu!': 'Welcome to Machu Picchu!',
                };

                let translated = textToTranslate;
                Object.entries(mockTranslations).forEach(([es, en]) => {
                    if (sourceLang.code === 'es' && targetLang.code === 'en') {
                        translated = translated.replace(es, en);
                    }
                });

                // Generic fallback
                if (translated === textToTranslate) {
                    translated = `[${targetLang.code.toUpperCase()}] ${textToTranslate}`;
                }

                setTranslatedText(translated);

                const entry: TranslationEntry = {
                    id: Date.now().toString(),
                    original: textToTranslate,
                    translated: translated,
                    fromLang: sourceLang.code,
                    toLang: targetLang.code,
                    timestamp: new Date(),
                };
                setHistory(prev => [entry, ...prev.slice(0, 19)]);
            }
        } catch (error) {
            console.error('Translation error:', error);
            // Use basic fallback
            setTranslatedText(`[Traducción] ${textToTranslate}`);
        } finally {
            setIsTranslating(false);
        }
    }, [inputText, sourceLang, targetLang]);

    // Speak translated text
    const speakTranslation = () => {
        if (!translatedText) return;

        setIsSpeaking(true);
        Speech.speak(translatedText, {
            language: targetLang.code,
            rate: 0.9,
            onDone: () => setIsSpeaking(false),
            onError: () => setIsSpeaking(false),
        });
    };

    // Stop speaking
    const stopSpeaking = () => {
        Speech.stop();
        setIsSpeaking(false);
    };

    // Render language picker modal
    const renderLanguagePicker = () => {
        if (!showLangPicker) return null;

        return (
            <View style={styles.langPickerOverlay}>
                <View style={styles.langPickerModal}>
                    <Text style={styles.langPickerTitle}>
                        Seleccionar {showLangPicker === 'source' ? 'idioma origen' : 'idioma destino'}
                    </Text>
                    <ScrollView style={styles.langList}>
                        {LANGUAGES.map((lang) => (
                            <TouchableOpacity
                                key={lang.code}
                                style={styles.langItem}
                                onPress={() => {
                                    if (showLangPicker === 'source') {
                                        setSourceLang(lang);
                                    } else {
                                        setTargetLang(lang);
                                    }
                                    setShowLangPicker(null);
                                }}
                            >
                                <Text style={styles.langFlag}>{lang.flag}</Text>
                                <Text style={styles.langName}>{lang.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity
                        style={styles.langPickerClose}
                        onPress={() => setShowLangPicker(null)}
                    >
                        <Text style={styles.langPickerCloseText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🌐 Traductor en Tiempo Real</Text>
                <Text style={styles.subtitle}>Habla o escribe para traducir</Text>
            </View>

            {/* Language Selector */}
            <View style={styles.langSelector}>
                <TouchableOpacity
                    style={styles.langButton}
                    onPress={() => setShowLangPicker('source')}
                >
                    <Text style={styles.langButtonFlag}>{sourceLang.flag}</Text>
                    <Text style={styles.langButtonText}>{sourceLang.name}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.swapButton} onPress={swapLanguages}>
                    <Ionicons name="swap-horizontal" size={24} color="#6366f1" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.langButton}
                    onPress={() => setShowLangPicker('target')}
                >
                    <Text style={styles.langButtonFlag}>{targetLang.flag}</Text>
                    <Text style={styles.langButtonText}>{targetLang.name}</Text>
                </TouchableOpacity>
            </View>

            {/* Input Section */}
            <View style={styles.inputSection}>
                <View style={styles.inputHeader}>
                    <Text style={styles.inputLabel}>{sourceLang.flag} {sourceLang.name}</Text>
                    {inputText && (
                        <TouchableOpacity onPress={() => setInputText('')}>
                            <Ionicons name="close-circle" size={20} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
                <TextInput
                    style={styles.inputText}
                    placeholder="Escribe o habla aquí..."
                    placeholderTextColor="#999"
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.translateButton, isTranslating && styles.disabledButton]}
                    onPress={() => translateText()}
                    disabled={isTranslating || !inputText.trim()}
                >
                    {isTranslating ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.translateButtonText}>Traducir</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Output Section */}
            <View style={styles.outputSection}>
                <View style={styles.outputHeader}>
                    <Text style={styles.outputLabel}>{targetLang.flag} {targetLang.name}</Text>
                    {translatedText && (
                        <TouchableOpacity
                            style={styles.speakButton}
                            onPress={isSpeaking ? stopSpeaking : speakTranslation}
                        >
                            <Ionicons
                                name={isSpeaking ? 'stop-circle' : 'volume-high'}
                                size={24}
                                color={isSpeaking ? '#ef4444' : '#6366f1'}
                            />
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.outputText}>
                    {translatedText || 'La traducción aparecerá aquí...'}
                </Text>
            </View>

            {/* Voice Recording Button */}
            <View style={styles.voiceSection}>
                <TouchableOpacity
                    style={[
                        styles.voiceButton,
                        isRecording && styles.voiceButtonRecording,
                    ]}
                    onPressIn={startRecording}
                    onPressOut={stopRecording}
                >
                    <Ionicons
                        name={isRecording ? 'mic' : 'mic-outline'}
                        size={36}
                        color={isRecording ? '#fff' : '#6366f1'}
                    />
                </TouchableOpacity>
                <Text style={styles.voiceHint}>
                    {isRecording ? '🎙️ Grabando... Suelta para traducir' : 'Mantén presionado para hablar'}
                </Text>
            </View>

            {/* Quick Phrases */}
            <View style={styles.quickPhrases}>
                <Text style={styles.quickPhrasesTitle}>Frases Rápidas</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {[
                        '¡Bienvenidos!',
                        '¿Tienen preguntas?',
                        'Síganme por favor',
                        'Tiempo libre: 30 min',
                        'Punto de encuentro',
                    ].map((phrase, i) => (
                        <TouchableOpacity
                            key={i}
                            style={styles.quickPhraseChip}
                            onPress={() => {
                                setInputText(phrase);
                                translateText(phrase);
                            }}
                        >
                            <Text style={styles.quickPhraseText}>{phrase}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {renderLanguagePicker()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { padding: 20, alignItems: 'center' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
    subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },

    langSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, gap: 12 },
    langButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, gap: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    langButtonFlag: { fontSize: 24 },
    langButtonText: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
    swapButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },

    inputSection: { margin: 20, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    inputHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#64748b' },
    inputText: { fontSize: 16, color: '#1e293b', minHeight: 80, textAlignVertical: 'top' },
    translateButton: { backgroundColor: '#6366f1', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 },
    disabledButton: { opacity: 0.6 },
    translateButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

    outputSection: { marginHorizontal: 20, backgroundColor: '#eef2ff', borderRadius: 16, padding: 16 },
    outputHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    outputLabel: { fontSize: 14, fontWeight: '600', color: '#6366f1' },
    speakButton: { padding: 4 },
    outputText: { fontSize: 18, color: '#1e293b', lineHeight: 26 },

    voiceSection: { alignItems: 'center', marginVertical: 20 },
    voiceButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#6366f1' },
    voiceButtonRecording: { backgroundColor: '#ef4444', borderColor: '#ef4444', transform: [{ scale: 1.1 }] },
    voiceHint: { marginTop: 12, fontSize: 13, color: '#64748b' },

    quickPhrases: { paddingHorizontal: 20 },
    quickPhrasesTitle: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 12 },
    quickPhraseChip: { backgroundColor: '#e0e7ff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
    quickPhraseText: { fontSize: 13, color: '#4f46e5', fontWeight: '500' },

    langPickerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    langPickerModal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '60%' },
    langPickerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', marginBottom: 16 },
    langList: { maxHeight: 300 },
    langItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 12 },
    langFlag: { fontSize: 28 },
    langName: { fontSize: 16, color: '#1e293b' },
    langPickerClose: { marginTop: 12, padding: 14, backgroundColor: '#f1f5f9', borderRadius: 12, alignItems: 'center' },
    langPickerCloseText: { fontSize: 16, color: '#64748b', fontWeight: '600' },
});
