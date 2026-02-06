/**
 * Translation Store
 * Global state for real-time translation
 */
import { create } from 'zustand';
import { liveTranslationService, speechService, translationService } from '../services';
import type { SupportedLanguage, TranslationMessage, TranslationSession } from '../types';

interface TranslationState {
    // Session
    session: TranslationSession | null;
    isSessionActive: boolean;
    connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

    // Messages
    messages: TranslationMessage[];

    // User settings
    myLanguage: SupportedLanguage;
    partnerLanguage: SupportedLanguage;
    autoSpeak: boolean;
    autoListen: boolean;

    // UI state
    isRecording: boolean;
    isSpeaking: boolean;
    isTranslating: boolean;
    partnerIsTyping: boolean;

    // Actions
    startSession: (config: {
        sessionId: string;
        userId: string;
        userName: string;
        userType: 'guide' | 'tourist';
        myLanguage: SupportedLanguage;
        partnerLanguage: SupportedLanguage;
    }) => Promise<boolean>;
    endSession: () => Promise<void>;
    sendMessage: (text: string) => Promise<TranslationMessage | null>;
    startRecording: () => Promise<boolean>;
    stopRecording: () => Promise<TranslationMessage | null>;
    speakMessage: (message: TranslationMessage) => Promise<void>;
    stopSpeaking: () => Promise<void>;
    setLanguages: (my: SupportedLanguage, partner: SupportedLanguage) => void;
    setAutoSpeak: (enabled: boolean) => void;
    translateText: (text: string) => Promise<string>;
    clearMessages: () => void;
}

export const useTranslationStore = create<TranslationState>((set, get) => ({
    // Initial state
    session: null,
    isSessionActive: false,
    connectionState: 'disconnected',
    messages: [],
    myLanguage: 'es',
    partnerLanguage: 'en',
    autoSpeak: true,
    autoListen: false,
    isRecording: false,
    isSpeaking: false,
    isTranslating: false,
    partnerIsTyping: false,

    // Start translation session
    startSession: async (config) => {
        set({ connectionState: 'connecting' });

        const success = await liveTranslationService.startSession({
            ...config,
            autoSpeak: get().autoSpeak,
            onMessage: (message) => {
                set(state => ({
                    messages: [...state.messages, message],
                }));

                // Auto-speak if enabled and message is for us
                if (get().autoSpeak && message.toLang === get().myLanguage) {
                    speechService.speak(message.translatedText, message.toLang);
                }
            },
            onPartnerTyping: (isTyping) => {
                set({ partnerIsTyping: isTyping });
            },
            onConnectionChange: (state) => {
                // Map reconnecting to connecting for UI display
                const uiState = state === 'reconnecting' ? 'connecting' : state;
                set({
                    connectionState: uiState,
                    isSessionActive: state === 'connected',
                });
            },
            onError: (error) => {
                console.error('Translation error:', error);
            },
        });

        if (success) {
            set({
                isSessionActive: true,
                connectionState: 'connected',
                myLanguage: config.myLanguage,
                partnerLanguage: config.partnerLanguage,
            });
        } else {
            set({ connectionState: 'disconnected' });
        }

        return success;
    },

    // End session
    endSession: async () => {
        await liveTranslationService.endSession();
        set({
            session: null,
            isSessionActive: false,
            connectionState: 'disconnected',
            messages: [],
            isRecording: false,
            isSpeaking: false,
        });
    },

    // Send text message
    sendMessage: async (text) => {
        if (!get().isSessionActive) return null;

        set({ isTranslating: true });
        const message = await liveTranslationService.sendMessage(text);
        set({ isTranslating: false });

        if (message) {
            set(state => ({
                messages: [...state.messages, message],
            }));
        }

        return message;
    },

    // Start voice recording
    startRecording: async () => {
        const success = await liveTranslationService.startVoiceRecording();
        if (success) {
            set({ isRecording: true });
        }
        return success;
    },

    // Stop recording and send
    stopRecording: async () => {
        set({ isRecording: false, isTranslating: true });
        const message = await liveTranslationService.sendVoiceMessage();
        set({ isTranslating: false });

        if (message) {
            set(state => ({
                messages: [...state.messages, message],
            }));
        }

        return message;
    },

    // Speak a message
    speakMessage: async (message) => {
        set({ isSpeaking: true });
        await liveTranslationService.speakMessage(message);
        set({ isSpeaking: false });
    },

    // Stop speaking
    stopSpeaking: async () => {
        await liveTranslationService.stopSpeaking();
        set({ isSpeaking: false });
    },

    // Set languages
    setLanguages: (my, partner) => {
        set({ myLanguage: my, partnerLanguage: partner });
    },

    // Set auto-speak
    setAutoSpeak: (enabled) => {
        set({ autoSpeak: enabled });
    },

    // Quick translate (without session)
    translateText: async (text) => {
        const { myLanguage, partnerLanguage } = get();
        const result = await translationService.translate(text, myLanguage, partnerLanguage);
        return result.translatedText;
    },

    // Clear messages
    clearMessages: () => {
        set({ messages: [] });
    },
}));
