import { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { NeoButton } from '@/components/ui/NeoButton';
import { Colors } from '@/constants/theme';
import { useSocket } from '@/hooks/useSocket';

export default function PlayerWaitingRoomScreen() {
    const params = useLocalSearchParams<{
        nickname: string;
        roomPin: string;
    }>();

    const router = useRouter();

    const nickname = params.nickname;
    const roomPin = params.roomPin;

    const { lobbyState, error, setReady, gameStart, socket } = useSocket();

    // Get current player's ready status from lobby state
    const currentPlayerId = socket?.id;
    const currentPlayer = lobbyState?.players?.find(p => p.id === currentPlayerId);
    const isReady = currentPlayer?.isReady ?? false;

    // Use lobby state if available, otherwise show defaults
    const rounds = lobbyState?.settings?.rounds ?? 3;
    const timer = lobbyState?.settings?.roundTimeSeconds ?? 30;
    const players = lobbyState?.players || [
        { id: '1', name: 'Waiting...', isReady: false },
    ];

    const handleReady = () => {
        setReady(!isReady);
    };

    // Navigate to game when it starts
    useEffect(() => {
        if (gameStart) {
            router.push('/game');
        }
    }, [gameStart]);

    // Show errors
    useEffect(() => {
        if (error) {
            Alert.alert('Error', error);
        }
    }, [error]);

    return (
        <SafeAreaView className="flex-1 bg-neo-background">
            <View className="flex-1 w-full items-center p-5">
                {/* Header Section */}
                <View className="items-center mb-8">
                    <Text
                        className="text-lg mb-1 text-neo-text"
                        style={{ fontFamily: 'Nunito_700Bold' }}
                    >
                        ROOM PIN:
                    </Text>
                    <Text
                        className="text-5xl text-neo-text"
                        style={{ fontFamily: 'Nunito_700Bold' }}
                    >
                        {roomPin}
                    </Text>
                </View>

                {/* Game Settings - Read-only display for players */}
                <View className="w-full mb-8 gap-4">
                    <View className="flex-row items-center justify-between w-full">
                        <Text
                            className="text-xl text-neo-text"
                            style={{ fontFamily: 'Nunito_600SemiBold' }}
                        >
                            ROUNDS:
                        </Text>
                        <View
                            className="px-6 py-3 bg-neo-card border-2 border-neo-border rounded-lg min-w-[100px] items-center"
                            style={{
                                shadowColor: Colors.neo.shadow,
                                shadowOffset: { width: 2, height: 2 },
                                shadowOpacity: 1,
                                shadowRadius: 0,
                            }}
                        >
                            <Text
                                className="text-xl text-neo-text"
                                style={{ fontFamily: 'Nunito_700Bold' }}
                            >
                                {rounds}
                            </Text>
                        </View>
                    </View>
                    <View className="flex-row items-center justify-between w-full">
                        <Text
                            className="text-xl text-neo-text"
                            style={{ fontFamily: 'Nunito_600SemiBold' }}
                        >
                            TIMER:
                        </Text>
                        <View
                            className="px-6 py-3 bg-neo-card border-2 border-neo-border rounded-lg min-w-[100px] items-center"
                            style={{
                                shadowColor: Colors.neo.shadow,
                                shadowOffset: { width: 2, height: 2 },
                                shadowOpacity: 1,
                                shadowRadius: 0,
                            }}
                        >
                            <Text
                                className="text-xl text-neo-text"
                                style={{ fontFamily: 'Nunito_700Bold' }}
                            >
                                {timer} sec
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Player List */}
                <View className="w-full mb-5">
                    <Text
                        className="text-lg mb-2 text-left text-neo-text"
                        style={{ fontFamily: 'Nunito_700Bold' }}
                    >
                        PLAYERS ({players.length}/8)
                    </Text>
                    <View className="flex-row flex-wrap gap-2.5">
                        {players.map((player) => (
                            <View
                                key={player.id}
                                className="flex-row items-center bg-neo-card border-2 border-neo-border rounded-xl px-3 py-2"
                                style={{
                                    shadowColor: Colors.neo.shadow,
                                    shadowOffset: { width: 2, height: 2 },
                                    shadowOpacity: 1,
                                    shadowRadius: 0,
                                }}
                            >
                                <Text
                                    className="text-base text-neo-text"
                                    style={{ fontFamily: 'Nunito_600SemiBold' }}
                                >
                                    {player.name}
                                </Text>
                                {player.isReady ? (
                                    <Ionicons name="checkmark-circle" size={20} color="green" style={{ marginLeft: 6 }} />
                                ) : null}
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* Ready Button */}
            <View className="p-5 pb-24">
                <NeoButton
                    title={isReady ? "READY ✓" : "READY"}
                    onPress={handleReady}
                    variant={isReady ? "primary" : "outline"}
                />
            </View>
        </SafeAreaView>
    );
}
