/**
 * Live Translation Service
 * Real-time bidirectional translation via WebSocket
 */
import { wsClient, type ConnectionState, type WSMessage } from '@/src/core/api';
import type { SupportedLanguage, TranslationMessage, TranslationSession } from '../types';
import { speechService } from './speechService';
import { translationService } from './translationService';

interface LiveTranslationConfig {
    sessionId: string;
    userId: string;
    userName: string;
    userType: 'guide' | 'tourist';
    myLanguage: SupportedLanguage;
    partnerLanguage: SupportedLanguage;
    autoSpeak?: boolean;
    onMessage?: (message: TranslationMessage) => void;
    onPartnerTyping?: (isTyping: boolean) => void;
    onConnectionChange?: (state: ConnectionState) => void;
    onError?: (error: Error) => void;
}

class LiveTranslationService {
    private config: LiveTranslationConfig | null = null;
    private isActive = false;
    private messageQueue: TranslationMessage[] = [];
    private typingTimeout: ReturnType<typeof setTimeout> | null = null;
    private unsubscribers: (() => void)[] = [];

    /**
     * Start a live translation session
     */
    async startSession(config: LiveTranslationConfig): Promise<boolean> {
        if (this.isActive) {
            console.warn('Translation session already active');
            return false;
        }

        this.config = config;
        this.isActive = true;

        // Initialize speech service
        await speechService.initialize();

        // Connect to WebSocket
        const connected = await wsClient.connect({
            userType: config.userType,
            userName: config.userName,
            tourId: config.sessionId,
            onOpen: () => {
                config.onConnectionChange?.('connected');
            },
            onClose: () => {
                config.onConnectionChange?.('disconnected');
            },
            onMessage: (message) => {
                this.handleIncomingMessage(message);
            },
        });

        if (!connected) {
            console.error('Failed to connect to WebSocket');
            this.isActive = false;
            return false;
        }

        // Send join message
        wsClient.send({
            type: 'MESSAGE',
            data: {
                action: 'join_translation',
                session_id: config.sessionId,
                user_id: config.userId,
                user_name: config.userName,
                user_type: config.userType,
                language: config.myLanguage,
            },
        });

        console.log('Live translation session started:', config.sessionId);
        return true;
    }

    /**
     * Handle incoming WebSocket messages
     */
    private handleIncomingMessage(message: WSMessage): void {
        if (!this.config) return;

        const data = message.data as Record<string, unknown> | undefined;
        if (!data) return;

        // Handle translation messages
        if (data.action === 'translation_message' || data.type === 'translation_message') {
            const translationMsg: TranslationMessage = {
                id: (data.id as string) || Date.now().toString(),
                text: data.original_text as string,
                translatedText: data.translated_text as string,
                fromLang: data.from_language as SupportedLanguage,
                toLang: data.to_language as SupportedLanguage,
                speakerId: data.speaker_id as string,
                speakerName: data.speaker_name as string,
                speakerType: data.speaker_type as 'guide' | 'tourist',
                timestamp: new Date(data.timestamp as string),
                audioUrl: data.audio_url as string | undefined,
            };

            // If message is for us, optionally speak it
            if (translationMsg.toLang === this.config.myLanguage && this.config.autoSpeak) {
                speechService.speak(translationMsg.translatedText, translationMsg.toLang);
            }

            this.config.onMessage?.(translationMsg);
        }

        // Handle typing indicator
        if (data.action === 'partner_typing') {
            this.config.onPartnerTyping?.(data.is_typing as boolean);
        }

        // Handle errors
        if (data.action === 'error') {
            const error = new Error((data.message as string) || 'Translation error');
            this.config.onError?.(error);
        }
    }

