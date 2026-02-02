// Ruta Segura Perú - Input Component
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
    ViewStyle
} from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    rightElement?: React.ReactNode;
    variant?: 'light' | 'dark';
    containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    icon,
    iconPosition = 'right',
    rightElement,
    variant = 'light',
    containerStyle,
    ...textInputProps
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const isDark = variant === 'dark';

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={[styles.label, isDark && styles.labelDark]}>{label}</Text>
            )}
            <View
                style={[
                    styles.inputContainer,
                    isDark && styles.inputContainerDark,
                    isFocused && styles.inputContainerFocused,
                    error && styles.inputContainerError,
                ]}
            >
                {icon && iconPosition === 'left' && (
                    <View style={styles.iconContainer}>{icon}</View>
                )}
                <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    placeholderTextColor={isDark ? Colors.textMuted : Colors.textSecondary}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...textInputProps}
                />
                {icon && iconPosition === 'right' && (
                    <View style={styles.iconContainer}>{icon}</View>
                )}
                {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        gap: Spacing.xs,
    },
    label: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        color: Colors.textSecondary,
        paddingLeft: Spacing.xs,
    },
    labelDark: {
        color: Colors.textMuted,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceLight,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        minHeight: 56,
        paddingHorizontal: Spacing.md,
    },
    inputContainerDark: {
        backgroundColor: 'rgba(35, 47, 72, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    inputContainerFocused: {
        borderColor: Colors.primary,
    },
    inputContainerError: {
        borderColor: Colors.danger,
    },
    input: {
        flex: 1,
        fontSize: Typography.fontSize.base,
        color: Colors.textPrimary,
        paddingVertical: Spacing.md,
    },
    inputDark: {
        color: Colors.textLight,
    },
    iconContainer: {
        marginHorizontal: Spacing.xs,
    },
    rightElement: {
        marginLeft: Spacing.sm,
    },
    error: {
        fontSize: Typography.fontSize.xs,
        color: Colors.danger,
        paddingLeft: Spacing.xs,
    },
});

export default Input;
