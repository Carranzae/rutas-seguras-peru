import { Colors } from '@/src/constants/theme';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

interface SkeletonProps {
    width: number | string;
    height: number;
    style?: ViewStyle;
    borderRadius?: number;
}

export const Skeleton = ({ width, height, style, borderRadius = 8 }: SkeletonProps) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();

        return () => animation.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    opacity,
                    borderRadius,
                },
                style as any,
            ]}
        />
    );
};

export const TourCardSkeleton = () => (
    <View style={styles.cardContainer}>
        <Skeleton width="100%" height={160} borderRadius={16} />
        <View style={styles.content}>
            <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
            <Skeleton width="40%" height={12} style={{ marginBottom: 16 }} />
            <View style={styles.row}>
                <Skeleton width={60} height={20} />
                <Skeleton width={80} height={24} />
            </View>
        </View>
    </View>
);

export const FeaturedTourSkeleton = () => (
    <View style={styles.featuredContainer}>
        <Skeleton width={260} height={160} borderRadius={16} />
        <View style={styles.content}>
            <Skeleton width={180} height={16} style={{ marginBottom: 8 }} />
            <View style={styles.row}>
                <Skeleton width={60} height={12} />
                <Skeleton width={80} height={20} />
            </View>
        </View>
    </View>
);

export const ProfileSkeleton = () => (
    <View style={{ padding: 20 }}>
        <View style={{ alignItems: 'center', marginBottom: 30 }}>
            <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: 16 }} />
            <Skeleton width={150} height={24} style={{ marginBottom: 8 }} />
            <Skeleton width={200} height={16} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
            <Skeleton width={80} height={60} borderRadius={12} />
            <Skeleton width={80} height={60} borderRadius={12} />
            <Skeleton width={80} height={60} borderRadius={12} />
        </View>
        <Skeleton width="100%" height={60} borderRadius={12} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={60} borderRadius={12} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={60} borderRadius={12} />
    </View>
);

export const TourDetailSkeleton = () => (
    <View>
        <Skeleton width="100%" height={280} borderRadius={0} style={{ marginBottom: -20 }} />
        <View style={{ padding: 20, backgroundColor: Colors.backgroundLight, borderRadius: 24 }}>
            <Skeleton width="80%" height={28} style={{ marginBottom: 12 }} />
            <Skeleton width="40%" height={16} style={{ marginBottom: 24 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
                <Skeleton width={70} height={60} borderRadius={12} />
                <Skeleton width={70} height={60} borderRadius={12} />
                <Skeleton width={70} height={60} borderRadius={12} />
            </View>

            <Skeleton width="100%" height={100} borderRadius={12} style={{ marginBottom: 24 }} />
            <Skeleton width="100%" height={80} borderRadius={12} />
        </View>
    </View>
);

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: Colors.surfaceDark, // Adapt to theme
    },
    cardContainer: {
        backgroundColor: Colors.surfaceLight,
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
    },
    featuredContainer: {
        width: 260,
        marginRight: 16,
        backgroundColor: Colors.surfaceLight,
        borderRadius: 16,
        padding: 0,
        overflow: 'hidden',
    },
    content: {
        padding: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});
