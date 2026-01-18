import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { NeoButton } from '@/components/ui/NeoButton';
import { useSocket } from '@/hooks/useSocket';

export default function PrizesScreen() {
    const router = useRouter();
    const { awards, leaveLobby, lobbyState, socket } = useSocket();

    const handleReturnToRoom = () => {
        if (!lobbyState || !lobbyState.code) {
            // Fallback if state is lost
            router.dismissAll();
            router.replace('/');
            return;
        }

        const isHost = socket?.id === lobbyState.hostId;
        const currentPlayer = lobbyState.players.find(p => p.id === socket?.id);
        const nickname = currentPlayer?.name || 'Player';

        // Dismiss all screens and navigate fresh to waiting room
        router.dismissAll();

        if (isHost) {
            router.replace({
                pathname: '/host-waiting-room',
                params: {
                    nickname,
                    roomPin: lobbyState.code
                }
            });
        } else {
            router.replace({
                pathname: '/player-waiting-room',
                params: {
                    nickname,
                    roomPin: lobbyState.code
                }
            });
        }
    };

    const handleQuitRoom = () => {
        leaveLobby();
        router.dismissAll();
        router.replace('/');
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.neo.background }}>
            <View className="flex-1 px-6 pt-10">
                {/* Title */}
                <Text
                    className="text-2xl text-neo-text mb-12 text-center"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                >
                    Game Summary
                </Text>

                {/* Summary Items */}
                <View className="flex-1 gap-8">
                    {awards?.judgesFavorite && (
                        <View>
                            <Text
                                className="text-xl text-neo-text mb-2"
                                style={{ fontFamily: 'Nunito_600SemiBold' }}
                            >
                                Judge's Fav Target: <Text style={{ fontFamily: 'Nunito_400Regular' }}>{awards.judgesFavorite.name}</Text>
                            </Text>
                            <Text className="text-neo-text opacity-60" style={{ fontFamily: 'Nunito_400Regular' }}>
                                Won {awards.judgesFavorite.wins} rounds
                            </Text>
                        </View>
                    )}

                    {awards?.mostClueless && (
                        <View>
                            <Text
                                className="text-xl text-neo-text mb-2"
                                style={{ fontFamily: 'Nunito_600SemiBold' }}
                            >
                                The Most Clueless: <Text style={{ fontFamily: 'Nunito_400Regular' }}>{awards.mostClueless.name}</Text>
                            </Text>
                            <Text className="text-neo-text opacity-60" style={{ fontFamily: 'Nunito_400Regular' }}>
                                Won {awards.mostClueless.wins} rounds (story protagonist!)
                            </Text>
                        </View>
                    )}
                </View>

                {/* Footer Buttons */}
                <View className="gap-5 pb-20">
                    <NeoButton
                        title="Return to Room"
                        onPress={handleReturnToRoom}
                        variant="primary"
                    // style={{ backgroundColor: '#C88A58' }} // Custom brownish color from image
                    />
                    <NeoButton
                        title="Quit Room"
                        onPress={handleQuitRoom}
                        variant="outline"
                        style={{ borderColor: '#C88A58' }}
                        textColor='#000000ff'
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}
