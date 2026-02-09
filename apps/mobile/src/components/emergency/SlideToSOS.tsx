/**
 * Ruta Segura Perú - Slide to SOS Component
 * Premium slide-to-unlock style emergency trigger with haptic feedback
 */
import { Animations, BorderRadius, Colors, Shadows, Typography } from '@/src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
    Easing,
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 48;
const BUTTON_SIZE = 56;
const SLIDE_THRESHOLD = SLIDER_WIDTH - BUTTON_SIZE - 8;

interface SlideToSOSProps {
    onActivate: () => void;
    label?: string;
    disabled?: boolean;
}

export function SlideToSOS({
    onActivate,
    label = 'SLIDE FOR EMERGENCY',
    disabled = false,
}: SlideToSOSProps) {
    const translateX = useSharedValue(0);
    const arrowOpacity = useSharedValue(1);
    const [isActivated, setIsActivated] = useState(false);

    // Animate arrow hint
    React.useEffect(() => {
        arrowOpacity.value = withRepeat(
            withSequence(
                withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const triggerHaptic = (style: 'light' | 'medium' | 'heavy' | 'success') => {
        if (style === 'success') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.impactAsync(
                style === 'light'
                    ? Haptics.ImpactFeedbackStyle.Light
                    : style === 'medium'
                        ? Haptics.ImpactFeedbackStyle.Medium
                        : Haptics.ImpactFeedbackStyle.Heavy
            );
        }
    };

    const handleActivate = () => {
        setIsActivated(true);
        onActivate();
        // Reset after a delay
        setTimeout(() => {
            translateX.value = withSpring(0, Animations.spring.gentle);
            setIsActivated(false);
        }, 2000);
    };

    const gestureHandler = useAnimatedGestureHandler({
        onStart: () => {
            runOnJS(triggerHaptic)('light');
        },
        onActive: (event) => {
            const clampedX = Math.max(0, Math.min(event.translationX, SLIDE_THRESHOLD));
            translateX.value = clampedX;

            // Progressive haptic feedback
            if (clampedX > SLIDE_THRESHOLD * 0.5 && clampedX < SLIDE_THRESHOLD * 0.55) {
                runOnJS(triggerHaptic)('medium');
            }
            if (clampedX > SLIDE_THRESHOLD * 0.8 && clampedX < SLIDE_THRESHOLD * 0.85) {
                runOnJS(triggerHaptic)('heavy');
            }
        },
        onEnd: () => {
            if (translateX.value > SLIDE_THRESHOLD * 0.9) {
                translateX.value = withSpring(SLIDE_THRESHOLD, Animations.spring.bouncy);
                runOnJS(triggerHaptic)('success');
                runOnJS(handleActivate)();
            } else {
                translateX.value = withSpring(0, Animations.spring.default);
                runOnJS(triggerHaptic)('light');
            }
        },
    });

    const buttonStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const backgroundProgressStyle = useAnimatedStyle(() => ({
        width: translateX.value + BUTTON_SIZE,
        opacity: interpolate(translateX.value, [0, SLIDE_THRESHOLD], [0.3, 1]),
    }));

    const textOpacityStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateX.value,
            [0, SLIDE_THRESHOLD * 0.5],
            [1, 0],
            Extrapolation.CLAMP
        ),
    }));

    const arrowStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateX.value,
            [0, SLIDE_THRESHOLD * 0.3],
            [arrowOpacity.value, 0],
            Extrapolation.CLAMP
        ),
    }));

    const activatedTextStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateX.value,
            [SLIDE_THRESHOLD * 0.7, SLIDE_THRESHOLD],
            [0, 1],
            Extrapolation.CLAMP
        ),
    }));

    return (
        <View style={[styles.container, disabled && styles.disabled]}>
            {/* Track background */}
            <View style={styles.track}>
                {/* Progress fill */}
                <Animated.View style={[styles.progressFill, backgroundProgressStyle]} />

                {/* Label text */}
                <Animated.View style={[styles.labelContainer, textOpacityStyle]}>
                    <Text style={styles.label}>{label}</Text>
                    <Animated.View style={arrowStyle}>
                        <Ionicons name="arrow-forward" size={20} color={Colors.textLight} />
                    </Animated.View>
                </Animated.View>

                {/* Activated text */}
                <Animated.View style={[styles.activatedContainer, activatedTextStyle]}>
                    <Text style={styles.activatedText}>🚨 SOS ACTIVATED</Text>
                </Animated.View>

                {/* Draggable button */}
                <PanGestureHandler onGestureEvent={gestureHandler} enabled={!disabled}>
                    <Animated.View style={[styles.button, buttonStyle]}>
                        <View style={styles.buttonInner}>
                            <Text style={styles.sosText}>SOS</Text>
                        </View>
                    </Animated.View>
                </PanGestureHandler>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    disabled: {
        opacity: 0.5,
    },
    track: {
        width: SLIDER_WIDTH,
        height: 64,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.surfaceElevated,
        borderWidth: 2,
        borderColor: Colors.accent,
        justifyContent: 'center',
        overflow: 'hidden',
        ...Shadows.neonRed,
    },
    progressFill: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: Colors.dangerBg,
        borderRadius: BorderRadius.full,
    },
    labelContainer: {
        position: 'absolute',
        left: BUTTON_SIZE + 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    label: {
        color: Colors.textLight,
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        letterSpacing: 1,
    },
    activatedContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activatedText: {
        color: Colors.accent,
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        letterSpacing: 2,
    },
    button: {
        position: 'absolute',
        left: 4,
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        backgroundColor: Colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.neonRedIntense,
    },
    buttonInner: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    sosText: {
        color: Colors.textLight,
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.extrabold,
        letterSpacing: 1,
    },
});

export default SlideToSOS;
