// Ruta Segura Perú - SOS Button Component
// Slide to confirm emergency button for guides and tourists
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    PanResponder,
    StyleSheet,
    Text,
    Vibration,
    View,
} from 'react-native';
import { BorderRadius, Colors, Shadows, Typography } from '../../constants/theme';

interface SOSButtonProps {
    onActivate: () => void;
    variant?: 'floating' | 'fullWidth';
    text?: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const BUTTON_HEIGHT = 64;
const THUMB_SIZE = 56;
const SLIDE_THRESHOLD = 0.7;

export const SOSButton: React.FC<SOSButtonProps> = ({
    onActivate,
    variant = 'floating',
    text = 'Slide for Emergency',
}) => {
    const [isActivating, setIsActivating] = useState(false);
    const translateX = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const maxSlide = variant === 'floating'
        ? SCREEN_WIDTH - 48 - THUMB_SIZE - 8
        : SCREEN_WIDTH - 32 - THUMB_SIZE - 8;

    // Pulse animation
    React.useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                Vibration.vibrate(50);
            },
            onPanResponderMove: (_, gestureState) => {
                const newX = Math.max(0, Math.min(gestureState.dx, maxSlide));
                translateX.setValue(newX);

                if (newX / maxSlide >= SLIDE_THRESHOLD && !isActivating) {
                    setIsActivating(true);
                    Vibration.vibrate(100);
                } else if (newX / maxSlide < SLIDE_THRESHOLD) {
                    setIsActivating(false);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                const percentage = gestureState.dx / maxSlide;

                if (percentage >= SLIDE_THRESHOLD) {
                    // Activate SOS
                    Vibration.vibrate([100, 100, 100]);
                    Animated.spring(translateX, {
                        toValue: maxSlide,
                        useNativeDriver: true,
                    }).start(() => {
                        onActivate();
                        // Reset after a short delay
                        setTimeout(() => {
                            Animated.spring(translateX, {
                                toValue: 0,
                                useNativeDriver: true,
                            }).start();
                            setIsActivating(false);
                        }, 1000);
                    });
                } else {
                    // Reset to start
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                    setIsActivating(false);
                }
            },
        })
    ).current;

    const opacity = translateX.interpolate({
        inputRange: [0, maxSlide],
        outputRange: [0.9, 0.5],
    });

    return (
        <View style={[styles.container, variant === 'fullWidth' && styles.fullWidth]}>
            <Animated.View
                style={[
                    styles.track,
                    { transform: [{ scale: pulseAnim }] },
                ]}
            >
                {/* Background pulse */}
                <View style={[styles.pulseBackground, isActivating && styles.activating]} />

                {/* Track content */}
                <Animated.View style={[styles.textContainer, { opacity }]}>
                    <Text style={styles.text}>{text}</Text>
                    <Text style={styles.arrow}>→</Text>
                </Animated.View>

                {/* Slider thumb */}
                <Animated.View
                    style={[
                        styles.thumb,
                        { transform: [{ translateX }] },
                    ]}
                    {...panResponder.panHandlers}
                >
                    <Text style={styles.sosText}>SOS</Text>
                </Animated.View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
        zIndex: 100,
    },
    fullWidth: {
        left: 16,
        right: 16,
    },
    track: {
        height: BUTTON_HEIGHT,
        backgroundColor: Colors.sosRed,
        borderRadius: BorderRadius.full,
        padding: 4,
        justifyContent: 'center',
        ...Shadows.danger,
    },
    pulseBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.danger,
        borderRadius: BorderRadius.full,
        opacity: 0,
    },
    activating: {
        opacity: 0.5,
    },
    textContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: THUMB_SIZE + 16,
    },
    text: {
        color: Colors.textLight,
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    arrow: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: Typography.fontSize.xl,
        marginLeft: 8,
    },
    thumb: {
        position: 'absolute',
        left: 4,
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2,
        backgroundColor: Colors.textLight,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.lg,
    },
    sosText: {
        color: Colors.sosRed,
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.extrabold,
    },
});

export default SOSButton;
