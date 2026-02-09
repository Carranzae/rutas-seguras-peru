/**
 * Ruta Segura Perú - Glassmorphic Card Component
 * Premium translucent card with blur effect and neon borders
 */
import { Animations, BorderRadius, Colors, Shadows } from '@/src/constants/theme';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

interface GlassmorphicCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: 'default' | 'elevated' | 'neon' | 'danger';
    animate?: boolean;
    delay?: number;
    onPress?: () => void;
}

export function GlassmorphicCard({
    children,
    style,
    variant = 'default',
    animate = true,
    delay = 0,
}: GlassmorphicCardProps) {
    const scale = useSharedValue(1);

    const getVariantStyles = (): ViewStyle => {
        switch (variant) {
            case 'elevated':
                return {
                    backgroundColor: Colors.glassBgHover,
                    borderColor: Colors.glassBorderBright,
                };
            case 'neon':
                return {
                    backgroundColor: Colors.glassBg,
                    borderColor: Colors.primary,
                    ...Shadows.neonCyan,
                };
            case 'danger':
                return {
                    backgroundColor: Colors.dangerBg,
                    borderColor: Colors.accent,
                    ...Shadows.neonRed,
                };
            default:
                return {
                    backgroundColor: Colors.glassBg,
                    borderColor: Colors.glassBorder,
                };
        }
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePressIn = () => {
        scale.value = withSpring(0.98, Animations.spring.default);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, Animations.spring.default);
    };

    const variantStyles = getVariantStyles();

    if (animate) {
        return (
            <Animated.View
                entering={FadeIn.delay(delay).duration(Animations.duration.normal)}
                style={[styles.container, variantStyles, animatedStyle, style]}
            >
                {children}
            </Animated.View>
        );
    }

    return (
        <View style={[styles.container, variantStyles, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        padding: 16,
        overflow: 'hidden',
        ...Shadows.glass,
    },
});

export default GlassmorphicCard;
