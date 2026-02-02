/**
 * Ruta Segura Perú - Identity Verification Screen
 * Multi-step identity verification for guides and agencies
 */
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type VerificationStep = 'intro' | 'document' | 'selfie' | 'processing' | 'complete';

export default function VerifyIdentityScreen() {
    const router = useRouter();
    const [step, setStep] = useState<VerificationStep>('intro');
    const [documentImage, setDocumentImage] = useState<string | null>(null);
    const [selfieImage, setSelfieImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const pickDocument = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para verificar tu identidad.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: [16, 10],
        });

        if (!result.canceled && result.assets[0]) {
            setDocumentImage(result.assets[0].uri);
            setStep('selfie');
        }
    };

    const takeSelfie = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para verificar tu identidad.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: [1, 1],
            cameraType: ImagePicker.CameraType.front,
        });

        if (!result.canceled && result.assets[0]) {
            setSelfieImage(result.assets[0].uri);
            processVerification();
        }
    };

    const processVerification = async () => {
        setStep('processing');
        setIsProcessing(true);

        // Simulate verification process
        try {
            // TODO: Send images to backend for verification
            await new Promise(resolve => setTimeout(resolve, 3000));
            setStep('complete');
        } catch (error) {
            Alert.alert('Error', 'Error al verificar la identidad. Por favor intenta de nuevo.');
            setStep('intro');
        } finally {
            setIsProcessing(false);
        }
    };

    const renderIntro = () => (
        <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
                <Ionicons name="shield-checkmark-outline" size={64} color="#1152d4" />
            </View>
            <Text style={styles.title}>Verificación de Identidad</Text>
            <Text style={styles.subtitle}>
                Para tu seguridad y la de los turistas, necesitamos verificar tu identidad.
            </Text>

            <View style={styles.stepsPreview}>
                <View style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <View style={styles.stepInfo}>
                        <Text style={styles.stepTitle}>Documento de Identidad</Text>
                        <Text style={styles.stepDescription}>Toma una foto de tu DNI o pasaporte</Text>
                    </View>
                </View>

                <View style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <View style={styles.stepInfo}>
                        <Text style={styles.stepTitle}>Selfie de Verificación</Text>
                        <Text style={styles.stepDescription}>Toma una foto de tu rostro</Text>
                    </View>
                </View>

                <View style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>3</Text>
                    </View>
                    <View style={styles.stepInfo}>
                        <Text style={styles.stepTitle}>Verificación Automática</Text>
                        <Text style={styles.stepDescription}>Comparamos las fotos para confirmar tu identidad</Text>
                    </View>
                </View>
            </View>

            <View style={styles.securityNote}>
                <Ionicons name="lock-closed-outline" size={20} color="#4CAF50" />
                <Text style={styles.securityText}>
                    Tus datos están protegidos con encriptación de grado bancario
                </Text>
            </View>

            <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setStep('document')}
            >
                <Text style={styles.primaryButtonText}>Comenzar Verificación</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );

    const renderDocumentStep = () => (
        <View style={styles.stepContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => setStep('intro')}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.stepIconSmall}>
                <Ionicons name="card-outline" size={40} color="#1152d4" />
            </View>
            <Text style={styles.stepTitleLarge}>Documento de Identidad</Text>
            <Text style={styles.stepSubtitle}>
                Coloca tu DNI o pasaporte en una superficie plana y toma una foto clara.
            </Text>

            <View style={styles.instructions}>
                <View style={styles.instructionItem}>
                    <Ionicons name="sunny-outline" size={20} color="#FFC107" />
                    <Text style={styles.instructionText}>Buena iluminación</Text>
                </View>
                <View style={styles.instructionItem}>
                    <Ionicons name="scan-outline" size={20} color="#4CAF50" />
                    <Text style={styles.instructionText}>Documento completo visible</Text>
                </View>
                <View style={styles.instructionItem}>
                    <Ionicons name="close-circle-outline" size={20} color="#FF5252" />
                    <Text style={styles.instructionText}>Sin reflejos o sombras</Text>
                </View>
            </View>

            {documentImage ? (
                <View style={styles.previewContainer}>
                    <Image source={{ uri: documentImage }} style={styles.preview} />
                    <TouchableOpacity style={styles.retakeButton} onPress={pickDocument}>
                        <Text style={styles.retakeButtonText}>Volver a tomar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity style={styles.captureButton} onPress={pickDocument}>
                    <Ionicons name="camera" size={32} color="#FFFFFF" />
                    <Text style={styles.captureButtonText}>Tomar Foto del Documento</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderSelfieStep = () => (
        <View style={styles.stepContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => setStep('document')}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.stepIconSmall}>
                <Ionicons name="person-circle-outline" size={40} color="#1152d4" />
            </View>
            <Text style={styles.stepTitleLarge}>Selfie de Verificación</Text>
            <Text style={styles.stepSubtitle}>
                Toma una foto de tu rostro mirando directamente a la cámara.
            </Text>

            <View style={styles.selfieGuide}>
                <View style={styles.selfieOval} />
                <Text style={styles.selfieGuideText}>Centra tu rostro aquí</Text>
            </View>

            {selfieImage ? (
                <View style={styles.previewContainer}>
                    <Image source={{ uri: selfieImage }} style={styles.selfiePreview} />
                    <TouchableOpacity style={styles.retakeButton} onPress={takeSelfie}>
                        <Text style={styles.retakeButtonText}>Volver a tomar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity style={styles.captureButton} onPress={takeSelfie}>
                    <Ionicons name="camera" size={32} color="#FFFFFF" />
                    <Text style={styles.captureButtonText}>Tomar Selfie</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderProcessing = () => (
        <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#1152d4" />
            <Text style={styles.processingTitle}>Verificando tu identidad...</Text>
            <Text style={styles.processingSubtitle}>
                Esto puede tomar unos segundos
            </Text>
        </View>
    );

    const renderComplete = () => (
        <View style={styles.completeContainer}>
            <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            </View>
            <Text style={styles.completeTitle}>¡Verificación Exitosa!</Text>
            <Text style={styles.completeText}>
                Tu identidad ha sido verificada correctamente.
                Ya puedes operar como guía verificado en la plataforma.
            </Text>

            <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
                <Text style={styles.verifiedBadgeText}>Guía Verificado</Text>
            </View>

            <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.replace('/(guide)/(tabs)/home' as any)}
            >
                <Text style={styles.primaryButtonText}>Continuar</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {step === 'intro' && renderIntro()}
            {step === 'document' && renderDocumentStep()}
            {step === 'selfie' && renderSelfieStep()}
            {step === 'processing' && renderProcessing()}
            {step === 'complete' && renderComplete()}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0f1c',
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    stepContainer: {
        flex: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(17, 82, 212, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 24,
    },
    stepIconSmall: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(17, 82, 212, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    stepTitleLarge: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 12,
    },
    stepSubtitle: {
        fontSize: 15,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    stepsPreview: {
        marginBottom: 24,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#1152d4',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    stepNumberText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    stepInfo: {
        flex: 1,
    },
    stepTitle: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
        marginBottom: 4,
    },
    stepDescription: {
        color: '#8E8E93',
        fontSize: 13,
    },
    securityNote: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    securityText: {
        color: '#4CAF50',
        fontSize: 13,
        marginLeft: 12,
        flex: 1,
    },
    primaryButton: {
        backgroundColor: '#1152d4',
        borderRadius: 16,
        height: 56,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    instructions: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    instructionText: {
        color: '#FFFFFF',
        fontSize: 14,
        marginLeft: 12,
    },
    captureButton: {
        backgroundColor: '#1152d4',
        borderRadius: 16,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    captureButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    previewContainer: {
        alignItems: 'center',
    },
    preview: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        marginBottom: 16,
    },
    selfiePreview: {
        width: 200,
        height: 200,
        borderRadius: 100,
        marginBottom: 16,
    },
    retakeButton: {
        paddingVertical: 12,
    },
    retakeButtonText: {
        color: '#1152d4',
        fontSize: 14,
        fontWeight: '600',
    },
    selfieGuide: {
        alignItems: 'center',
        marginBottom: 24,
    },
    selfieOval: {
        width: 160,
        height: 200,
        borderRadius: 80,
        borderWidth: 3,
        borderColor: '#1152d4',
        borderStyle: 'dashed',
    },
    selfieGuideText: {
        color: '#8E8E93',
        fontSize: 13,
        marginTop: 12,
    },
    processingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '600',
        marginTop: 24,
        marginBottom: 8,
    },
    processingSubtitle: {
        color: '#8E8E93',
        fontSize: 14,
    },
    completeContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successIcon: {
        marginBottom: 24,
    },
    completeTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    completeText: {
        fontSize: 16,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginBottom: 40,
    },
    verifiedBadgeText: {
        color: '#4CAF50',
        fontWeight: '600',
        fontSize: 16,
        marginLeft: 8,
    },
});
