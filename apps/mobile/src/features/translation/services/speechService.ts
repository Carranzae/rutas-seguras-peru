/**
 * Speech Service
 * Real-time speech recognition and text-to-speech
 */
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import type { SpeechRecognitionResult, SupportedLanguage } from '../types';

class SpeechService {
    private recording: Audio.Recording | null = null;
    private isRecording = false;
    private audioBuffer: string[] = [];

    /**
     * Initialize audio permissions and settings
     */
    async initialize(): Promise<boolean> {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Audio permission not granted');
                return false;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                shouldDuckAndroid: true,
            });

            return true;
        } catch (error) {
            console.error('Failed to initialize speech service:', error);
            return false;
        }
    }

    /**
     * Start recording audio for speech recognition
     */
    async startRecording(): Promise<boolean> {
        if (this.isRecording) {
            console.warn('Already recording');
            return false;
        }

        try {
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            this.recording = recording;
            this.isRecording = true;
            console.log('Recording started');
            return true;
        } catch (error) {
            console.error('Failed to start recording:', error);
            return false;
        }
    }

    /**
     * Stop recording and get the audio URI
     */
    async stopRecording(): Promise<string | null> {
        if (!this.recording || !this.isRecording) {
            return null;
        }

        try {
            await this.recording.stopAndUnloadAsync();
            const uri = this.recording.getURI();
            this.recording = null;
            this.isRecording = false;
            console.log('Recording stopped:', uri);
            return uri;
        } catch (error) {
            console.error('Failed to stop recording:', error);
            this.isRecording = false;
            return null;
        }
    }

    /**
     * Transcribe audio to text using backend API
     * In production, this would send audio to Google Speech-to-Text / Whisper API
     */
    async transcribe(
        audioUri: string,
        language: SupportedLanguage
    ): Promise<SpeechRecognitionResult> {
        // TODO: Implement actual STT API call
        // For now, return mock result
        console.log('Transcribing audio:', audioUri, 'language:', language);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock transcription (in production, call backend /ai/speech-to-text)
        return {
            text: '¡Bienvenidos a Machu Picchu!',
            confidence: 0.95,
            language,
            isFinal: true,
        };
    }

    /**
     * Speak text using TTS
     */
    async speak(
        text: string,
        language: SupportedLanguage,
        options?: {
            rate?: number;
            pitch?: number;
            volume?: number;
            onDone?: () => void;
            onError?: (error: Error) => void;
        }
    ): Promise<void> {
        const languageMap: Record<SupportedLanguage, string> = {
            es: 'es-PE',
            en: 'en-US',
            fr: 'fr-FR',
            de: 'de-DE',
            pt: 'pt-BR',
            it: 'it-IT',
            zh: 'zh-CN',
            ja: 'ja-JP',
            ko: 'ko-KR',
            ru: 'ru-RU',
        };

        Speech.speak(text, {
            language: languageMap[language] || language,
            rate: options?.rate ?? 0.9,
            pitch: options?.pitch ?? 1.0,
            volume: options?.volume ?? 1.0,
            onDone: options?.onDone,
            onError: options?.onError,
        });
    }

    /**
     * Stop any ongoing speech
     */
    async stopSpeaking(): Promise<void> {
        await Speech.stop();
    }

    /**
     * Check if currently speaking
     */
    async isSpeaking(): Promise<boolean> {
        return await Speech.isSpeakingAsync();
    }

    /**
     * Get available voices for a language
     */
    async getVoices(): Promise<Speech.Voice[]> {
        return await Speech.getAvailableVoicesAsync();
    }

    /**
     * Clean up resources
     */
    async cleanup(): Promise<void> {
        if (this.isRecording && this.recording) {
            await this.recording.stopAndUnloadAsync();
            this.recording = null;
            this.isRecording = false;
        }
        await Speech.stop();
    }
}

export const speechService = new SpeechService();
