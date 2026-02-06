/**
 * Translation Service
 * Real-time text translation with low latency
 */
import { httpClient } from '@/src/core/api';
import type { SupportedLanguage, TranslationResult } from '../types';

// Common phrase cache for ultra-fast translations
const PHRASE_CACHE = new Map<string, string>();

// Pre-cache common tourism phrases
const COMMON_PHRASES: Record<string, Record<SupportedLanguage, string>> = {
    'Bienvenidos': { es: 'Bienvenidos', en: 'Welcome', fr: 'Bienvenue', de: 'Willkommen', pt: 'Bem-vindos', it: 'Benvenuti', zh: '欢迎', ja: 'ようこそ', ko: '환영합니다', ru: 'Добро пожаловать' },
    'Síganme': { es: 'Síganme', en: 'Follow me', fr: 'Suivez-moi', de: 'Folgen Sie mir', pt: 'Sigam-me', it: 'Seguitemi', zh: '跟我来', ja: 'ついてきてください', ko: '저를 따라오세요', ru: 'Следуйте за мной' },
    'Cuidado': { es: 'Cuidado', en: 'Be careful', fr: 'Attention', de: 'Vorsicht', pt: 'Cuidado', it: 'Attenzione', zh: '小心', ja: '気をつけて', ko: '조심하세요', ru: 'Осторожно' },
    'A la derecha': { es: 'A la derecha', en: 'To the right', fr: 'À droite', de: 'Rechts', pt: 'À direita', it: 'A destra', zh: '向右', ja: '右へ', ko: '오른쪽으로', ru: 'Направо' },
    'A la izquierda': { es: 'A la izquierda', en: 'To the left', fr: 'À gauche', de: 'Links', pt: 'À esquerda', it: 'A sinistra', zh: '向左', ja: '左へ', ko: '왼쪽으로', ru: 'Налево' },
    '¿Tienen preguntas?': { es: '¿Tienen preguntas?', en: 'Any questions?', fr: 'Des questions?', de: 'Fragen?', pt: 'Perguntas?', it: 'Domande?', zh: '有问题吗？', ja: '質問はありますか？', ko: '질문 있으세요?', ru: 'Есть вопросы?' },
    'Tiempo libre': { es: 'Tiempo libre', en: 'Free time', fr: 'Temps libre', de: 'Freizeit', pt: 'Tempo livre', it: 'Tempo libero', zh: '自由时间', ja: '自由時間', ko: '자유 시간', ru: 'Свободное время' },
    'Punto de encuentro': { es: 'Punto de encuentro', en: 'Meeting point', fr: 'Point de rencontre', de: 'Treffpunkt', pt: 'Ponto de encontro', it: 'Punto di incontro', zh: '集合点', ja: '集合場所', ko: '집합 장소', ru: 'Место сбора' },
    'Emergencia': { es: 'Emergencia', en: 'Emergency', fr: 'Urgence', de: 'Notfall', pt: 'Emergência', it: 'Emergenza', zh: '紧急情况', ja: '緊急事態', ko: '긴급 상황', ru: 'Чрезвычайная ситуация' },
    'Baño': { es: 'Baño', en: 'Bathroom', fr: 'Toilettes', de: 'Toilette', pt: 'Banheiro', it: 'Bagno', zh: '洗手间', ja: 'トイレ', ko: '화장실', ru: 'Туалет' },
};

class TranslationService {
    private pendingTranslations = new Map<string, Promise<TranslationResult>>();

    constructor() {
        this.initializeCache();
    }

    /**
     * Initialize phrase cache for instant translations
     */
    private initializeCache(): void {
        Object.entries(COMMON_PHRASES).forEach(([phrase, translations]) => {
            Object.entries(translations).forEach(([sourceLang, sourceText]) => {
                Object.entries(translations).forEach(([targetLang, targetText]) => {
                    if (sourceLang !== targetLang) {
                        const key = `${sourceText}:${sourceLang}:${targetLang}`;
                        PHRASE_CACHE.set(key, targetText);
                    }
                });
            });
        });
        console.log(`Translation cache initialized with ${PHRASE_CACHE.size} phrases`);
    }

