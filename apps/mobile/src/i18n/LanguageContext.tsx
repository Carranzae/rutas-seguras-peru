/**
 * Ruta Segura Perú - Language Context Provider
 * Manages app-wide language selection with AsyncStorage persistence
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import {
    getTranslation,
    LanguageInfo,
    SUPPORTED_LANGUAGES,
    SupportedLanguage,
    Translations
} from './translations';

interface LanguageContextType {
    language: SupportedLanguage;
    translations: Translations;
    setLanguage: (lang: SupportedLanguage) => Promise<void>;
    isLoading: boolean;
    languages: LanguageInfo[];
    t: Translations; // Shorthand for translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = '@ruta_segura_language';

interface LanguageProviderProps {
    children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
    const [language, setLanguageState] = useState<SupportedLanguage>('en');
    const [isLoading, setIsLoading] = useState(true);

    // Load saved language on mount
    useEffect(() => {
        loadSavedLanguage();
    }, []);

    const loadSavedLanguage = async () => {
        try {
            const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLang && isValidLanguage(savedLang)) {
                setLanguageState(savedLang as SupportedLanguage);
            }
        } catch (error) {
            console.error('Error loading language:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const isValidLanguage = (lang: string): boolean => {
        return SUPPORTED_LANGUAGES.some(l => l.code === lang);
    };

    const setLanguage = async (lang: SupportedLanguage) => {
        try {
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
            setLanguageState(lang);
        } catch (error) {
            console.error('Error saving language:', error);
        }
    };

    const translations = getTranslation(language);

    const value: LanguageContextType = {
        language,
        translations,
        setLanguage,
        isLoading,
        languages: SUPPORTED_LANGUAGES,
        t: translations, // Shorthand
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

// Hook to use language context
export function useLanguage(): LanguageContextType {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

// Hook for just translations (shorthand)
export function useTranslations(): Translations {
    const { translations } = useLanguage();
    return translations;
}

export { SUPPORTED_LANGUAGES, SupportedLanguage, Translations };

