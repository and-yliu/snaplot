import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    withDelay,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Asset imports
const coffeeImg = require('@/assets/images/pixel-coffee.png');
const gameboyImg = require('@/assets/images/pixel-gameboy.png');
const plantImg = require('@/assets/images/pixel-plant.png');
const bookImg = require('@/assets/images/pixel-book.png');
const catImg = require('@/assets/images/pixel-cat.png');

// Types of floating items
type FloatingItemType = 'image' | 'text';

interface FloatingItemProps {
    id: number;
    type: FloatingItemType;
    content: any; // Image source or string
    initialX: number;
    initialY: number;
    size: number;
    rotation?: number;
    duration: number;
    delay: number;
}

// Configuration for floating items
// Configuration for floating items
const FLOATING_ITEMS: FloatingItemProps[] = [
    // Left Column
    { id: 1, type: 'image', content: coffeeImg, initialX: 0.05, initialY: 0.15, size: 60, rotation: -15, duration: 4000, delay: 0 },
    { id: 7, type: 'text', content: 'PLOT', initialX: 0.1, initialY: 0.4, size: 24, rotation: -20, duration: 4800, delay: 600 },
    { id: 3, type: 'image', content: plantImg, initialX: 0.08, initialY: 0.85, size: 65, rotation: 5, duration: 4500, delay: 200 },
    { id: 8, type: 'text', content: 'CREATE', initialX: 0.12, initialY: 0.70, size: 20, rotation: 5, duration: 5800, delay: 1200 },

    // Right Column
    { id: 2, type: 'image', content: gameboyImg, initialX: 0.85, initialY: 0.2, size: 70, rotation: 10, duration: 5000, delay: 500 },
    { id: 6, type: 'text', content: 'SNAP', initialX: 0.8, initialY: 0.45, size: 24, rotation: 15, duration: 5200, delay: 300 },
    { id: 9, type: 'text', content: 'FUN', initialX: 0.68, initialY: 0.75, size: 22, rotation: -10, duration: 4200, delay: 150 },
    { id: 4, type: 'image', content: bookImg, initialX: 0.70, initialY: 0.9, size: 55, rotation: -10, duration: 5500, delay: 800 },

    // Center
    { id: 5, type: 'image', content: catImg, initialX: 0.45, initialY: 0.02, size: 60, rotation: 0, duration: 6000, delay: 1000 },
];

const FloatingItem = ({ item }: { item: FloatingItemProps }) => {
    const translateY = useSharedValue(0);
    const translateX = useSharedValue(0);

    useEffect(() => {
        // Vertical floating motion
        translateY.value = withDelay(
            item.delay,
            withRepeat(
                withSequence(
                    withTiming(-20, { duration: item.duration, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0, { duration: item.duration, easing: Easing.inOut(Easing.ease) }),
                ),
                -1,
                true
            )
        );

        // Subtle horizontal drift
        translateX.value = withDelay(
            item.delay,
            withRepeat(
                withSequence(
                    withTiming(10, { duration: item.duration * 1.5, easing: Easing.inOut(Easing.ease) }),
                    withTiming(-10, { duration: item.duration * 1.5, easing: Easing.inOut(Easing.ease) }),
                ),
                -1,
                true
            )
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { translateX: translateX.value },
            { rotate: `${item.rotation || 0}deg` },
        ],
    }));

    const positionStyle: any = {
        position: 'absolute',
        left: item.initialX * SCREEN_WIDTH,
        top: item.initialY * SCREEN_HEIGHT,
    };

    return (
        <Animated.View style={[positionStyle, animatedStyle, { opacity: 0.3, zIndex: -1 }]}>
            {item.type === 'image' ? (
                <View style={[styles.imageContainer, { width: item.size + 16, height: item.size + 16 }]}>
                    <Image
                        source={item.content}
                        style={{ width: item.size, height: item.size }}
                        resizeMode="contain"
                    />
                </View>
            ) : (
                <View style={styles.textContainer}>
                    <Text style={[styles.text, { fontSize: item.size }]}>{item.content}</Text>
                </View>
            )}
        </Animated.View>
    );
};

export const FloatingBackground = () => {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {FLOATING_ITEMS.map((item) => (
                <FloatingItem key={item.id} item={item} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    imageContainer: {
        backgroundColor: '#FFFFFF',
        borderWidth: 3,
        borderColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
        padding: 8,
    },
    textContainer: {
        backgroundColor: '#FFEB3B', // Yellow for text tags
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 2,
        borderColor: '#000000',
        shadowColor: '#000000',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 3,
    },
    text: {
        fontFamily: 'Audiowide_400Regular', // Using the game font
        color: '#000000',
    },
});
