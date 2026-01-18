import { useCallback, useEffect, useRef } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { NeoButton } from '@/components/ui/NeoButton';
import { Colors } from '@/constants/theme';
import { useSocket } from '@/hooks/useSocket';
import { FloatingBackground } from '@/components/FloatingBackground';

export default function PlayerWaitingRoomScreen() {
    const params = useLocalSearchParams<{
        nickname: string;
        roomPin: string;
    }>();

    const router = useRouter();

    const nickname = params.nickname;
    const roomPin = params.roomPin;

    const { lobbyState, error, setReady, leaveLobby, socket, pendingNavigation, clearPendingNavigation } = useSocket();

    // Get current player's ready status from lobby state
    const currentPlayerId = socket?.id;
    const currentPlayer = lobbyState?.players?.find(p => p.id === currentPlayerId);
    const isReady = currentPlayer?.isReady ?? false;

    const hasSwitchedToHostRef = useRef(false);
    const switchToHost = useCallback(
        (pin: string) => {
            if (hasSwitchedToHostRef.current) return;
            hasSwitchedToHostRef.current = true;
            clearPendingNavigation();
            router.replace({
                pathname: '/host-waiting-room',
                params: { roomPin: pin, nickname },
            });
        },
        [clearPendingNavigation, router, nickname]
    );

    // Use lobby state if available, otherwise show defaults
    const rounds = lobbyState?.settings?.rounds ?? 3;
    const timer = lobbyState?.settings?.roundTimeSeconds ?? 30;
    const players = lobbyState?.players || [
        { id: '1', name: 'Waiting...', isReady: false },
    ];

    const handleReady = () => {
        setReady(!isReady);
    };

    const handleLeaveRoom = () => {
        leaveLobby();
        router.replace('/');
    };

    // Navigate to loading/game when it starts
    useEffect(() => {
        if (pendingNavigation && pendingNavigation.type === 'host-waiting-room') {
            switchToHost(pendingNavigation.roomPin);
            return;
        }

        if (pendingNavigation && pendingNavigation.type === 'loading') {
            clearPendingNavigation();
            router.push('/loading');
        }
    }, [pendingNavigation, clearPendingNavigation, router, switchToHost]);

    useEffect(() => {
        if (!lobbyState?.code) return;
        if (!currentPlayerId) return;
        if (lobbyState.hostId !== currentPlayerId) return;
        switchToHost(lobbyState.code);
    }, [lobbyState?.code, lobbyState?.hostId, currentPlayerId, switchToHost]);

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
                        opacity: 0.95, // Consistent opacity with host
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
                        <View className="flex-row items-center justify-between w-full mb-3">
                            <Text
                                className="text-xl text-neo-text"
                                style={{ fontFamily: 'Nunito_600SemiBold' }}
                            >
                                ROUNDS:
                            </Text>
                            <View
                                className="px-6 py-2 bg-neo-background border-2 border-neo-border rounded-lg min-w-[100px] items-center"
                                style={{
                                    shadowColor: Colors.neo.shadow,
                                    shadowOffset: { width: 1, height: 1 },
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
                        {/* Divider Line */}
                        <View className="h-[2px] bg-neo-border opacity-20 w-full mb-3" />
                        <View className="flex-row items-center justify-between w-full">
                            <Text
                                className="text-xl text-neo-text"
                                style={{ fontFamily: 'Nunito_600SemiBold' }}
                            >
                                TIMER:
                            </Text>
                            <View
                                className="px-6 py-2 bg-neo-background border-2 border-neo-border rounded-lg min-w-[100px] items-center"
                                style={{
                                    shadowColor: Colors.neo.shadow,
                                    shadowOffset: { width: 1, height: 1 },
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

                {/* Footer */}
                <View className="gap-4">
                    <NeoButton
                        title={isReady ? "READY ✓" : "READY"}
                        onPress={handleReady}
                        variant={isReady ? "primary" : "outline"}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}
