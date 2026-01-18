import { useMemo, useState, useEffect, useRef } from 'react';
import { Alert, StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NeoButton } from '@/components/ui/NeoButton';
import { useSocket } from '@/hooks/useSocket';
import '../global.css';

// Simple Judging Indicator Component
function JudgingIndicator() {
    return (
        <View className="w-full py-2 rounded-lg bg-neo-primary items-center justify-center">
            <Text className="text-base font-bold text-white">JUDGING...</Text>
        </View>
    );
}


export default function GameScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [photo, setPhoto] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const {
        lobbyState,
        gameStart,
        currentRound,
        tick,
        submittedPlayerIds,
        isJudging,
        nextRoundStatus,
        pendingNavigation,
        clearPendingNavigation,
        error,
        uploadAndSubmitPhoto,
    } = useSocket();

    useEffect(() => {
        if (permission && !permission.granted) {
            requestPermission();
        }
    }, [permission, requestPermission]);

    useEffect(() => {
        if (pendingNavigation?.type === 'round-result') {
            clearPendingNavigation();
            router.push('/round-result');
        }
    }, [pendingNavigation, clearPendingNavigation, router]);

    useEffect(() => {
        if (pendingNavigation?.type === 'game') {
            clearPendingNavigation();
        }
    }, [pendingNavigation, clearPendingNavigation]);

    useEffect(() => {
        if (error) {
            Alert.alert('Error', error);
        }
    }, [error]);

    useEffect(() => {
        setPhoto(null);
        setIsUploading(false);
        setHasSubmitted(false);
    }, [currentRound?.round]);

    const totalSeconds = lobbyState?.settings?.roundTimeSeconds ?? 60;
    const timeLeft = tick?.remainingSeconds ?? totalSeconds;

    const timeProgressPct = useMemo(() => {
        if (!totalSeconds) return 0;
        return Math.max(0, Math.min(100, (timeLeft / totalSeconds) * 100));
    }, [timeLeft, totalSeconds]);

    const promptText = currentRound?.theme ?? gameStart?.blanks?.[0]?.theme ?? '...';
    const criteriaText = currentRound?.criteria ?? gameStart?.blanks?.[0]?.criteria ?? '...';

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    const handleTakePhoto = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    skipProcessing: true, // Faster capture
                });
                if (photo) {
                    setPhoto(photo.uri);
                }
            } catch (error) {
                console.error('Failed to take photo:', error);
            }
        }
    };

    const handleRetake = () => {
        setPhoto(null);
    };

    const handleSubmit = () => {
        if (!photo || isUploading || hasSubmitted) return;
        setHasSubmitted(true);
        setIsUploading(true);
        uploadAndSubmitPhoto(photo)
            .then((ok) => {
                if (!ok) {
                    setHasSubmitted(false);
                }
            })
            .finally(() => setIsUploading(false));
    };

    const totalPlayers = lobbyState?.players?.length ?? nextRoundStatus?.totalPlayers ?? 0;
    const submittedCount = submittedPlayerIds.length;

    return (
        <SafeAreaView className="flex-1 bg-neo-background px-6" edges={['top', 'bottom']}>
            {/* Header */}
            <View className="mb-5 items-center">
                {/* Top Row - Hidden */}
                <View className="hidden flex-row justify-between mb-2.5 w-full">
                    <Text className="font-semibold text-sm text-neo-text">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <View className="flex-row gap-1">
                        <Ionicons name="cellular" size={20} color="black" />
                        <Ionicons name="wifi" size={20} color="black" />
                        <Ionicons name="battery-full" size={20} color="black" />
                    </View>
                </View>

                <Text className="text-2xl text-neo-text leading-8 mb-4 mt-5 font-bold text-center">
                    {promptText}
                </Text>

                <Text className="text-xl font-semibold text-neo-text mb-6 text-center">
                    Criteria: <Text className="font-bold">{criteriaText}</Text>
                </Text>

                {/* Timer Bar or Judging Indicator */}
                {isJudging ? (
                    <JudgingIndicator />
                ) : (
                    <View className="flex-row items-center gap-3 w-full">
                        <Text className="text-lg font-bold w-[70px] text-neo-text shrink-0" style={{ fontVariant: ['tabular-nums'] }}>
                            00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                        </Text>
                        <View className="flex-1 h-1.5 bg-black/10 rounded-sm">
                            <View
                                className="h-full bg-neo-text rounded-sm"
                                style={{ width: `${timeProgressPct}%` }}
                            />
                        </View>
                    </View>
                )}
            </View>

            {/* Camera Container */}
            <View className="flex-1 rounded-2xl overflow-hidden bg-black mb-5 border-2 border-neo-border">
                {photo ? (
                    <Image source={{ uri: photo }} className="flex-1 justify-end items-center" resizeMode="cover" />
                ) : (
                    <>
                        <CameraView
                            style={StyleSheet.absoluteFill}
                            facing="back"
                            ref={cameraRef}
                        />
                        <View pointerEvents="box-none" className="absolute left-0 right-0 bottom-8 items-center">
                            <TouchableOpacity
                                className="w-[72px] h-[72px] rounded-full bg-[#E8CA98] justify-center items-center border-4 border-white shadow-md"
                                onPress={handleTakePhoto}
                                activeOpacity={0.7}
                            >
                                <View className="absolute w-[60px] h-[60px] rounded-full border border-black/10" />
                                <Ionicons name="camera" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>

            {/* Footer */}
            <View className="h-[100px] justify-center">
                <View className="flex-row items-center gap-4">
                    {/* Status indicator - always on the left */}
                    <View className="items-start min-w-[100px]">
                        <Text className="text-xl font-bold text-neo-text">{submittedCount}/{totalPlayers || 0}</Text>
                        <Text className="text-xs font-semibold text-neo-text">have submitted</Text>
                    </View>

                    {/* Buttons - on the right, only show when photo taken and not submitted */}
                    {photo && !hasSubmitted ? (
                        <>
                            <NeoButton
                                title={isUploading ? 'uploading...' : 'submit'}
                                onPress={handleSubmit}
                                style={{ flex: 1 }}
                                variant="primary"
                            />
                            <NeoButton
                                title="retake"
                                onPress={handleRetake}
                                style={{ flex: 1, opacity: 0.9 }}
                                variant="outline"
                            />
                        </>
                    ) : null}
                </View>
            </View>
        </SafeAreaView>
    );
}
