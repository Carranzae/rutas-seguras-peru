// Ruta Segura Perú - Card Component
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing } from '../../constants/theme';

interface CardProps {
    children: React.ReactNode;
    variant?: 'default' | 'elevated' | 'outlined' | 'dark' | 'danger';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'default',
    padding = 'md',
    style,
}) => {
    const getVariantStyle = (): ViewStyle => {
        switch (variant) {
            case 'elevated':
                return {
                    backgroundColor: Colors.surfaceLight,
                    ...Shadows.lg,
                };
            case 'outlined':
                return {
                    backgroundColor: Colors.surfaceLight,
                    borderWidth: 1,
                    borderColor: Colors.borderLight,
                };
            case 'dark':
                return {
                    backgroundColor: Colors.surfaceDark,
                    borderWidth: 1,
                    borderColor: Colors.borderDark,
                };
            case 'danger':
                return {
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 1,
                    borderColor: 'rgba(239, 68, 68, 0.2)',
                };
            default:
                return {
                    backgroundColor: Colors.surfaceLight,
                    ...Shadows.sm,
                };
        }
    };

    const getPaddingStyle = (): ViewStyle => {
        const paddings = {
            none: 0,
            sm: Spacing.sm,
            md: Spacing.md,
            lg: Spacing.lg,
        };
        return { padding: paddings[padding] };
    };

    return (
        <View style={[styles.base, getVariantStyle(), getPaddingStyle(), style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
    },
});

export default Card;
