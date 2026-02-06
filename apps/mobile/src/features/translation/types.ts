/**
 * Translation Feature Types
 * Real-time voice translation system
 */

export type SupportedLanguage = 'es' | 'en' | 'fr' | 'de' | 'pt' | 'it' | 'zh' | 'ja' | 'ko' | 'ru';

export interface LanguageConfig {
    code: SupportedLanguage;
    name: string;
    flag: string;
    voiceId?: string; // For TTS
    speechRate?: number;
}

export interface TranslationMessage {
    id: string;
    text: string;
    translatedText: string;
    fromLang: SupportedLanguage;
    toLang: SupportedLanguage;
    speakerId: string;
    speakerName: string;
    speakerType: 'guide' | 'tourist';
    timestamp: Date;
    audioUrl?: string;
}

export interface TranslationSession {
    id: string;
    tourId?: string;
    guideId: string;
    guideLang: SupportedLanguage;
    touristLang: SupportedLanguage;
    participants: TranslationParticipant[];
    isActive: boolean;
    createdAt: Date;
}

export interface TranslationParticipant {
    id: string;
    name: string;
    type: 'guide' | 'tourist';
    preferredLang: SupportedLanguage;
    isConnected: boolean;
    isSpeaking: boolean;
}

export interface SpeechRecognitionResult {
    text: string;
    confidence: number;
    language: SupportedLanguage;
    isFinal: boolean;
}

export interface TranslationRequest {
    text: string;
    sourceLang: SupportedLanguage;
    targetLang: SupportedLanguage;
    speakOutput?: boolean;
}

export interface TranslationResult {
    originalText: string;
    translatedText: string;
    sourceLang: SupportedLanguage;
    targetLang: SupportedLanguage;
    confidence: number;
    processingTimeMs: number;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
    { code: 'es', name: 'Español', flag: '🇵🇪', voiceId: 'es-PE', speechRate: 0.9 },
    { code: 'en', name: 'English', flag: '🇺🇸', voiceId: 'en-US', speechRate: 1.0 },
    { code: 'fr', name: 'Français', flag: '🇫🇷', voiceId: 'fr-FR', speechRate: 0.95 },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪', voiceId: 'de-DE', speechRate: 0.95 },
    { code: 'pt', name: 'Português', flag: '🇧🇷', voiceId: 'pt-BR', speechRate: 0.95 },
    { code: 'it', name: 'Italiano', flag: '🇮🇹', voiceId: 'it-IT', speechRate: 0.95 },
    { code: 'zh', name: '中文', flag: '🇨🇳', voiceId: 'zh-CN', speechRate: 0.85 },
    { code: 'ja', name: '日本語', flag: '🇯🇵', voiceId: 'ja-JP', speechRate: 0.9 },
    { code: 'ko', name: '한국어', flag: '🇰🇷', voiceId: 'ko-KR', speechRate: 0.9 },
    { code: 'ru', name: 'Русский', flag: '🇷🇺', voiceId: 'ru-RU', speechRate: 0.95 },
];
