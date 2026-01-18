import { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { NeoButton } from '@/components/ui/NeoButton';
import { NeoCounter } from '@/components/ui/NeoCounter';
import { Colors } from '@/constants/theme';
import { useSocket } from '@/hooks/useSocket';

export default function HostWaitingRoomScreen() {
    const params = useLocalSearchParams<{
        nickname: string;
        roomPin?: string;
    }>();
    const router = useRouter();

    const nickname = params.nickname;
    const { lobbyState, error, updateSettings, startGame, setReady, leaveLobby, socket, pendingNavigation, clearPendingNavigation } = useSocket();

    const roomPin = params.roomPin || lobbyState?.code || '----';
    const players = lobbyState?.players || [{ id: '1', name: nickname || 'Host', isReady: true }];

    const [rounds, setRounds] = useState(lobbyState?.settings?.rounds || 3);
    const [timer, setTimer] = useState(lobbyState?.settings?.roundTimeSeconds || 30);

    // Update local state when lobby state changes
    useEffect(() => {
        if (lobbyState?.settings) {
            setRounds(lobbyState.settings.rounds);
            setTimer(lobbyState.settings.roundTimeSeconds);
        }
    }, [lobbyState?.settings]);

    // Handle rounds change - update server
    const handleRoundsChange = (value: number) => {
        setRounds(value);
        updateSettings({ rounds: value });
    };

    // Handle timer change - update server
    const handleTimerChange = (value: number) => {
        setTimer(value);
        updateSettings({ roundTimeSeconds: value });
    };

    // Handle start game
    const handleStartGame = () => {
        startGame();
    };

    const handleLeaveRoom = () => {
        leaveLobby();
        router.replace('/');
    };

    const currentPlayerId = socket?.id;
    const isHost = !!(lobbyState && currentPlayerId && lobbyState.hostId === currentPlayerId);
    const hostPlayer = lobbyState?.players?.find(p => p.id === currentPlayerId);
    const isHostReady = hostPlayer?.isReady ?? false;

    // Navigate to game when it starts
    useEffect(() => {
        if (pendingNavigation && pendingNavigation.type === 'game') {
            clearPendingNavigation();
            router.push('/game');
        }
    }, [pendingNavigation, clearPendingNavigation, router]);

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
                <View className="items-center mb-6 gap-4">
                    <Text
                        className="text-lg text-neo-text"
                        style={{ fontFamily: 'Nunito_700Bold' }}
                    >
                        ROOM PIN:
                    </Text>
                    <Text
                        className="text-5xl text-neo-text pt-2"
                        style={{ fontFamily: 'Nunito_700Bold' }}
                    >
                        {roomPin}
                    </Text>
                </View>

                {/* Game Settings - Host can change */}
                <View className="w-full mb-8 gap-4">
                    <View className="h-[60px]">
                        <NeoCounter
                            label="ROUNDS"
                            value={rounds}
                            onChange={handleRoundsChange}
                            min={3}
                            max={6}
                        />
                    </View>
                    <View className="h-[60px]">
                        <NeoCounter
                            label="TIMER"
                            value={timer}
                            onChange={handleTimerChange}
                            min={15}
                            max={60}
                            step={15}
                            unit="sec"
                        />
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

            {/* Footer */}
            <View className="p-5 pb-10 gap-4">
                <NeoButton
                    title="LEAVE ROOM"
                    onPress={handleLeaveRoom}
                    variant="outline"
                />
                <NeoButton
                    title={isHost && !isHostReady ? 'READY' : 'START GAME'}
                    onPress={isHost && !isHostReady ? () => setReady(true) : handleStartGame}
                    variant="primary"
                />
            </View>
        </SafeAreaView>
    );
}