    /**
     * Translate text with ultra-low latency
     * Uses cache for common phrases, API for complex text
     */
    async translate(
        text: string,
        sourceLang: SupportedLanguage,
        targetLang: SupportedLanguage
    ): Promise<TranslationResult> {
        if (sourceLang === targetLang) {
            return {
                originalText: text,
                translatedText: text,
                sourceLang,
                targetLang,
                confidence: 1.0,
                processingTimeMs: 0,
            };
        }

        const startTime = Date.now();

        // Check cache first (instant translation)
        const cacheKey = `${text}:${sourceLang}:${targetLang}`;
        const cachedTranslation = PHRASE_CACHE.get(cacheKey);
        if (cachedTranslation) {
            return {
                originalText: text,
                translatedText: cachedTranslation,
                sourceLang,
                targetLang,
                confidence: 1.0,
                processingTimeMs: Date.now() - startTime,
            };
        }

        // Check for partial matches in common phrases
        const partialMatch = this.findPartialMatch(text, sourceLang, targetLang);
        if (partialMatch) {
            return {
                originalText: text,
                translatedText: partialMatch,
                sourceLang,
                targetLang,
                confidence: 0.85,
                processingTimeMs: Date.now() - startTime,
            };
        }

        // Call backend API for complex translations
        return this.translateViaAPI(text, sourceLang, targetLang, startTime);
    }

    /**
     * Find partial matches in common phrases
     */
    private findPartialMatch(
        text: string,
        sourceLang: SupportedLanguage,
        targetLang: SupportedLanguage
    ): string | null {
        const normalizedText = text.toLowerCase().trim();

        for (const [phrase, translations] of Object.entries(COMMON_PHRASES)) {
            const sourcePhrase = translations[sourceLang]?.toLowerCase();
            if (sourcePhrase && normalizedText.includes(sourcePhrase)) {
                const targetPhrase = translations[targetLang];
                if (targetPhrase) {
                    // Replace the matched phrase
                    const regex = new RegExp(sourcePhrase, 'gi');
                    return text.replace(regex, targetPhrase);
                }
            }
        }

        return null;
    }

    /**
     * Call backend translation API
     */
    private async translateViaAPI(
        text: string,
        sourceLang: SupportedLanguage,
        targetLang: SupportedLanguage,
        startTime: number
    ): Promise<TranslationResult> {
        // Deduplicate concurrent requests for same text
        const requestKey = `${text}:${sourceLang}:${targetLang}`;

        const existingRequest = this.pendingTranslations.get(requestKey);
        if (existingRequest) {
            return existingRequest;
        }

        const translationPromise = (async () => {
            try {
                const response = await httpClient.post<{
                    translated_text: string;
                    confidence?: number;
                }>('/ai/translate', {
                    text,
                    source_language: sourceLang,
                    target_language: targetLang,
                });

                if (response.ok && response.data?.translated_text) {
                    // Cache successful translations
                    PHRASE_CACHE.set(requestKey, response.data.translated_text);

                    return {
                        originalText: text,
                        translatedText: response.data.translated_text,
                        sourceLang,
                        targetLang,
                        confidence: response.data.confidence ?? 0.9,
                        processingTimeMs: Date.now() - startTime,
                    };
                }

                // Fallback: return original with language prefix
                return {
                    originalText: text,
                    translatedText: `[${targetLang.toUpperCase()}] ${text}`,
                    sourceLang,
                    targetLang,
                    confidence: 0.5,
                    processingTimeMs: Date.now() - startTime,
                };
            } finally {
                this.pendingTranslations.delete(requestKey);
            }
        })();

        this.pendingTranslations.set(requestKey, translationPromise);
        return translationPromise;
    }

    /**
     * Batch translate multiple texts
     */
    async translateBatch(
        texts: string[],
        sourceLang: SupportedLanguage,
        targetLang: SupportedLanguage
    ): Promise<TranslationResult[]> {
        return Promise.all(
            texts.map(text => this.translate(text, sourceLang, targetLang))
        );
    }

    /**
     * Get supported languages
     */
    getSupportedLanguages(): SupportedLanguage[] {
        return ['es', 'en', 'fr', 'de', 'pt', 'it', 'zh', 'ja', 'ko', 'ru'];
    }

    /**
     * Add custom phrase to cache
     */
    addToCache(
        phrase: string,
        sourceLang: SupportedLanguage,
        translation: string,
        targetLang: SupportedLanguage
    ): void {
        const key = `${phrase}:${sourceLang}:${targetLang}`;
        PHRASE_CACHE.set(key, translation);
    }

    /**
     * Clear phrase cache
     */
    clearCache(): void {
        PHRASE_CACHE.clear();
        this.initializeCache();
    }
}

export const translationService = new TranslationService();