    /**
     * Send a message to be translated and broadcast
     */
    async sendMessage(text: string): Promise<TranslationMessage | null> {
        if (!this.config || !this.isActive) {
            console.warn('No active translation session');
            return null;
        }

        const { userId, userName, userType, myLanguage, partnerLanguage } = this.config;

        // Translate locally first for instant feedback
        const result = await translationService.translate(text, myLanguage, partnerLanguage);

        const message: TranslationMessage = {
            id: Date.now().toString(),
            text,
            translatedText: result.translatedText,
            fromLang: myLanguage,
            toLang: partnerLanguage,
            speakerId: userId,
            speakerName: userName,
            speakerType: userType,
            timestamp: new Date(),
        };

        // Send via WebSocket for real-time broadcast
        wsClient.send({
            type: 'MESSAGE',
            data: {
                action: 'send_translation',
                session_id: this.config.sessionId,
                original_text: text,
                translated_text: result.translatedText,
                from_language: myLanguage,
                to_language: partnerLanguage,
                speaker_id: userId,
                speaker_name: userName,
                speaker_type: userType,
            },
        });

        return message;
    }

    /**
     * Send voice message (record, transcribe, translate, broadcast)
     */
    async sendVoiceMessage(): Promise<TranslationMessage | null> {
        if (!this.config || !this.isActive) {
            return null;
        }

        // Stop recording and get audio
        const audioUri = await speechService.stopRecording();
        if (!audioUri) {
            return null;
        }

        // Transcribe speech to text
        const transcription = await speechService.transcribe(audioUri, this.config.myLanguage);
        if (!transcription.text) {
            return null;
        }

        // Send the transcribed text
        return this.sendMessage(transcription.text);
    }

    /**
     * Start recording voice for translation
     */
    async startVoiceRecording(): Promise<boolean> {
        return speechService.startRecording();
    }

    /**
     * Stop voice recording
     */
    async stopVoiceRecording(): Promise<string | null> {
        return speechService.stopRecording();
    }

    /**
     * Send typing indicator
     */
    sendTypingIndicator(isTyping: boolean): void {
        if (!this.config) return;

        // Debounce typing indicator
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        wsClient.send({
            type: 'MESSAGE',
            data: {
                action: 'typing_indicator',
                session_id: this.config.sessionId,
                user_id: this.config.userId,
                is_typing: isTyping,
            },
        });

        if (isTyping) {
            this.typingTimeout = setTimeout(() => {
                this.sendTypingIndicator(false);
            }, 2000);
        }
    }

    /**
     * Speak a message
     */
    async speakMessage(message: TranslationMessage): Promise<void> {
        await speechService.speak(message.translatedText, message.toLang);
    }

    /**
     * Stop speaking
     */
    async stopSpeaking(): Promise<void> {
        await speechService.stopSpeaking();
    }

    /**
     * End the translation session
     */
    async endSession(): Promise<void> {
        if (!this.isActive || !this.config) {
            return;
        }

        // Notify server
        wsClient.send({
            type: 'MESSAGE',
            data: {
                action: 'leave_translation',
                session_id: this.config.sessionId,
                user_id: this.config.userId,
            },
        });

        // Clean up
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
        await speechService.cleanup();
        wsClient.disconnect();

        this.isActive = false;
        this.config = null;
        this.messageQueue = [];

        console.log('Translation session ended');
    }

    /**
     * Check if session is active
     */
    isSessionActive(): boolean {
        return this.isActive;
    }

    /**
     * Get current session config
     */
    getSessionConfig(): LiveTranslationConfig | null {
        return this.config;
    }

    /**
     * Create a new translation session
     */
    async createSession(
        tourId: string,
        guideId: string,
        guideLang: SupportedLanguage,
        touristLang: SupportedLanguage
    ): Promise<TranslationSession | null> {
        const session: TranslationSession = {
            id: `session_${Date.now()}`,
            tourId,
            guideId,
            guideLang,
            touristLang,
            participants: [],
            isActive: true,
            createdAt: new Date(),
        };

        return session;
    }
}

export const liveTranslationService = new LiveTranslationService();
