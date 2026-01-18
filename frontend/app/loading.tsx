import { View, Text, Image, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSocket } from '@/hooks/useSocket';
import { useCameraPermissions } from 'expo-camera';

const LOADING_TEXTS = [
    "The judge's brain is warming up...",
    "The audience is taking their seats...",
    "Summoning a slightly unhinged theme...",
    "Calibrating chaos levels...",
    "Your environment is about to matter...",
    "Ready to go..."
];

const MIN_LOADING_TIME_MS = 3000;

export default function LoadingScreen() {
    const router = useRouter();
    const { pendingNavigation, clearPendingNavigation } = useSocket();
    const [permission, requestPermission] = useCameraPermissions();

    // Track minimum loading time
    const [minTimeElapsed, setMinTimeElapsed] = useState(false);
    const [gameReady, setGameReady] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);

    // Array of animated values for opacity, one for each line
    const opacityAnims = useRef(LOADING_TEXTS.map(() => new Animated.Value(0))).current;

    // Request camera permission on mount
    useEffect(() => {
        if (!permission) return;

        if (permission.granted) {
            setCameraReady(true);
        } else if (!permission.granted && permission.canAskAgain) {
            requestPermission().then((result) => {
                if (result.granted) {
                    setCameraReady(true);
                } else {
                    Alert.alert(
                        'Camera Required',
                        'This game needs camera access to play. Please enable it in settings.',
                        [{ text: 'OK' }]
                    );
                }
            });
        } else {
            // Permission denied and can't ask again
            Alert.alert(
                'Camera Required',
                'This game needs camera access. Please enable it in your device settings.',
                [{ text: 'OK' }]
            );
        }
    }, [permission]);

    // Start minimum timer
    useEffect(() => {
        const timer = setTimeout(() => {
            setMinTimeElapsed(true);
        }, MIN_LOADING_TIME_MS);

        return () => clearTimeout(timer);
    }, []);

    // Listen for game start signal
    useEffect(() => {
        if (pendingNavigation && pendingNavigation.type === 'game') {
            setGameReady(true);
        }
    }, [pendingNavigation]);

    // Navigate to game when ALL conditions are met (including camera permission)
    useEffect(() => {
        if (minTimeElapsed && gameReady && cameraReady) {
            clearPendingNavigation();
            router.replace('/game');
        }
    }, [minTimeElapsed, gameReady, cameraReady, clearPendingNavigation, router]);

    useEffect(() => {
        // Create a sequence of animations
        const animations = LOADING_TEXTS.map((_, index) => {
            return Animated.timing(opacityAnims[index], {
                toValue: 1,
                duration: 500, // Fade in duration
                delay: index === 0 ? 0 : 500, // Delay before start (relative to previous)
                useNativeDriver: true,
            });
        });

        // Run animations in sequence with staggered delay
        Animated.stagger(1000, animations).start();

    }, []);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.neo.background }}>
            <View className="flex-1 px-8 justify-between py-20">
                {/* Text Container - Centered */}
                <View className="flex-1 justify-center">
                    {LOADING_TEXTS.map((text, index) => (
                        <Animated.View
                            key={index}
                            style={{ opacity: opacityAnims[index], marginBottom: 16 }}
                        >
                            <Text
                                className="text-xl text-neo-text text-center"
                                style={{ fontFamily: 'Nunito_600SemiBold' }}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                            >
                                {text}
                            </Text>
                        </Animated.View>
                    ))}
                </View>

                {/* Loading GIF */}
                <View className="items-center mb-20">
                    <Image
                        source={require('@/assets/images/loading.gif')}
                        style={{ width: 80, height: 80 }}
                        resizeMode="contain"
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}
