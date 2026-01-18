import { useState, useEffect } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { NeoButton } from '@/components/ui/NeoButton';
import { NeoCounter } from '@/components/ui/NeoCounter';
import { Colors } from '@/constants/theme';
import { useSocket } from '@/hooks/useSocket';
import { FloatingBackground } from '@/components/FloatingBackground';

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
        router.push('/loading');
    };

    const handleLeaveRoom = () => {
        leaveLobby();
        router.replace('/');
    };

    const currentPlayerId = socket?.id;
    const isHost = !!(lobbyState && currentPlayerId && lobbyState.hostId === currentPlayerId);
    const hostPlayer = lobbyState?.players?.find(p => p.id === currentPlayerId);
    const isHostReady = hostPlayer?.isReady ?? false;

    // Note: Navigation to game is handled by loading screen

    // Show errors
    useEffect(() => {
        if (error) {
            Alert.alert('Error', error);
        }
    }, [error]);

    return (
        <SafeAreaView className="flex-1 bg-neo-background">
            <FloatingBackground />

            <View className="absolute top-16 left-6 z-50">
                <TouchableOpacity
                    onPress={handleLeaveRoom}
                    activeOpacity={0.8}
                    className="w-10 h-10 relative"
                >
                    <View className="absolute top-[2px] left-[2px] right-[-2px] bottom-[-2px] bg-neo-shadow rounded-md" />
                    <View className="w-full h-full bg-neo-card border-2 border-neo-border items-center justify-center rounded-md">
                        <Ionicons name="chevron-back" size={24} color={Colors.neo.text} />
                    </View>
                </TouchableOpacity>
            </View>

            <View className="flex-1 w-full p-5 pt-16 pb-4">
                {/* Main Content Card */}
                <View
                    className="flex-1 w-full border-4 border-neo-border rounded-xl p-5 mb-4"
                    style={{
                        backgroundColor: Colors.neo.primary,
                        opacity: 0.95, // Increased opacity for better visibility
                        shadowColor: Colors.neo.shadow,
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                    }}
                >
                    {/* Header Section - Block 1 */}
                    <View className="w-full bg-neo-background border-2 border-black p-4 mb-2 rounded-lg transform">
                        <View className="items-center">
                            <View className="bg-neo-background border-4 border-black px-8 py-2 transform -rotate-2 shadow-neo-deep">
                                <Text
                                    className="text-lg text-neo-text text-center font-bold"
                                    style={{ fontFamily: 'Nunito_700Bold' }}
                                >
                                    ROOM PIN
                                </Text>
                                <Text
                                    className="text-5xl text-neo-text pt-2 text-center"
                                    style={{ fontFamily: 'Audiowide_400Regular' }}
                                >
                                    {roomPin}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Game Settings - Block 2 */}
                    <View className="w-full bg-neo-background border-2 border-neo-border rounded-lg p-4 mb-2">
                        <Text
                            className="text-sm text-neo-text/50 uppercase tracking-wider mb-3 font-bold"
                            style={{ fontFamily: 'Nunito_700Bold' }}
                        >
                            SETTINGS
                        </Text>
                        <View className="w-full gap-2">
                            <View className="h-[60px]">
                                <NeoCounter
                                    label="ROUNDS"
                                    value={rounds}
                                    onChange={handleRoundsChange}
                                    min={3}
                                    max={6}
                                />
                            </View>
                            {/* Divider Line */}
                            <View className="h-[2px] bg-neo-border opacity-20 w-full mb-2" />
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
                    </View>

                    {/* Player List - Block 3 */}
                    <View className="w-full bg-neo-background border-2 border-neo-border rounded-lg p-4 flex-1">
                        <Text
                            className="text-sm text-neo-text/50 uppercase tracking-wider mb-2 font-bold"
                            style={{ fontFamily: 'Nunito_700Bold' }}
                        >
                            PLAYERS ({players.length}/8)
                        </Text>
                        <View className="flex-row flex-wrap gap-2.5">
                            {players.map((player) => (
                                <View
                                    key={player.id}
                                    className="flex-row items-center bg-neo-background border-2 border-neo-border rounded-xl px-3 py-2"
                                    style={{
                                        shadowColor: Colors.neo.shadow,
                                        shadowOffset: { width: 1, height: 1 },
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

                {/* Footer outside the card */}
                <View className="gap-4">
                    <NeoButton
                        title={isHost && !isHostReady ? 'READY' : 'START GAME'}
                        onPress={isHost && !isHostReady ? () => setReady(true) : handleStartGame}
                        variant={isHost && !isHostReady ? 'outline' : 'primary'}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}
