// Ruta Segura Perú - Button Component
import React from 'react';
import {
    ActivityIndicator,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import { BorderRadius, Colors, Shadows, Typography } from '../../constants/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    style,
    textStyle,
}) => {
    const getButtonStyle = (): ViewStyle => {
        const base: ViewStyle = {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: BorderRadius.lg,
            gap: 8,
        };

        // Size styles
        const sizeStyles: Record<string, ViewStyle> = {
            sm: { paddingHorizontal: 12, paddingVertical: 8, minHeight: 36 },
            md: { paddingHorizontal: 16, paddingVertical: 12, minHeight: 48 },
            lg: { paddingHorizontal: 24, paddingVertical: 16, minHeight: 56 },
        };

        // Variant styles
        const variantStyles: Record<string, ViewStyle> = {
            primary: {
                backgroundColor: Colors.primary,
                ...Shadows.primary,
            },
            secondary: {
                backgroundColor: Colors.surfaceDark,
            },
            outline: {
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: Colors.primary,
            },
            ghost: {
                backgroundColor: 'transparent',
            },
            danger: {
                backgroundColor: Colors.danger,
                ...Shadows.danger,
            },
        };

        return {
            ...base,
            ...sizeStyles[size],
            ...variantStyles[variant],
            ...(fullWidth && { width: '100%' }),
            ...(disabled && { opacity: 0.5 }),
        };
    };

    const getTextStyle = (): TextStyle => {
        const sizeStyles: Record<string, TextStyle> = {
            sm: { fontSize: Typography.fontSize.sm },
            md: { fontSize: Typography.fontSize.base },
            lg: { fontSize: Typography.fontSize.lg },
        };

        const variantStyles: Record<string, TextStyle> = {
            primary: { color: Colors.textLight },
            secondary: { color: Colors.textLight },
            outline: { color: Colors.primary },
            ghost: { color: Colors.primary },
            danger: { color: Colors.textLight },
        };

        return {
            fontWeight: Typography.fontWeight.bold,
            ...sizeStyles[size],
            ...variantStyles[variant],
        };
    };

    return (
        <TouchableOpacity
            style={[getButtonStyle(), style]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.textLight}
                    size="small"
                />
            ) : (
                <>
                    {icon && iconPosition === 'left' && <View>{icon}</View>}
                    <Text style={[getTextStyle(), textStyle]}>{title}</Text>
                    {icon && iconPosition === 'right' && <View>{icon}</View>}
                </>
            )}
        </TouchableOpacity>
    );
};

export default Button;
