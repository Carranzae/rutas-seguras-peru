/**
 * Ruta Segura Perú - Animated SOS Button
 * Emergency button with pulse animation, haptic feedback, and neon glow
 */
import { Animations, Colors, Shadows, Typography } from '@/src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import Animated, {
    Easing,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

interface AnimatedSOSButtonProps {
    onPress: () => void;
    onLongPress?: () => void;
    disabled?: boolean;
    size?: 'small' | 'medium' | 'large';
    style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedSOSButton({
    onPress,
    onLongPress,
    disabled = false,
    size = 'large',
    style,
}: AnimatedSOSButtonProps) {
    // Animation values
    const pulseScale = useSharedValue(1);
    const glowOpacity = useSharedValue(0.4);
    const pressScale = useSharedValue(1);
    const rippleScale = useSharedValue(0);
    const rippleOpacity = useSharedValue(0);

    // Continuous pulse animation
    useEffect(() => {
        pulseScale.value = withRepeat(
            withSequence(
                withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        glowOpacity.value = withRepeat(
            withSequence(
                withTiming(0.8, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const triggerHaptic = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, []);

    const triggerRipple = useCallback(() => {
        rippleScale.value = 0;
        rippleOpacity.value = 0.6;
        rippleScale.value = withTiming(2.5, { duration: 400 });
        rippleOpacity.value = withTiming(0, { duration: 400 });
    }, []);

    const handlePressIn = () => {
        pressScale.value = withSpring(0.92, Animations.spring.bouncy);
        runOnJS(triggerHaptic)();
    };

    const handlePressOut = () => {
        pressScale.value = withSpring(1, Animations.spring.default);
    };

    const handlePress = () => {
        runOnJS(triggerRipple)();
        runOnJS(triggerHaptic)();
        onPress();
    };

    const handleLongPress = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        onLongPress?.();
    };

    // Animated styles
    const containerStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: pulseScale.value * pressScale.value },
        ],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
        transform: [{ scale: interpolate(glowOpacity.value, [0.4, 0.8], [1, 1.15]) }],
    }));

    const rippleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: rippleScale.value }],
        opacity: rippleOpacity.value,
    }));

    // Size configurations
    const sizeConfig = {
        small: { button: 60, icon: 24, text: 10 },
        medium: { button: 80, icon: 32, text: 12 },
        large: { button: 100, icon: 40, text: 14 },
    };

    const config = sizeConfig[size];

    return (
        <View style={[styles.wrapper, style]}>
            {/* Outer glow ring */}
            <Animated.View
                style={[
                    styles.glowRing,
                    {
                        width: config.button + 40,
                        height: config.button + 40,
                        borderRadius: (config.button + 40) / 2,
                    },
                    glowStyle,
                ]}
            />

            {/* Ripple effect */}
            <Animated.View
                style={[
                    styles.ripple,
                    {
                        width: config.button,
                        height: config.button,
                        borderRadius: config.button / 2,
                    },
                    rippleStyle,
                ]}
            />

            {/* Main button */}
            <AnimatedPressable
                onPress={handlePress}
                onLongPress={handleLongPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
                delayLongPress={500}
                style={[
                    styles.button,
                    {
                        width: config.button,
                        height: config.button,
                        borderRadius: config.button / 2,
                        opacity: disabled ? 0.5 : 1,
                    },
                    containerStyle,
                ]}
            >
                <View style={styles.buttonInner}>
                    <Ionicons name="warning" size={config.icon} color={Colors.textLight} />
                    <Text style={[styles.buttonText, { fontSize: config.text }]}>SOS</Text>
                </View>
            </AnimatedPressable>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowRing: {
        position: 'absolute',
        backgroundColor: 'transparent',
        borderWidth: 3,
        borderColor: Colors.accent,
        ...Shadows.neonRedIntense,
    },
    ripple: {
        position: 'absolute',
        backgroundColor: Colors.accentLight,
    },
    button: {
        backgroundColor: Colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.neonRed,
    },
    buttonInner: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    buttonText: {
        color: Colors.textLight,
        fontWeight: Typography.fontWeight.bold,
        letterSpacing: 2,
    },
});

export default AnimatedSOSButton;
